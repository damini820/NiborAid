import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyBookings.css";
import API_URL from "../config";

function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/customer/bookings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log("Customer bookings:", data);

        if (!response.ok) {
          setMessage(
            data.detail ||
              "Unable to load bookings."
          );
          setMessageType("error");
          setLoading(false);
          return;
        }

        setBookings(data);
      } catch (error) {
        console.error(
          "Load bookings error:",
          error
        );

        setMessage(
          "Unable to connect to the server."
        );
        setMessageType("error");
      }

      setLoading(false);
    }

    loadBookings();
  }, [navigate]);

  async function handleCancel(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/customer/bookings/${bookingId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            "Unable to cancel booking."
        );
        setMessageType("error");
        return;
      }

      setMessage(
        "Booking cancelled successfully."
      );
      setMessageType("success");

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: "cancelled",
              }
            : booking
        )
      );
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to the server."
      );
      setMessageType("error");
    }
  }

  function openReviewForm(booking) {
    setReviewBooking(booking);
    setRating(5);
    setComment("");
    setMessage("");
    setMessageType("");
  }

  async function handleSubmitReview() {
    if (!reviewBooking) {
      setMessage(
        "Please select a booking to review."
      );
      setMessageType("error");
      return;
    }

    setReviewLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage(
          "Your session has expired. Please login again."
        );
        setMessageType("error");
        setReviewLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            booking_id: reviewBooking.id,
            rating: Number(rating),
            comment:
              comment.trim() || null,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Review response:",
        response.status,
        data
      );

      if (!response.ok) {
        setMessage(
          data.detail ||
            "Unable to submit review."
        );
        setMessageType("error");
        setReviewLoading(false);
        return;
      }

      /*
        IMPORTANT:

        Mark this booking as reviewed
        immediately in React state.
      */

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === reviewBooking.id
            ? {
                ...booking,
                review_id:
                  data.review_id || true,
              }
            : booking
        )
      );

      // Close review form
      setReviewBooking(null);

      // Reset fields
      setRating(5);
      setComment("");

      // Show success
      setMessage(
        "✓ Review submitted successfully!"
      );
      setMessageType("success");

    } catch (error) {
      console.error(
        "Submit review error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );
      setMessageType("error");
    }

    setReviewLoading(false);
  }

  function getStatusClass(status) {
    switch (status) {
      case "accepted":
        return "status-accepted";

      case "completed":
        return "status-completed";

      case "rejected":
        return "status-rejected";

      case "cancelled":
        return "status-cancelled";

      default:
        return "status-pending";
    }
  }

  if (loading) {
    return (
      <div className="bookings-page">

        <div className="bookings-loading">

          <div className="loading-spinner"></div>

          <p>
            Loading your bookings...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="bookings-page">

      {/* Navbar */}

      <nav className="bookings-navbar">

        <div
          className="bookings-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >

          <div className="bookings-brand-icon">
            N
          </div>

          <span>
            NiborAid
          </span>

        </div>

        <button
          className="back-dashboard-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          Dashboard
        </button>

      </nav>

      <main className="bookings-container">

        {/* Header */}

        <section className="bookings-header">

          <div className="bookings-badge">
            CUSTOMER AREA
          </div>

          <h1>
            My Bookings
          </h1>

          <p>
            Track your service requests and
            manage your appointments.
          </p>

        </section>

        {/* Message */}

        {message && (
          <div
            className={
              messageType === "success"
                ? "bookings-message success-message"
                : "bookings-message error-message"
            }
          >
            {message}
          </div>
        )}

        {/* Empty */}

        {bookings.length === 0 && (
          <section className="empty-bookings">

            <div className="empty-icon">
              📅
            </div>

            <h2>
              No bookings yet
            </h2>

            <p>
              You haven't booked a service yet.
              Find a professional to get started.
            </p>

            <button
              onClick={() =>
                navigate("/find-service")
              }
            >
              Find a Service →
            </button>

          </section>
        )}

        {/* Booking List */}

        {bookings.length > 0 && (
          <section className="booking-list">

            <div className="booking-list-header">

              <h2>
                Your appointments
              </h2>

              <span>
                {bookings.length}{" "}
                {bookings.length === 1
                  ? "booking"
                  : "bookings"}
              </span>

            </div>

            {bookings.map((booking) => (
              <div
                className="booking-card"
                key={booking.id}
              >

                {/* Top */}

                <div className="booking-card-top">

                  <div>

                    <span className="booking-number">
                      BOOKING #{booking.id}
                    </span>

                    <h2>
                      {booking.service_name}
                    </h2>

                  </div>

                  <span
                    className={`booking-status ${getStatusClass(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>

                </div>

                {/* Worker */}

                <div className="worker-info">

                  <div className="booking-avatar">
                    {booking.worker_name
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <span className="detail-label">
                      PROFESSIONAL
                    </span>

                    <h3>
                      {booking.worker_name}
                    </h3>

                    <p>
                      ⭐{" "}
                      {booking.worker_rating}
                      {" "}rating
                    </p>

                  </div>

                </div>

                {/* Details */}

                <div className="booking-details">

                  <div className="booking-detail">

                    <span>
                      📅 DATE
                    </span>

                    <strong>
                      {booking.booking_date}
                    </strong>

                  </div>

                  <div className="booking-detail">

                    <span>
                      🕐 TIME
                    </span>

                    <strong>
                      {booking.start_time}
                      {" - "}
                      {booking.end_time}
                    </strong>

                  </div>

                  <div className="booking-detail">

                    <span>
                      📞 PHONE
                    </span>

                    <strong>
                      {booking.worker_phone}
                    </strong>

                  </div>

                </div>

                {/* Problem */}

                <div className="problem-box">

                  <span>
                    YOUR PROBLEM
                  </span>

                  <p>
                    {booking.problem_description}
                  </p>

                </div>

                {/* Actions */}

                <div className="booking-actions">

                  {(booking.status ===
                    "pending" ||
                    booking.status ===
                      "accepted") && (

                    <button
                      className="cancel-booking-btn"
                      onClick={() =>
                        handleCancel(
                          booking.id
                        )
                      }
                    >
                      Cancel Booking
                    </button>

                  )}

                  {/*
                    Give Review appears ONLY when:
                    1. Booking is completed
                    2. review_id does not exist
                  */}

                  {booking.status ===
                    "completed" &&
                    !booking.review_id &&
                    reviewBooking?.id !==
                      booking.id && (

                    <button
                      className="review-btn"
                      onClick={() =>
                        openReviewForm(
                          booking
                        )
                      }
                    >
                      ⭐ Give Review
                    </button>

                  )}

                  <button
                    className="view-worker-btn"
                    onClick={() =>
                      navigate(
                        `/worker/${booking.worker_id}`
                      )
                    }
                  >
                    View Professional
                  </button>

                </div>

                {/* Review Form */}

                {reviewBooking?.id ===
                  booking.id && (

                  <div className="review-section">

                    <div className="review-header">

                      <span>
                        YOUR FEEDBACK
                      </span>

                      <h3>
                        Rate{" "}
                        {booking.worker_name}
                      </h3>

                    </div>

                    <p className="rating-label">
                      How was your experience?
                    </p>

                    <div className="star-rating">

                      {[1, 2, 3, 4, 5].map(
                        (star) => (

                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            setRating(star)
                          }
                          className={
                            star <= rating
                              ? "star selected"
                              : "star"
                          }
                          disabled={
                            reviewLoading
                          }
                        >
                          {star <= rating
                            ? "★"
                            : "☆"}
                        </button>

                      ))}

                    </div>

                    <p className="selected-rating">
                      {rating}/5
                    </p>

                    <label
                      htmlFor={`comment-${booking.id}`}
                    >
                      Comment
                    </label>

                    <textarea
                      id={`comment-${booking.id}`}
                      name="comment"
                      rows="4"
                      maxLength="500"
                      placeholder="Tell us about your experience..."
                      value={comment}
                      disabled={
                        reviewLoading
                      }
                      onChange={(e) =>
                        setComment(
                          e.target.value
                        )
                      }
                    />

                    <p className="character-count">
                      {comment.length}/500
                    </p>

                    <div className="review-actions">

                      <button
                        type="button"
                        className="submit-review-btn"
                        onClick={
                          handleSubmitReview
                        }
                        disabled={
                          reviewLoading
                        }
                      >
                        {reviewLoading
                          ? "Submitting Review..."
                          : "✓ Submit Review"}
                      </button>

                      <button
                        type="button"
                        className="close-review-btn"
                        onClick={() => {
                          setReviewBooking(
                            null
                          );
                          setRating(5);
                          setComment("");
                        }}
                        disabled={
                          reviewLoading
                        }
                      >
                        Cancel
                      </button>

                    </div>

                  </div>

                )}

              </div>
            ))}

          </section>
        )}

      </main>

    </div>
  );
}

export default MyBookings;