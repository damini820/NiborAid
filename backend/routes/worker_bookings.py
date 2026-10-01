from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection
from utils.auth import require_worker

router = APIRouter(
    prefix="/worker/bookings",
    tags=["Worker Bookings"]
)


# ============================================================
# GET WORKER BOOKINGS
# ============================================================

@router.get("")
def get_worker_bookings(
    current_user: dict = Depends(require_worker)
):
    connection = get_db_connection()

    if not connection:
        return {
            "error": "Database connection failed"
        }

    cursor = connection.cursor(dictionary=True)

    query = """
        SELECT
            bookings.id,
            users.name AS customer_name,
            users.phone AS customer_phone,
            services.name AS service_name,
            bookings.booking_date,
            TIME_FORMAT(bookings.start_time, '%H:%i') AS start_time,
            TIME_FORMAT(bookings.end_time, '%H:%i') AS end_time,
            bookings.problem_description,
            bookings.status,
            bookings.created_at
        FROM bookings
        JOIN workers
            ON bookings.worker_id = workers.id
        JOIN users
            ON bookings.customer_id = users.id
        JOIN services
            ON bookings.service_id = services.id
        WHERE workers.user_id = %s
        ORDER BY bookings.booking_date, bookings.start_time
    """

    cursor.execute(
        query,
        (current_user["user_id"],)
    )

    bookings = cursor.fetchall()

    cursor.close()
    connection.close()

    return bookings


# ============================================================
# ACCEPT / REJECT BOOKING
# ============================================================

@router.patch("/{booking_id}/status")
def update_booking_status(
    booking_id: int,
    status: str,
    current_user: dict = Depends(require_worker)
):
    # Only these two status changes are allowed
    if status not in ["accepted", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be accepted or rejected"
        )

    connection = get_db_connection()

    if not connection:
        return {
            "error": "Database connection failed"
        }

    cursor = connection.cursor(dictionary=True)

    # --------------------------------------------------------
    # 1. Make sure this booking belongs to this worker
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT
            bookings.id,
            bookings.worker_id,
            bookings.booking_date,
            bookings.start_time,
            bookings.end_time,
            bookings.status
        FROM bookings
        JOIN workers
            ON bookings.worker_id = workers.id
        WHERE bookings.id = %s
        AND workers.user_id = %s
        """,
        (
            booking_id,
            current_user["user_id"]
        )
    )

    booking = cursor.fetchone()

    if not booking:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # --------------------------------------------------------
    # 2. Only pending bookings can be updated
    # --------------------------------------------------------

    if booking["status"] != "pending":
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Only pending bookings can be updated"
        )

    # --------------------------------------------------------
    # 3. Before accepting, check for overlapping booking
    # --------------------------------------------------------

    if status == "accepted":

        cursor.execute(
            """
            SELECT id
            FROM bookings
            WHERE worker_id = %s
            AND booking_date = %s
            AND id != %s
            AND status = 'accepted'
            AND start_time < %s
            AND end_time > %s
            """,
            (
                booking["worker_id"],
                booking["booking_date"],
                booking_id,
                booking["end_time"],
                booking["start_time"]
            )
        )

        overlapping_booking = cursor.fetchone()

        if overlapping_booking:

            cursor.close()
            connection.close()

            raise HTTPException(
                status_code=400,
                detail="Worker already has an overlapping accepted booking"
            )

    # --------------------------------------------------------
    # 4. Update booking status
    # --------------------------------------------------------

    cursor.execute(
        """
        UPDATE bookings
        SET status = %s
        WHERE id = %s
        """,
        (
            status,
            booking_id
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": f"Booking {status} successfully",
        "booking_id": booking_id,
        "status": status
    }


# ============================================================
# COMPLETE BOOKING
# ============================================================

@router.patch("/{booking_id}/complete")
def complete_booking(
    booking_id: int,
    current_user: dict = Depends(require_worker)
):
    connection = get_db_connection()

    if not connection:
        return {
            "error": "Database connection failed"
        }

    cursor = connection.cursor(dictionary=True)

    # --------------------------------------------------------
    # 1. Make sure this booking belongs to this worker
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT
            bookings.id,
            bookings.status
        FROM bookings
        JOIN workers
            ON bookings.worker_id = workers.id
        WHERE bookings.id = %s
        AND workers.user_id = %s
        """,
        (
            booking_id,
            current_user["user_id"]
        )
    )

    booking = cursor.fetchone()

    if not booking:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    # --------------------------------------------------------
    # 2. Only accepted bookings can be completed
    # --------------------------------------------------------

    if booking["status"] != "accepted":
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Only accepted bookings can be completed"
        )

    # --------------------------------------------------------
    # 3. Mark booking as completed
    # --------------------------------------------------------

    cursor.execute(
        """
        UPDATE bookings
        SET status = 'completed'
        WHERE id = %s
        """,
        (booking_id,)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Booking completed successfully",
        "booking_id": booking_id,
        "status": "completed"
    }