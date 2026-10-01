from fastapi import APIRouter, HTTPException, Depends
from database import get_db_connection
import bcrypt
import secrets
import os
import requests
import html

from datetime import datetime, timedelta, timezone

from pydantic import BaseModel, Field

from models.user import UserCreate, UserLogin
from utils.auth import create_access_token, get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# BREVO CONFIGURATION
# =========================================================

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")


# =========================================================
# PASSWORD RESET MODELS
# =========================================================

class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def create_user(user: UserCreate):

    connection = get_db_connection()

    if not connection:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor()

    try:

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            """,
            (user.email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:

            raise HTTPException(
                status_code=400,
                detail="An account with this email already exists."
            )

        password_hash = bcrypt.hashpw(
            user.password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO users
            (name, email, password_hash, phone, role)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user.name,
                user.email,
                password_hash,
                user.phone,
                user.role
            )
        )

        user_id = cursor.lastrowid

        if user.role == "worker":

            cursor.execute(
                """
                INSERT INTO workers
                (
                    user_id,
                    bio,
                    experience_years,
                    latitude,
                    longitude,
                    is_available
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    "Professional service provider",
                    0,
                    None,
                    None,
                    True
                )
            )

        connection.commit()

        return {
            "message": "User created successfully",
            "user_id": user_id,
            "role": user.role
        }

    except HTTPException:

        connection.rollback()
        raise

    except Exception as e:

        connection.rollback()

        print("Registration error:", e)

        raise HTTPException(
            status_code=500,
            detail="Unable to create account."
        )

    finally:

        cursor.close()
        connection.close()


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(user: UserLogin):

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
                id,
                name,
                email,
                password_hash,
                role
            FROM users
            WHERE email = %s
            """,
            (user.email,)
        )

        db_user = cursor.fetchone()

        if not db_user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        password_correct = bcrypt.checkpw(
            user.password.encode("utf-8"),
            db_user["password_hash"].encode("utf-8")
        )

        if not password_correct:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
            )

        token = create_access_token(
            db_user["id"],
            db_user["role"]
        )

        return {
            "message": "Login successful",
            "access_token": token,
            "token_type": "bearer",
            "user_id": db_user["id"],
            "name": db_user["name"],
            "role": db_user["role"]
        }

    finally:

        cursor.close()
        connection.close()


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest
):

    connection = get_db_connection()

    if not connection:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = connection.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # Check Brevo configuration
        # -------------------------------------------------

        if not BREVO_API_KEY or not BREVO_SENDER_EMAIL:

            raise HTTPException(
                status_code=500,
                detail="Email service is not configured."
            )

        # -------------------------------------------------
        # Find user
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                name,
                email
            FROM users
            WHERE email = %s
            """,
            (request.email.strip(),)
        )

        user = cursor.fetchone()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="No account found with this email address."
            )

        # -------------------------------------------------
        # Invalidate previous unused tokens
        # -------------------------------------------------

        cursor.execute(
            """
            UPDATE password_reset_tokens
            SET used = TRUE
            WHERE user_id = %s
            AND used = FALSE
            """,
            (user["id"],)
        )

        # -------------------------------------------------
        # Generate secure token
        # -------------------------------------------------

        reset_token = secrets.token_urlsafe(32)

        # -------------------------------------------------
        # Token expires in 15 minutes
        # -------------------------------------------------

        expires_at = (
            datetime.now(timezone.utc)
            + timedelta(minutes=15)
        ).replace(tzinfo=None)

        # -------------------------------------------------
        # Save token
        # -------------------------------------------------

        cursor.execute(
            """
            INSERT INTO password_reset_tokens
            (
                user_id,
                token,
                expires_at,
                used
            )
            VALUES (%s, %s, %s, FALSE)
            """,
            (
                user["id"],
                reset_token,
                expires_at
            )
        )

        connection.commit()

        # -------------------------------------------------
        # Create frontend reset link
        # -------------------------------------------------

        reset_link = (
            "http://localhost:5173/reset-password"
            f"?token={reset_token}"
        )

        # -------------------------------------------------
        # Safely format user's name for HTML
        # -------------------------------------------------

        safe_name = html.escape(str(user["name"]))

        # -------------------------------------------------
        # Brevo email data
        # -------------------------------------------------

        email_payload = {
            "sender": {
                "name": "NiborAid",
                "email": BREVO_SENDER_EMAIL
            },
            "to": [
                {
                    "email": user["email"],
                    "name": user["name"]
                }
            ],
            "subject": "Reset your NiborAid password",
            "htmlContent": f"""
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    color: #172033;
                ">

                    <h1 style="
                        color: #1769d1;
                        margin-bottom: 8px;
                    ">
                        NiborAid
                    </h1>

                    <h2>
                        Reset your password
                    </h2>

                    <p style="
                        color: #68758a;
                        line-height: 1.7;
                    ">
                        Hello {safe_name},
                    </p>

                    <p style="
                        color: #68758a;
                        line-height: 1.7;
                    ">
                        We received a request to reset
                        your NiborAid account password.
                    </p>

                    <p style="
                        color: #68758a;
                        line-height: 1.7;
                    ">
                        Click the button below to create
                        a new password.
                    </p>

                    <div style="
                        margin: 30px 0;
                    ">

                        <a
                            href="{reset_link}"
                            style="
                                display: inline-block;
                                padding: 14px 24px;
                                background: #1769d1;
                                color: white;
                                text-decoration: none;
                                border-radius: 8px;
                                font-weight: bold;
                            "
                        >
                            Reset Password
                        </a>

                    </div>

                    <p style="
                        color: #68758a;
                        font-size: 14px;
                        line-height: 1.6;
                    ">
                        This password reset link will
                        expire in 15 minutes.
                    </p>

                    <p style="
                        color: #9aa7b8;
                        font-size: 13px;
                        margin-top: 30px;
                    ">
                        If you did not request a password
                        reset, you can safely ignore this email.
                    </p>

                    <hr style="
                        border: none;
                        border-top: 1px solid #e5edf7;
                        margin: 30px 0;
                    ">

                    <p style="
                        color: #9aa7b8;
                        font-size: 12px;
                    ">
                        © NiborAid
                    </p>

                </div>
            """
        }

        # -------------------------------------------------
        # Send email through Brevo
        # -------------------------------------------------

        try:

            brevo_response = requests.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "accept": "application/json",
                    "api-key": BREVO_API_KEY,
                    "content-type": "application/json"
                },
                json=email_payload,
                timeout=15
            )

            # Brevo returns 2xx when the email request succeeds
            if not 200 <= brevo_response.status_code < 300:

                print(
                    "Brevo email error:",
                    brevo_response.status_code,
                    brevo_response.text
                )

                # Remove token if email could not be sent
                cursor.execute(
                    """
                    DELETE FROM password_reset_tokens
                    WHERE token = %s
                    """,
                    (reset_token,)
                )

                connection.commit()

                raise HTTPException(
                    status_code=500,
                    detail="Unable to send password reset email."
                )

            print(
                "Password reset email sent successfully."
            )

        except HTTPException:
            raise

        except Exception as email_error:

            print(
                "Brevo email error:",
                email_error
            )

            # Remove token if email delivery failed
            cursor.execute(
                """
                DELETE FROM password_reset_tokens
                WHERE token = %s
                """,
                (reset_token,)
            )

            connection.commit()

            raise HTTPException(
                status_code=500,
                detail="Unable to send password reset email."
            )

        # -------------------------------------------------
        # Token is NOT returned to frontend
        # -------------------------------------------------

        return {
            "message": "Password reset link has been sent to your email."
        }

    except HTTPException:

        connection.rollback()
        raise

    except Exception as e:

        connection.rollback()

        print(
            "Forgot password error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process password reset request."
        )

    finally:

        cursor.close()
        connection.close()


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest
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
                id,
                user_id,
                expires_at,
                used
            FROM password_reset_tokens
            WHERE token = %s
            """,
            (request.token,)
        )

        reset_record = cursor.fetchone()

        if not reset_record:

            raise HTTPException(
                status_code=400,
                detail="Invalid password reset token."
            )

        if reset_record["used"]:

            raise HTTPException(
                status_code=400,
                detail="This password reset token has already been used."
            )

        # -------------------------------------------------
        # Compare using UTC
        # -------------------------------------------------

        current_time = (
            datetime.now(timezone.utc)
            .replace(tzinfo=None)
        )

        expires_at = reset_record["expires_at"]

        if current_time >= expires_at:

            raise HTTPException(
                status_code=400,
                detail="This password reset token has expired."
            )

        # -------------------------------------------------
        # Hash new password
        # -------------------------------------------------

        password_hash = bcrypt.hashpw(
            request.new_password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # -------------------------------------------------
        # Update password
        # -------------------------------------------------

        cursor.execute(
            """
            UPDATE users
            SET password_hash = %s
            WHERE id = %s
            """,
            (
                password_hash,
                reset_record["user_id"]
            )
        )

        # -------------------------------------------------
        # Mark token as used
        # -------------------------------------------------

        cursor.execute(
            """
            UPDATE password_reset_tokens
            SET used = TRUE
            WHERE id = %s
            """,
            (reset_record["id"],)
        )

        connection.commit()

        return {
            "message": "Password reset successfully."
        }

    except HTTPException:

        connection.rollback()
        raise

    except Exception as e:

        connection.rollback()

        print(
            "Reset password error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to reset password."
        )

    finally:

        cursor.close()
        connection.close()


# =========================================================
# GET CURRENT USER
# =========================================================

@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user)
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
                id,
                name,
                email,
                phone,
                role,
                created_at
            FROM users
            WHERE id = %s
            """,
            (current_user["user_id"],)
        )

        user = cursor.fetchone()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        return user

    finally:

        cursor.close()
        connection.close()