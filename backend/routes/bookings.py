from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection
from models.booking import BookingCreate
from utils.auth import get_current_user
from datetime import datetime


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


@router.post("")
def create_booking(
    booking: BookingCreate,
    current_user: dict = Depends(get_current_user)
):

    # ============================================================
    # ONLY CUSTOMERS CAN CREATE BOOKINGS
    # ============================================================

    if current_user["role"] != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can create bookings"
        )

    connection = get_db_connection()

    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        # ========================================================
        # 1. CHECK WORKER EXISTS
        # ========================================================

        cursor.execute(
            """
            SELECT
                id,
                is_available
            FROM workers
            WHERE id = %s
            """,
            (booking.worker_id,)
        )

        worker = cursor.fetchone()

        if not worker:
            raise HTTPException(
                status_code=404,
                detail="Worker not found"
            )

        if not worker["is_available"]:
            raise HTTPException(
                status_code=400,
                detail="Worker is currently unavailable"
            )

        # ========================================================
        # 2. CHECK SERVICE EXISTS
        # ========================================================

        cursor.execute(
            """
            SELECT id
            FROM services
            WHERE id = %s
            """,
            (booking.service_id,)
        )

        service = cursor.fetchone()

        if not service:
            raise HTTPException(
                status_code=404,
                detail="Service not found"
            )

        # ========================================================
        # 3. CHECK WORKER PROVIDES THIS SERVICE
        # ========================================================

        cursor.execute(
            """
            SELECT service_id
            FROM worker_services
            WHERE worker_id = %s
            AND service_id = %s
            """,
            (
                booking.worker_id,
                booking.service_id
            )
        )

        worker_service = cursor.fetchone()

        if not worker_service:
            raise HTTPException(
                status_code=400,
                detail="Worker does not provide this service"
            )

        # ========================================================
        # 4. CONVERT BOOKING DATE TO WEEKDAY
        # ========================================================

        booking_date = booking.booking_date

        booking_weekday = booking_date.strftime("%A")

        print("\n========== BOOKING AVAILABILITY ==========")
        print("Booking date:", booking_date)
        print("Weekday:", booking_weekday)
        print("Start time:", booking.start_time)
        print("End time:", booking.end_time)
        print("Worker ID:", booking.worker_id)
        print("==========================================\n")

        # ========================================================
        # 5. CHECK WEEKLY WORKER AVAILABILITY
        #
        # Example:
        #
        # Worker availability:
        # Wednesday 09:00 - 13:00
        #
        # Customer requests:
        # Wednesday 10:00 - 12:00
        #
        # This is VALID.
        # ========================================================

        cursor.execute(
            """
            SELECT id
            FROM availability

            WHERE worker_id = %s

            AND day_of_week = %s

            AND start_time <= %s

            AND end_time >= %s
            """,
            (
                booking.worker_id,
                booking_weekday,
                booking.start_time,
                booking.end_time
            )
        )

        available = cursor.fetchone()

        if not available:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Worker is not available "
                    "at the selected date and time"
                )
            )

        # ========================================================
        # 6. CHECK OVERLAPPING BOOKINGS
        #
        # Only pending and accepted bookings block the worker.
        #
        # Example:
        #
        # Existing: 10:00 - 12:00
        # New:      11:00 - 13:00
        #
        # OVERLAP → reject
        #
        # Existing: 10:00 - 12:00
        # New:      12:00 - 14:00
        #
        # NO overlap → allowed
        # ========================================================

        cursor.execute(
            """
            SELECT
                id,
                start_time,
                end_time,
                status

            FROM bookings

            WHERE worker_id = %s

            AND booking_date = %s

            AND status IN (
                'pending',
                'accepted'
            )

            AND start_time < %s

            AND end_time > %s
            """,
            (
                booking.worker_id,
                booking.booking_date,
                booking.end_time,
                booking.start_time
            )
        )

        overlapping_booking = cursor.fetchone()

        if overlapping_booking:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Worker already has a booking "
                    "at this time"
                )
            )

        # ========================================================
        # 7. CREATE BOOKING
        # ========================================================

        cursor.execute(
            """
            INSERT INTO bookings
            (
                customer_id,
                worker_id,
                service_id,
                booking_date,
                start_time,
                end_time,
                problem_description
            )

            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                current_user["user_id"],
                booking.worker_id,
                booking.service_id,
                booking.booking_date,
                booking.start_time,
                booking.end_time,
                booking.problem_description
            )
        )

        booking_id = cursor.lastrowid

        connection.commit()

        return {
            "message": "Booking created successfully",
            "booking_id": booking_id
        }

    # ============================================================
    # EXPECTED ERRORS
    # ============================================================

    except HTTPException:

        connection.rollback()
        raise

    # ============================================================
    # UNEXPECTED ERRORS
    # ============================================================

    except Exception as e:

        connection.rollback()

        print(
            "BOOKING ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to create booking"
        )

    finally:

        cursor.close()
        connection.close()