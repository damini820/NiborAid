import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Booking.css";
import API_URL from "../config";
function Booking() {
  const navigate = useNavigate();
  const location = useLocation();

  const bookingData = location.state;

  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  if (!bookingData) {
    return (
      <div className="booking-page">

        <nav className="booking-navbar">

          <div
            className="booking-brand"
            onClick={() => navigate("/dashboard")}
          >
            <div className="booking-brand-icon">
              N
            </div>

            <span>NiborAid</span>
          </div>

        </nav>

        <main className="booking-container">

          <div className="booking-error-page">

            <h2>
              No booking selected
            </h2>

            <p>
              Please select a worker first.
            </p>

            <button
              onClick={() =>
                navigate("/find-service")
              }
            >
              Find a Service
            </button>

          </div>

        </main>

      </div>
    );
  }

  const {
    worker,
    service,
    bookingDate,
    startTime,
    endTime,
    problem,
  } = bookingData;

  async function handleConfirmBooking() {
    if (bookingLoading) {
      return;
    }

    setBookingLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Your session has expired. Please login again."
        );

        setMessageType("error");
        setBookingLoading(false);

        return;
      }

      const servicesResponse = await fetch(
        `${API_URL}/services`,
      );

      const services =
        await servicesResponse.json();

      if (!servicesResponse.ok) {
        setMessage(
          "Unable to load services."
        );

        setMessageType("error");
        setBookingLoading(false);

        return;
      }

      const matchedService = services.find(
        (item) =>
          item.name.toLowerCase() ===
          service.toLowerCase()
      );

      if (!matchedService) {
        setMessage(
          "Service not found."
        );

        setMessageType("error");
        setBookingLoading(false);

        return;
      }

      const response = await fetch(
        `${API_URL}/bookings`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            worker_id: worker.id,
            service_id: matchedService.id,
            booking_date: bookingDate,
            start_time: startTime,
            end_time: endTime,
            problem_description:
              problem.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            "Unable to create booking."
        );

        setMessageType("error");
        setBookingLoading(false);

        return;
      }

      /*
       * Booking was successfully created.
       *
       * Automatically take the customer
       * to My Bookings.
       */
      navigate("/my-bookings");

    } catch (error) {
      console.error(
        "Booking error:",
        error
      );

      setMessage(
        "Unable to connect to the server. Please try again."
      );

      setMessageType("error");

      setBookingLoading(false);
    }
  }

  return (
    <div className="booking-page">

      {/* Navbar */}
      <nav className="booking-navbar">

        <div
          className="booking-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <div className="booking-brand-icon">
            N
          </div>

          <span>NiborAid</span>
        </div>

        <button
          className="booking-back-btn"
          onClick={() =>
            navigate("/find-service")
          }
        >
          ← Back
        </button>

      </nav>

      {/* Main */}
      <main className="booking-container">

        {/* Header */}
        <section className="booking-header">

          <div className="booking-badge">
            BOOKING
          </div>

          <h1>
            Confirm your booking
          </h1>

          <p>
            Review the details below before
            confirming your appointment.
          </p>

        </section>

        {/* Worker */}
        <section className="booking-worker-card">

          <div className="booking-worker-avatar">
            {worker.name
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div className="booking-worker-info">

            <span className="booking-small-label">
              PROFESSIONAL
            </span>

            <h2>
              {worker.name}
            </h2>

            <p className="booking-rating">
              ⭐ {worker.rating}
            </p>

            <p>
              {worker.experience_years} years
              experience
            </p>

          </div>

        </section>

        {/* Appointment Details */}
        <section className="booking-details-card">

          <h2>
            Appointment Details
          </h2>

          <div className="booking-details-grid">

            <div className="booking-detail">

              <span>
                Service
              </span>

              <strong>
                {service}
              </strong>

            </div>

            <div className="booking-detail">

              <span>
                Date
              </span>

              <strong>
                {bookingDate}
              </strong>

            </div>

            <div className="booking-detail">

              <span>
                Start Time
              </span>

              <strong>
                {startTime}
              </strong>

            </div>

            <div className="booking-detail">

              <span>
                End Time
              </span>

              <strong>
                {endTime}
              </strong>

            </div>

          </div>

        </section>

        {/* Problem */}
        <section className="booking-problem-card">

          <span>
            YOUR PROBLEM
          </span>

          <p>
            {problem}
          </p>

        </section>

        {/* Confirm */}
        <section className="booking-confirm-card">

          <button
            className="confirm-booking-btn"
            onClick={handleConfirmBooking}
            disabled={bookingLoading}
          >
            {bookingLoading
              ? "Creating Booking..."
              : "Confirm Booking"}
          </button>

        </section>

      </main>

      {/* Error Toast Only */}
      {messageType === "error" && message && (
        <div className="booking-toast error-toast">

          <div className="toast-icon">
            !
          </div>

          <div className="toast-content">

            <strong>
              Booking Failed
            </strong>

            <span>
              {message}
            </span>

          </div>

          <button
            className="toast-close"
            onClick={() => {
              setMessage("");
              setMessageType("");
            }}
          >
            ×
          </button>

        </div>
      )}

    </div>
  );
}

export default Booking;