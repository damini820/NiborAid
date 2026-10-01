from fastapi import APIRouter, HTTPException, Depends
from models.worker import WorkerCreate
from utils.auth import require_worker
from database import get_db_connection
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2


router = APIRouter(
    prefix="/workers",
    tags=["Workers"]
)


# ============================================================
# DISTANCE CALCULATION
# Haversine formula
# ============================================================

def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):
    """
    Calculate distance between two latitude/longitude points
    using the Haversine formula.

    Returns distance in kilometers.
    """

    if (
        lat1 is None
        or lon1 is None
        or lat2 is None
        or lon2 is None
    ):
        return None

    R = 6371.0  # Earth radius in kilometers

    lat1 = radians(float(lat1))
    lon1 = radians(float(lon1))
    lat2 = radians(float(lat2))
    lon2 = radians(float(lon2))

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    return R * c


# ============================================================
# SEARCH / FILTER / RANK WORKERS
# ============================================================

@router.get("")
def get_workers(
    service_id: int | None = None,
    date: str | None = None,
    start_time: str | None = None,
    end_time: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None
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
        # Convert booking date -> weekday
        # ----------------------------------------------------

        booking_weekday = None

        if date:

            try:

                booking_date = datetime.strptime(
                    date,
                    "%Y-%m-%d"
                )

                booking_weekday = booking_date.strftime("%A")

            except ValueError:

                raise HTTPException(
                    status_code=400,
                    detail="Invalid booking date format"
                )

        # ----------------------------------------------------
        # Base query
        # ----------------------------------------------------

        query = """
            SELECT DISTINCT
                workers.id,
                users.name,
                users.phone,
                workers.bio,
                workers.experience_years,
                workers.rating,
                workers.latitude,
                workers.longitude,
                workers.is_available
            FROM workers
            JOIN users
                ON workers.user_id = users.id
        """

        params = []
        conditions = []

        # ----------------------------------------------------
        # SERVICE FILTER
        # ----------------------------------------------------

        if service_id is not None:

            query += """
                JOIN worker_services
                    ON workers.id = worker_services.worker_id
            """

            conditions.append(
                "worker_services.service_id = %s"
            )

            params.append(service_id)

        # ----------------------------------------------------
        # WEEKLY AVAILABILITY FILTER
        # ----------------------------------------------------

        if booking_weekday:

            query += """
                JOIN availability
                    ON workers.id = availability.worker_id
            """

            conditions.append(
                "availability.day_of_week = %s"
            )

            params.append(booking_weekday)

            # ------------------------------------------------
            # Requested time must fit completely inside
            # worker's availability.
            # ------------------------------------------------

            if start_time and end_time:

                conditions.append(
                    "availability.start_time <= %s"
                )

                params.append(start_time)

                conditions.append(
                    "availability.end_time >= %s"
                )

                params.append(end_time)

        # ----------------------------------------------------
        # WORKER MUST BE ACTIVE
        # ----------------------------------------------------

        conditions.append(
            "workers.is_available = TRUE"
        )

        # ----------------------------------------------------
        # CHECK EXISTING BOOKINGS
        #
        # Remove workers who already have a pending/accepted
        # booking overlapping the requested time.
        # ----------------------------------------------------

        if (
            date
            and start_time
            and end_time
        ):

            conditions.append(
                """
                NOT EXISTS (
                    SELECT 1
                    FROM bookings
                    WHERE bookings.worker_id = workers.id

                    AND bookings.booking_date = %s

                    AND bookings.status IN (
                        'pending',
                        'accepted'
                    )

                    AND bookings.start_time < %s
                    AND bookings.end_time > %s
                )
                """
            )

            params.append(date)
            params.append(end_time)
            params.append(start_time)

        # ----------------------------------------------------
        # BUILD WHERE CLAUSE
        # ----------------------------------------------------

        if conditions:

            query += " WHERE "

            query += " AND ".join(
                conditions
            )

        # ----------------------------------------------------
        # DEBUG
        # ----------------------------------------------------

        print("\n========== WORKER SEARCH ==========")
        print("Date:", date)
        print("Weekday:", booking_weekday)
        print("Start:", start_time)
        print("End:", end_time)
        print("Service ID:", service_id)
        print("Customer latitude:", latitude)
        print("Customer longitude:", longitude)
        print("====================================\n")

        # ----------------------------------------------------
        # EXECUTE QUERY
        # ----------------------------------------------------

        cursor.execute(
            query,
            params
        )

        workers = cursor.fetchall()

        # ====================================================
        # MATCHING ENGINE
        # ====================================================

        if not workers:
            return []

        # ----------------------------------------------------
        # Find maximum experience among candidates.
        #
        # This lets us normalize experience.
        # ----------------------------------------------------

        max_experience = max(
            [
                worker["experience_years"] or 0
                for worker in workers
            ],
            default=1
        )

        if max_experience <= 0:
            max_experience = 1

        # ----------------------------------------------------
        # Calculate distance for every worker
        # ----------------------------------------------------

        for worker in workers:

            worker["distance_km"] = calculate_distance(
                latitude,
                longitude,
                worker["latitude"],
                worker["longitude"]
            )

        # ----------------------------------------------------
        # Find maximum distance.
        #
        # Used to give closer workers a better score.
        # ----------------------------------------------------

        distances = [
            worker["distance_km"]
            for worker in workers
            if worker["distance_km"] is not None
        ]

        max_distance = max(
            distances,
            default=None
        )

        # ====================================================
        # SCORE EACH WORKER
        # ====================================================

        for worker in workers:

            rating = float(
                worker["rating"] or 0
            )

            experience = (
                worker["experience_years"] or 0
            )

            # ------------------------------------------------
            # Rating score
            #
            # 5 stars = 100
            # ------------------------------------------------

            rating_score = (
                rating / 5
            ) * 100

            # ------------------------------------------------
            # Experience score
            #
            # Most experienced candidate = 100
            # ------------------------------------------------

            experience_score = (
                experience / max_experience
            ) * 100

            # ------------------------------------------------
            # Distance score
            #
            # Closest worker gets 100.
            # ------------------------------------------------

            distance = worker["distance_km"]

            if (
                distance is not None
                and max_distance is not None
                and max_distance > 0
            ):

                distance_score = (
                    1 - (
                        distance / max_distance
                    )
                ) * 100

                distance_score = max(
                    0,
                    distance_score
                )

            elif distance is not None:

                # Only one worker has a known distance.
                distance_score = 100

            else:

                distance_score = None

            # =================================================
            # FINAL MATCH SCORE
            # =================================================
            #
            # Rating       = 50%
            # Experience   = 25%
            # Distance     = 25%
            #
            # Distance is only included when the customer
            # location is available.
            # =================================================

            if distance_score is not None:

                match_score = (
                    rating_score * 0.50
                    + experience_score * 0.25
                    + distance_score * 0.25
                )

            else:

                # Redistribute the distance weight.
                match_score = (
                    rating_score * 0.65
                    + experience_score * 0.35
                )

            match_score = round(
                max(
                    0,
                    min(
                        100,
                        match_score
                    )
                ),
                2
            )

            worker["match_score"] = match_score

            # ------------------------------------------------
            # Explainability
            # ------------------------------------------------

            reasons = []

            if service_id is not None:
                reasons.append(
                    "Provides the requested service"
                )

            if booking_weekday:
                reasons.append(
                    f"Available on {booking_weekday}"
                )

            if start_time and end_time:
                reasons.append(
                    "Available during the requested time"
                )

            if rating >= 4.5:
                reasons.append(
                    f"Highly rated ({rating:.1f}/5)"
                )
            elif rating > 0:
                reasons.append(
                    f"Rated {rating:.1f}/5"
                )

            if experience > 0:
                reasons.append(
                    f"{experience} years of experience"
                )

            if distance is not None:

                reasons.append(
                    f"{distance:.1f} km away"
                )

            worker["match_reasons"] = reasons

        # ====================================================
        # SORT BY MATCH SCORE
        # ====================================================

        workers.sort(
            key=lambda worker: worker["match_score"],
            reverse=True
        )

        # ====================================================
        # RETURN RANKED WORKERS
        # ====================================================

        return workers

    finally:

        cursor.close()
        connection.close()


# ============================================================
# GET LOGGED-IN WORKER'S OWN PROFILE
# ============================================================

@router.get("/me")
def get_my_worker_profile(
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
                workers.id,
                users.name,
                users.email,
                users.phone,
                workers.bio,
                workers.experience_years,
                workers.rating,
                workers.latitude,
                workers.longitude,
                workers.is_available
            FROM workers
            JOIN users
                ON workers.user_id = users.id
            WHERE workers.user_id = %s
            """,
            (current_user["user_id"],)
        )

        worker = cursor.fetchone()

        if not worker:

            raise HTTPException(
                status_code=404,
                detail="Worker profile not found"
            )

        # ----------------------------------------------------
        # SERVICES
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                services.id,
                services.name,
                services.description
            FROM worker_services
            JOIN services
                ON worker_services.service_id = services.id
            WHERE worker_services.worker_id = %s
            """,
            (worker["id"],)
        )

        services = cursor.fetchall()

        # ----------------------------------------------------
        # WEEKLY AVAILABILITY
        # ----------------------------------------------------

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

            WHERE availability.worker_id = %s

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
            (worker["id"],)
        )

        availability = cursor.fetchall()

        return {
            "worker": worker,
            "services": services,
            "availability": availability
        }

    finally:

        cursor.close()
        connection.close()


