from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, model_validator
from datetime import time
from database import get_db_connection
from utils.auth import require_worker


router = APIRouter(
    prefix="/worker/availability",
    tags=["Worker Availability"]
)


# ============================================================
# REQUEST MODEL
# ============================================================

class AvailabilityCreate(BaseModel):
    day_of_week: str
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def validate_availability(self):

        valid_days = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ]

        if self.day_of_week not in valid_days:
            raise ValueError("Invalid day of week")

        if self.start_time >= self.end_time:
            raise ValueError(
                "Start time must be before end time"
            )

        return self


# ============================================================
# ADD AVAILABILITY
# ============================================================

@router.post("")
def add_availability(
    availability: AvailabilityCreate,
    current_user: dict = Depends(require_worker)
):

    connection = get_db_connection()

    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT id
            FROM workers
            WHERE user_id = %s
            """,
            (current_user["user_id"],)
        )

        worker = cursor.fetchone()

        if not worker:
            raise HTTPException(
                status_code=404,
                detail="Worker profile not found"
            )

        worker_id = worker["id"]

        cursor.execute(
            """
            SELECT id
            FROM availability
            WHERE worker_id = %s
            AND day_of_week = %s
            AND start_time = %s
            AND end_time = %s
            """,
            (
                worker_id,
                availability.day_of_week,
                availability.start_time,
                availability.end_time
            )
        )

        existing = cursor.fetchone()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="This availability already exists"
            )

        cursor.execute(
            """
            INSERT INTO availability
            (
                worker_id,
                day_of_week,
                start_time,
                end_time
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                worker_id,
                availability.day_of_week,
                availability.start_time,
                availability.end_time
            )
        )

        availability_id = cursor.lastrowid

        connection.commit()

        return {
            "message": "Availability added successfully",
            "availability_id": availability_id
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception as e:
        connection.rollback()

        print("Add availability error:", e)

        raise HTTPException(
            status_code=500,
            detail="Unable to add availability"
        )

    finally:
        cursor.close()
        connection.close()


# ============================================================
# GET MY AVAILABILITY
# ============================================================

@router.get("")
def get_my_availability(
    current_user: dict = Depends(require_worker)
):

    connection = get_db_connection()

    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                availability.id,
                availability.day_of_week,
                TIME_FORMAT(
                    availability.start_time,
                    '%H:%i'
                ) AS start_time,
                TIME_FORMAT(
                    availability.end_time,
                    '%H:%i'
                ) AS end_time
            FROM availability
            JOIN workers
                ON availability.worker_id = workers.id
            WHERE workers.user_id = %s
            ORDER BY
                FIELD(
                    availability.day_of_week,
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday'
                ),
                availability.start_time
            """,
            (current_user["user_id"],)
        )

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


# ============================================================
# GET PUBLIC WORKER AVAILABILITY
# ============================================================

@router.get("/worker/{worker_id}")
def get_worker_availability(worker_id: int):

    connection = get_db_connection()

    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        # ----------------------------------------------------
        # Make sure worker exists
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM workers
            WHERE id = %s
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
        # Get weekly availability
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                day_of_week,
                TIME_FORMAT(
                    start_time,
                    '%H:%i'
                ) AS start_time,
                TIME_FORMAT(
                    end_time,
                    '%H:%i'
                ) AS end_time
            FROM availability
            WHERE worker_id = %s
            ORDER BY
                FIELD(
                    day_of_week,
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday'
                ),
                start_time
            """,
            (worker_id,)
        )

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


# ============================================================
# DELETE AVAILABILITY
# ============================================================

@router.delete("/{availability_id}")
def delete_availability(
    availability_id: int,
    current_user: dict = Depends(require_worker)
):

    connection = get_db_connection()

    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT availability.id
            FROM availability
            JOIN workers
                ON availability.worker_id = workers.id
            WHERE availability.id = %s
            AND workers.user_id = %s
            """,
            (
                availability_id,
                current_user["user_id"]
            )
        )

        availability = cursor.fetchone()

        if not availability:
            raise HTTPException(
                status_code=404,
                detail="Availability not found"
            )

        cursor.execute(
            """
            DELETE FROM availability
            WHERE id = %s
            """,
            (availability_id,)
        )

        connection.commit()

        return {
            "message": "Availability deleted successfully",
            "availability_id": availability_id
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception as e:
        connection.rollback()

        print(
            "Delete availability error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete availability"
        )

    finally:
        cursor.close()
        connection.close()


# ============================================================
# UPDATE AVAILABILITY
# ============================================================

@router.put("/{availability_id}")
def update_availability(
    availability_id: int,
    availability: AvailabilityCreate,
    current_user: dict = Depends(require_worker)
):

    connection = get_db_connection()

    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT availability.id
            FROM availability
            JOIN workers
                ON availability.worker_id = workers.id
            WHERE availability.id = %s
            AND workers.user_id = %s
            """,
            (
                availability_id,
                current_user["user_id"]
            )
        )

        existing = cursor.fetchone()

        if not existing:
            raise HTTPException(
                status_code=404,
                detail="Availability not found"
            )

        cursor.execute(
            """
            UPDATE availability
            SET
                day_of_week = %s,
                start_time = %s,
                end_time = %s
            WHERE id = %s
            """,
            (
                availability.day_of_week,
                availability.start_time,
                availability.end_time,
                availability_id
            )
        )

        connection.commit()

        return {
            "message": "Availability updated successfully",
            "availability_id": availability_id
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception as e:
        connection.rollback()

        print(
            "Update availability error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update availability"
        )

    finally:
        cursor.close()
        connection.close()