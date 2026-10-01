# NiborAid

### AI-Powered Local Service Marketplace

NiborAid is a full-stack local service marketplace that connects customers with nearby service professionals. Customers can describe their problem in natural language, and the platform uses AI to identify the required service and recommend suitable workers based on availability, ratings, experience, and distance.

---

## 🚀 Live Demo

**Frontend:** [https://niboraid.vercel.app](https://niboraid.vercel.app)

**Backend API:** [https://niboraid.onrender.com](https://niboraid.onrender.com)

**API Documentation:** [https://niboraid.onrender.com/docs](https://niboraid.onrender.com/docs)

---

## ✨ Features

### 🤖 AI-Powered Service Detection

Customers can describe their problem in natural language instead of manually selecting a service.

For example:

> "My ceiling fan suddenly stopped working"

The system identifies the appropriate service:

```text
Service: Electrical
Confidence: High
```

NiborAid currently supports:

- Plumbing
- Electrical
- Carpentry
- AC Repair
- Appliance Repair
- Painting
- Cleaning
- Pest Control

A deterministic fallback mechanism is also used when the AI service is unavailable or exceeds its API quota.

---

### 🔎 Explainable Worker Matching

After identifying the required service, NiborAid searches for suitable workers using:

- Service compatibility
- Worker availability
- Requested date and time
- Existing booking conflicts
- Worker rating
- Experience
- Geographic distance

Each worker receives a match score along with human-readable reasons explaining the recommendation.

Example:

```text
Match Score: 78%

✓ Provides the requested service
✓ Available on the selected day
✓ Available during the requested time
✓ High customer rating
✓ Relevant experience
```

---

### 📅 Booking Management

Customers can:

- Select a service professional
- Choose a date and time
- Describe their problem
- Create bookings
- Track booking status
- Cancel bookings
- Review completed services

Workers can:

- View incoming bookings
- Accept or reject bookings
- Mark bookings as completed
- Manage their availability
- Manage their service profile

---

### ⭐ Reviews & Dynamic Ratings

Customers can review completed services.

Worker ratings are calculated from customer reviews, helping future customers make informed decisions when selecting a worker.

---

### 🔐 Authentication & Authorization

The application provides:

- JWT-based authentication
- Role-based access control
- Customer and worker accounts
- Protected API routes
- Secure password hashing
- Password recovery

---

### 📧 Password Recovery

Users can request a password reset link through email.

The password recovery system uses:

- Secure reset tokens
- Token expiration
- Single-use reset tokens
- Brevo email API

---

## 🧠 AI Service Detection Pipeline

NiborAid uses a three-layer service detection pipeline combining **caching, Gemini AI, and a deterministic fallback** for better performance and reliability.

```text
                    Customer Problem
                           │
                           ▼
                   ┌───────────────┐
                   │  Cache Lookup │
                   └───────┬───────┘
                           │
                    ┌──────┴──────┐
                    │             │
                 Cache Hit     Cache Miss
                    │             │
                    │             ▼
                    │      ┌─────────────┐
                    │      │  Gemini API │
                    │      └──────┬──────┘
                    │             │
                    │       ┌─────┴─────┐
                    │       │           │
                    │    Success      Failure
                    │       │           │
                    │       ▼           ▼
                    │   AI Result   Rule-Based
                    │       │        Fallback
                    │       │           │
                    │       ▼           │
                    │  Store in Cache  │
                    │       │           │
                    └───────┬───────────┘
                            │
                            ▼
                  Service + Confidence
                            │
                            ▼
                     Worker Matching
```

### ⚡ Caching

Before calling Gemini, NiborAid checks an in-memory cache for the problem description.

- **Cache hit:** Returns the previously detected service immediately.
- **Cache miss:** Sends the problem to Gemini and stores the result in the cache.
- Reduces repeated Gemini API requests.
- Improves response time for repeated queries.
- Helps reduce API quota consumption.

### 🤖 Gemini API

For new problem descriptions, Gemini classifies the problem into one of the supported service categories and returns a confidence score.

### 🛡️ Deterministic Fallback

If Gemini fails, times out, or exceeds its API quota, NiborAid uses a deterministic rule-based fallback detector.

This provides graceful degradation, allowing service detection to continue even when the external AI service is temporarily unavailable.

---

## 🎯 Worker Matching

Workers are first filtered based on:

1. Requested service
2. Selected date
3. Worker availability
4. Requested time
5. Existing booking conflicts

The remaining workers are ranked using ratings, experience, and geographic distance.

### Matching with Location

```text
Rating      → 50%
Experience  → 25%
Distance    → 25%
```

### Matching without Location

```text
Rating      → 65%
Experience  → 35%
```

The final recommendation contains both a match score and reasons for the score.

---

## 🏗️ System Architecture

```text
                 ┌──────────────────┐
                 │       User       │
                 │  Customer/Worker │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   React + Vite   │
                 │     Frontend     │
                 └────────┬─────────┘
                          │ HTTP
                          ▼
                 ┌──────────────────┐
                 │  FastAPI Backend │
                 └───────┬──────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
            ▼            ▼            ▼
       ┌─────────┐  ┌─────────┐  ┌─────────┐
       │ Gemini  │  │  MySQL  │  │  Brevo  │
       │   AI    │  │Database │  │  Email  │
       └─────────┘  └─────────┘  └─────────┘
```

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- JavaScript
- React Router
- CSS

### Backend

- Python
- FastAPI
- JWT
- Pydantic

### Database

- MySQL

### AI

- Google Gemini API

### Email

- Brevo API

### Deployment

- Vercel
- Render
- Aiven MySQL

### Tools

- Git
- GitHub
- VS Code

---

## 📁 Project Structure

```text
Niboraid/
│
├── backend/
│   ├── ai/
│   │   └── service_detection.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── worker.py
│   │   └── booking.py
│   │
│   ├── routes/
│   │   ├── auth.py
│   │   ├── workers.py
│   │   ├── bookings.py
│   │   ├── worker_bookings.py
│   │   ├── customer_bookings.py
│   │   ├── reviews.py
│   │   ├── ai.py
│   │   └── availability.py
│   │
│   ├── utils/
│   │   └── auth.py
│   │
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── config.js
│   │   └── main.jsx
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Maneesha1411/Niboraid.git
cd Niboraid
```

### 2. Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=niboraid

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_email
```

Start the backend:

```bash
uvicorn main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

---

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔑 Environment Variables

| Variable             | Description                        |
| -------------------- | ---------------------------------- |
| `DB_HOST`            | MySQL database host                |
| `DB_PORT`            | MySQL database port                |
| `DB_USER`            | MySQL username                     |
| `DB_PASSWORD`        | MySQL password                     |
| `DB_NAME`            | Database name                      |
| `JWT_SECRET`         | Secret used for JWT authentication |
| `GEMINI_API_KEY`     | Google Gemini API key              |
| `BREVO_API_KEY`      | Brevo API key                      |
| `BREVO_SENDER_EMAIL` | Verified sender email              |
| `VITE_API_URL`       | Backend API URL                    |

> **Important:** Never commit `.env` files, API keys, database passwords, or JWT secrets to GitHub.

---

## 🔒 Security

NiborAid uses:

- Password hashing
- JWT authentication
- Role-based authorization
- Protected API endpoints
- Environment variables for secrets
- Expiring password reset tokens
- Single-use password reset tokens

---

## 🗄️ Database

NiborAid uses MySQL with relational tables for:

- Users
- Workers
- Services
- Worker Services
- Availability
- Bookings
- Reviews
- Password Reset Tokens

The relational structure maintains the relationships between customers, workers, services, bookings, availability, and reviews.

---

## 🌐 Deployment

| Component | Platform    |
| --------- | ----------- |
| Frontend  | Vercel      |
| Backend   | Render      |
| Database  | Aiven MySQL |

### Production URLs

**Frontend:**  
https://niboraid.vercel.app

**Backend:**  
https://niboraid.onrender.com

**API Docs:**  
https://niboraid.onrender.com/docs

---

## 🚧 Future Improvements

- Online payments
- Real-time booking notifications
- Worker verification
- Map-based worker discovery
- Push notifications
- Advanced recommendation models
- Production monitoring and analytics

---

## 👩‍💻 Author

**Gutta Maneesha**

B.Tech — Computer Science & Engineering  
Motilal Nehru National Institute of Technology Allahabad

[GitHub](https://github.com/Maneesha1411)

[LinkedIn](https://www.linkedin.com/in/maneesha-gutta/)
