from fastapi import APIRouter, Depends, HTTPException
from database import get_db_connection
from utils.auth import get_current_user
from pydantic import BaseModel, model_validator


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


# ============================================================
# REVIEW MODEL
# ============================================================

class ReviewCreate(BaseModel):
    booking_id: int
    rating: int
    comment: str | None = None

    @model_validator(mode="after")
    def validate_review(self):

        if self.rating < 1 or self.rating > 5:
            raise ValueError(
                "Rating must be between 1 and 5"
            )

        if self.comment is not None:

            self.comment = self.comment.strip()

            if len(self.comment) > 500:
                raise ValueError(
                    "Review comment cannot exceed 500 characters"
                )

        return self


# ============================================================
# CREATE REVIEW
# ============================================================

@router.post("")
def create_review(
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user)
):

    if current_user["role"] != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can submit reviews"
        )

    connection = get_db_connection()

    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        # ----------------------------------------------------
        # 1. Check booking belongs to customer
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                worker_id,
                service_id,
                status
            FROM bookings
            WHERE id = %s
            AND customer_id = %s
            """,
            (
                review.booking_id,
                current_user["user_id"]
            )
        )

        booking = cursor.fetchone()

        if not booking:

            raise HTTPException(
                status_code=404,
                detail="Booking not found"
            )

        # ----------------------------------------------------
        # 2. Only completed bookings can be reviewed
        # ----------------------------------------------------

        if booking["status"] != "completed":

            raise HTTPException(
                status_code=400,
                detail="Only completed bookings can be reviewed"
            )

        # ----------------------------------------------------
        # 3. Prevent duplicate review
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM reviews
            WHERE booking_id = %s
            """,
            (review.booking_id,)
        )

        existing_review = cursor.fetchone()

        if existing_review:

            raise HTTPException(
                status_code=400,
                detail="This booking has already been reviewed"
            )

        # ----------------------------------------------------
        # 4. Insert review
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO reviews
            (
                booking_id,
                customer_id,
                worker_id,
                rating,
                comment
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                review.booking_id,
                current_user["user_id"],
                booking["worker_id"],
                review.rating,
                review.comment
            )
        )

        review_id = cursor.lastrowid

        # ----------------------------------------------------
        # 5. Recalculate worker rating
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                ROUND(AVG(rating), 2) AS average_rating
            FROM reviews
            WHERE worker_id = %s
            """,
            (booking["worker_id"],)
        )

        average_rating = cursor.fetchone()["average_rating"]

        # ----------------------------------------------------
        # 6. Update worker rating
        # ----------------------------------------------------

        cursor.execute(
            """
            UPDATE workers
            SET rating = %s
            WHERE id = %s
            """,
            (
                average_rating,
                booking["worker_id"]
            )
        )

        connection.commit()

        return {
            "message": "Review submitted successfully",
            "review_id": review_id
        }

    except HTTPException:

        connection.rollback()
        raise

    except Exception as e:

        connection.rollback()

        print(
            "CREATE REVIEW ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to submit review"
        )

    finally:

        cursor.close()
        connection.close()


# ============================================================
# GET CUSTOMER'S REVIEWS + REVIEWABLE BOOKINGS
# ============================================================

@router.get("/my")
def get_my_reviews(
    current_user: dict = Depends(get_current_user)
):

    if current_user["role"] != "customer":

        raise HTTPException(
            status_code=403,
            detail="Only customers can view their reviews"
        )

    connection = get_db_connection()

    if not connection:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        # ----------------------------------------------------
        # Get completed bookings belonging to customer
        # ----------------------------------------------------
        #
        # LEFT JOIN reviews allows us to know whether
        # each completed booking has already been reviewed.
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT

    bookings.id AS booking_id,

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

    workers.id AS worker_id,
    worker_users.name AS worker_name,

    services.id AS service_id,
    services.name AS service_name,

    reviews.id AS review_id,
    reviews.rating,
    reviews.comment,
    reviews.created_at AS reviewed_at

FROM bookings

            JOIN workers
                ON bookings.worker_id = workers.id

            JOIN users AS worker_users
                ON workers.user_id = worker_users.id

            JOIN services
                ON bookings.service_id = services.id

            LEFT JOIN reviews
                ON bookings.id = reviews.booking_id

            WHERE bookings.customer_id = %s

            AND bookings.status = 'completed'

            ORDER BY
                bookings.booking_date DESC,
                bookings.start_time DESC
            """,
            (current_user["user_id"],)
        )

        bookings = cursor.fetchall()

        # ----------------------------------------------------
        # Separate reviewed and reviewable bookings
        # ----------------------------------------------------

        reviews = []
        reviewable_bookings = []

        for booking in bookings:

            if booking["review_id"] is not None:

                reviews.append({
                    "review_id": booking["review_id"],
                    "booking_id": booking["booking_id"],
                    "worker_id": booking["worker_id"],
                    "worker_name": booking["worker_name"],
                    "service_id": booking["service_id"],
                    "service_name": booking["service_name"],
                    "booking_date": booking["booking_date"],
                    "rating": booking["rating"],
                    "comment": booking["comment"],
                    "reviewed_at": booking["reviewed_at"]
                })

            else:

                reviewable_bookings.append({
                    "booking_id": booking["booking_id"],
                    "worker_id": booking["worker_id"],
                    "worker_name": booking["worker_name"],
                    "service_id": booking["service_id"],
                    "service_name": booking["service_name"],
                    "booking_date": booking["booking_date"],
                    "start_time": booking["start_time"],
                    "end_time": booking["end_time"],
                    "problem_description": booking[
                        "problem_description"
                    ]
                })

        return {
            "reviews": reviews,
            "reviewable_bookings": reviewable_bookings,
            "total_reviews": len(reviews),
            "pending_reviews": len(reviewable_bookings)
        }

    except Exception as e:

        print(
            "GET MY REVIEWS ERROR:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to load reviews"
        )

    finally:

        cursor.close()
        connection.close()


# ============================================================
# GET REVIEWS FOR A WORKER
# ============================================================

@router.get("/worker/{worker_id}")
def get_worker_reviews(
    worker_id: int
):

    connection = get_db_connection()

    if not connection:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        # ----------------------------------------------------
        # Check worker
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                workers.id,
                users.name,
                workers.rating

            FROM workers

            JOIN users
                ON workers.user_id = users.id

            WHERE workers.id = %s
            """,
            (worker_id,)
        )

        worker = cursor.fetchone()

        if not worker:

            raise HTTPException(
                status_code=404,
                detail="Worker not found"
            )

        # ----------------------------------------------------
        # Get worker reviews
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT

                reviews.id AS review_id,
                reviews.rating,
                reviews.comment,
                reviews.created_at,

                users.name AS customer_name

            FROM reviews

            JOIN users
                ON reviews.customer_id = users.id

            WHERE reviews.worker_id = %s

            ORDER BY
                reviews.created_at DESC
            """,
            (worker_id,)
        )

        reviews = cursor.fetchall()

        return {
            "worker_id": worker["id"],
            "worker_name": worker["name"],
            "rating": worker["rating"],
            "total_reviews": len(reviews),
            "reviews": reviews
        }

    finally:

        cursor.close()
        connection.close()