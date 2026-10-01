from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import get_db_connection

from routes.auth import router as auth_router
from routes.workers import router as workers_router
from routes.bookings import router as bookings_router
from routes.worker_bookings import router as worker_bookings_router
from routes.customer_bookings import router as customer_bookings_router
from routes.reviews import router as reviews_router
from routes.ai import router as ai_router
from utils.auth import get_current_user
from routes.availability import router as availability_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://niboraid.vercel.app",
        "https://niboraid-8kw3arzs1-guttamaneesha456-4505.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(workers_router)
app.include_router(bookings_router)
app.include_router(worker_bookings_router)
app.include_router(customer_bookings_router)
app.include_router(reviews_router)
app.include_router(ai_router)
app.include_router(availability_router)

@app.get("/")
def home():
    return {
        "message": "NiboRaid API is running"
    }


@app.get("/health/database")
def database_health():
    connection = get_db_connection()

    if connection:
        connection.close()
        return {
            "database": "connected"
        }

    return {
        "database": "connection failed"
    }


@app.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "message": "You are authenticated",
        "user_id": current_user["user_id"],
        "role": current_user["role"]
    }


@app.get("/services")
def get_services():
    connection = get_db_connection()

    if not connection:
        return {
            "error": "Database connection failed"
        }

    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, name, description FROM services"
    )

    services = cursor.fetchall()

    cursor.close()
    connection.close()

    return services