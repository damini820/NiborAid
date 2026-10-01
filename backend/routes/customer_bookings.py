from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection
from utils.auth import get_current_user

router = APIRouter(
    prefix="/customer/bookings",
    tags=["Customer Bookings"]
)


@router.get("")
def get_customer_bookings(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can view customer bookings"
        )

    connection = get_db_connection()

    if not connection:
        return {
            "error": "Database connection failed"
        }

    cursor = connection.cursor(dictionary=True)

    query = """
        SELECT
            bookings.id,
            workers.id AS worker_id,

            users.name AS worker_name,
            users.phone AS worker_phone,

            workers.rating AS worker_rating,
            workers.experience_years,

            services.name AS service_name,

            bookings.booking_date,

            TIME_FORMAT(
                bookings.start_time,
                '%H:%i'
            ) AS start_time,

            TIME_FORMAT(
                bookings.end_time,
                '%H:%i'
            ) AS end_time,

            bookings.problem_description,
            bookings.status,
            bookings.created_at,

            reviews.id AS review_id

        FROM bookings

        JOIN workers
            ON bookings.worker_id = workers.id

        JOIN users
            ON workers.user_id = users.id

        JOIN services
            ON bookings.service_id = services.id

        LEFT JOIN reviews
            ON reviews.booking_id = bookings.id

        WHERE bookings.customer_id = %s

        ORDER BY
            bookings.booking_date,
            bookings.start_time
    """

    cursor.execute(
        query,
        (current_user["user_id"],)
    )

    bookings = cursor.fetchall()

    cursor.close()
    connection.close()

    return bookings


@router.patch("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can cancel bookings"
        )

    connection = get_db_connection()

    if not connection:
        return {
            "error": "Database connection failed"
        }

    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT id, status
        FROM bookings
        WHERE id = %s
        AND customer_id = %s
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

    if booking["status"] not in [
        "pending",
        "accepted"
    ]:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="This booking cannot be cancelled"
        )

    cursor.execute(
        """
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = %s
        """,
        (booking_id,)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking_id,
        "status": "cancelled"
    }