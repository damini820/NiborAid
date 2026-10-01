from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ai.service_detection import detect_service
from utils.auth import get_current_user
from database import get_db_connection


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ProblemRequest(BaseModel):

    problem: str = Field(
        min_length=5,
        max_length=1000
    )


# ============================================================
# AI SERVICE DETECTION
# ============================================================

@router.post("/detect-service")
def detect_service_api(
    request: ProblemRequest,
    current_user: dict = Depends(get_current_user)
):

    # --------------------------------------------------------
    # Only customers can use AI service detection
    # --------------------------------------------------------

    if current_user["role"] != "customer":

        raise HTTPException(
            status_code=403,
            detail="Only customers can use service detection"
        )

    try:

        # ----------------------------------------------------
        # Ask Gemini to understand the problem
        # ----------------------------------------------------

        result = detect_service(
            request.problem
        )

        service_name = result["service"]

        # ----------------------------------------------------
        # INVALID PROBLEM
        # ----------------------------------------------------

        if service_name == "INVALID":

            return {
                "problem": request.problem,
                "service": "INVALID",
                "service_id": None,
                "confidence": result["confidence"],
                "problem_type": result["problem_type"]
            }

        # ----------------------------------------------------
        # Find matching service in MySQL
        # ----------------------------------------------------

        connection = get_db_connection()

        if not connection:

            raise HTTPException(
                status_code=500,
                detail="Database connection failed"
            )

        cursor = connection.cursor(
            dictionary=True
        )

        try:

            cursor.execute(
                """
                SELECT
                    id,
                    name,
                    description
                FROM services
                WHERE LOWER(name) = LOWER(%s)
                """,
                (service_name,)
            )

            service = cursor.fetchone()

        finally:

            cursor.close()
            connection.close()

        # ----------------------------------------------------
        # Gemini returned a service that doesn't exist
        # ----------------------------------------------------

        if not service:

            print(
                "AI returned unknown service:",
                service_name
            )

            raise HTTPException(
                status_code=500,
                detail="Detected service is not available"
            )

        # ----------------------------------------------------
        # FINAL RESPONSE
        # ----------------------------------------------------

        return {
            "problem": request.problem,

            "service": service["name"],

            "service_id": service["id"],

            "confidence": result["confidence"],

            "problem_type": result["problem_type"]
        }

    except HTTPException:

        raise

    except Exception as e:

        print(
            "AI service detection error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="AI service detection failed."
        )