# ============================================================
# GET WORKER PROFILE BY WORKER ID
# ============================================================

@router.get("/{worker_id}")
def get_worker_profile(
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

        cursor.execute(
            """
            SELECT
                workers.id,
                users.name,
                users.email,
                users.phone,
                workers.bio,
                workers.experience_years,
                workers.rating,
                workers.latitude,
                workers.longitude,
                workers.is_available

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
        # SERVICES
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                services.id,
                services.name,
                services.description

            FROM worker_services

            JOIN services
                ON worker_services.service_id = services.id

            WHERE worker_services.worker_id = %s
            """,
            (worker_id,)
        )

        services = cursor.fetchall()

        # ----------------------------------------------------
        # WEEKLY AVAILABILITY
        # ----------------------------------------------------

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

            WHERE availability.worker_id = %s

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
            (worker_id,)
        )

        availability = cursor.fetchall()

        return {
            "worker": worker,
            "services": services,
            "availability": availability
        }

    finally:

        cursor.close()
        connection.close()


# ============================================================
# UPDATE WORKER PROFILE
# ============================================================

@router.put("/profile")
def update_worker_profile(
    worker: WorkerCreate,
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

        existing_worker = cursor.fetchone()

        if not existing_worker:

            raise HTTPException(
                status_code=404,
                detail="Worker profile not found"
            )

        worker_id = existing_worker["id"]

        # ----------------------------------------------------
        # Remove duplicate service IDs
        # ----------------------------------------------------

        service_ids = list(
            dict.fromkeys(
                worker.service_ids
            )
        )

        if not service_ids:

            raise HTTPException(
                status_code=400,
                detail="Please select at least one service"
            )

        # ----------------------------------------------------
        # Validate services
        # ----------------------------------------------------

        placeholders = ", ".join(
            ["%s"] * len(service_ids)
        )

        cursor.execute(
            f"""
            SELECT id
            FROM services
            WHERE id IN ({placeholders})
            """,
            tuple(service_ids)
        )

        valid_services = cursor.fetchall()

        valid_service_ids = {
            service["id"]
            for service in valid_services
        }

        invalid_service_ids = [
            service_id
            for service_id in service_ids
            if service_id not in valid_service_ids
        ]

        if invalid_service_ids:

            raise HTTPException(
                status_code=400,
                detail="One or more selected services are invalid"
            )

        # ----------------------------------------------------
        # Update worker profile
        # ----------------------------------------------------

        cursor.execute(
            """
            UPDATE workers

            SET
                bio = %s,
                experience_years = %s,
                latitude = %s,
                longitude = %s

            WHERE id = %s
            """,
            (
                worker.bio,
                worker.experience_years,
                worker.latitude,
                worker.longitude,
                worker_id
            )
        )

        # ----------------------------------------------------
        # Replace worker services
        # ----------------------------------------------------

        cursor.execute(
            """
            DELETE FROM worker_services
            WHERE worker_id = %s
            """,
            (worker_id,)
        )

        for service_id in service_ids:

            cursor.execute(
                """
                INSERT INTO worker_services
                (
                    worker_id,
                    service_id
                )

                VALUES (%s, %s)
                """,
                (
                    worker_id,
                    service_id
                )
            )

        connection.commit()

        return {
            "message": "Worker profile updated successfully",
            "worker_id": worker_id,
            "service_ids": service_ids
        }

    except HTTPException:

        connection.rollback()
        raise

    except Exception as e:

        connection.rollback()

        print(
            "Worker profile update error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update worker profile"
        )

    finally:

        cursor.close()
        connection.close()