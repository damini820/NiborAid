import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyReviews.css";
import API_URL from "../config";

function MyReviews() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [reviewableBookings, setReviewableBookings] = useState([]);

  const [totalReviews, setTotalReviews] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/reviews/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Unable to load your reviews."
        );
        setLoading(false);
        return;
      }

      setReviews(data.reviews || []);
      setReviewableBookings(
        data.reviewable_bookings || []
      );
      setTotalReviews(data.total_reviews || 0);
      setPendingReviews(data.pending_reviews || 0);
    } catch (error) {
      console.error(
        "Load reviews error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );
    }

    setLoading(false);
  }

  function openReviewForm(booking) {
    setSelectedBooking(booking);
    setRating(0);
    setComment("");
    setMessage("");
  }

  function closeReviewForm() {
    if (submitting) {
      return;
    }

    setSelectedBooking(null);
    setRating(0);
    setComment("");
  }

  async function submitReview() {
    if (!selectedBooking) {
      return;
    }

    if (rating === 0) {
      setMessage("Please select a rating.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/reviews`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            booking_id:
              selectedBooking.booking_id,
            rating,
            comment:
              comment.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            "Unable to submit review."
        );
        setSubmitting(false);
        return;
      }

      setSelectedBooking(null);
      setRating(0);
      setComment("");

      await loadReviews();

      setMessage(
        "Your review was submitted successfully."
      );
    } catch (error) {
      console.error(
        "Submit review error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );
    }

    setSubmitting(false);
  }

  function formatDate(date) {
    if (!date) {
      return "";
    }

    const value = new Date(date);

    return value.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  // ============================================================
  // FORMAT MYSQL TIME CORRECTLY
  // ============================================================

  function formatTime(time) {
    if (!time) {
      return "";
    }

    const timeString = String(time);

    const parts = timeString.split(":");

    if (parts.length < 2) {
      return "";
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return "";
    }

    const period = hours >= 12
      ? "PM"
      : "AM";

    const displayHours =
      hours % 12 === 0
        ? 12
        : hours % 12;

    return `${displayHours}:${String(
      minutes
    ).padStart(2, "0")} ${period}`;
  }

  function getInitial(name) {
    return (
      name?.charAt(0)?.toUpperCase() ||
      "P"
    );
  }

  if (loading) {
    return (
      <div className="my-reviews-page">

        <nav className="reviews-navbar">

          <div
            className="reviews-brand"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <div className="reviews-brand-icon">
              N
            </div>

            <span>NiborAid</span>
          </div>

          <button
            className="reviews-back-btn"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

        </nav>

        <main className="reviews-container">

          <div className="reviews-loading">
            Loading your reviews...
          </div>

        </main>

      </div>
    );
  }

  return (
    <div className="my-reviews-page">

      {/* NAVBAR */}

      <nav className="reviews-navbar">

        <div
          className="reviews-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <div className="reviews-brand-icon">
            N
          </div>

          <span>NiborAid</span>
        </div>

        <button
          className="reviews-back-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Dashboard
        </button>

      </nav>


      {/* MAIN CONTENT */}

      <main className="reviews-container">

        <section className="reviews-header">

          <div className="reviews-header-badge">
            CUSTOMER REVIEWS
          </div>

          <h1>
            My Reviews
          </h1>

          <p>
            Share your experience and keep
            track of the professionals you
            have reviewed.
          </p>

        </section>


        {/* MESSAGE */}

        {message && (
          <div className="reviews-message">
            {message}
          </div>
        )}


        {/* STATS */}

        <section className="reviews-stats">

          <div className="review-stat-card">

            <div className="review-stat-icon">
              ★
            </div>

            <div>
              <span>
                TOTAL REVIEWS
              </span>

              <strong>
                {totalReviews}
              </strong>
            </div>

          </div>


          <div className="review-stat-card">

            <div className="review-stat-icon pending">
              !
            </div>

            <div>
              <span>
                PENDING REVIEWS
              </span>

              <strong>
                {pendingReviews}
              </strong>
            </div>

          </div>

        </section>


        {/* PENDING REVIEWS */}

        {reviewableBookings.length > 0 && (
          <section className="review-section">

            <div className="review-section-header">

              <div>
                <span className="section-label">
                  ACTION NEEDED
                </span>

                <h2>
                  Review your experience
                </h2>
              </div>

              <span className="pending-count">
                {reviewableBookings.length} pending
              </span>

            </div>


            <div className="reviewable-list">

              {reviewableBookings.map(
                (booking) => (

                  <div
                    className="reviewable-card"
                    key={booking.booking_id}
                  >

                    <div className="review-worker-info">

                      <div className="review-avatar">
                        {getInitial(
                          booking.worker_name
                        )}
                      </div>

                      <div>

                        <h3>
                          {booking.worker_name}
                        </h3>

                        <p>
                          {booking.service_name}
                        </p>

                      </div>

                    </div>


                    <div className="review-booking-info">

                      <span>
                        📅{" "}
                        {formatDate(
                          booking.booking_date
                        )}
                      </span>

                      <span>
                        🕐{" "}
                        {formatTime(
                          booking.start_time
                        )}
                        {" - "}
                        {formatTime(
                          booking.end_time
                        )}
                      </span>

                    </div>


                    <button
                      className="write-review-btn"
                      onClick={() =>
                        openReviewForm(
                          booking
                        )
                      }
                    >
                      Write Review
                    </button>

                  </div>

                )
              )}

            </div>

          </section>
        )}


        {/* COMPLETED REVIEWS */}

        <section className="review-section">

          <div className="review-section-header">

            <div>
              <span className="section-label">
                YOUR FEEDBACK
              </span>

              <h2>
                Reviews you've submitted
              </h2>
            </div>

          </div>


          {reviews.length === 0 ? (

            <div className="empty-reviews">

              <div className="empty-reviews-icon">
                ★
              </div>

              <h3>
                No reviews yet
              </h3>

              <p>
                Once you complete a service,
                you can share your experience
                here.
              </p>

            </div>

          ) : (

            <div className="submitted-reviews">

              {reviews.map((review) => (

                <div
                  className="submitted-review-card"
                  key={review.review_id}
                >

                  <div className="submitted-review-top">

                    <div className="review-worker-info">

                      <div className="review-avatar">
                        {getInitial(
                          review.worker_name
                        )}
                      </div>

                      <div>

                        <h3>
                          {review.worker_name}
                        </h3>

                        <p>
                          {review.service_name}
                        </p>

                      </div>

                    </div>

                    <div className="review-rating">

                      <div className="stars">
                        {"★".repeat(
                          review.rating
                        )}

                        <span>
                          {"★".repeat(
                            5 - review.rating
                          )}
                        </span>
                      </div>

                      <strong>
                        {review.rating}/5
                      </strong>

                    </div>

                  </div>


                  {review.comment && (
                    <div className="review-comment">
                      "{review.comment}"
                    </div>
                  )}


                  <div className="review-date">
                    Reviewed on{" "}
                    {formatDate(
                      review.reviewed_at
                    )}
                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </main>


      {/* REVIEW MODAL */}

      {selectedBooking && (
        <div
          className="review-modal-overlay"
          onClick={closeReviewForm}
        >

          <div
            className="review-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="review-modal-header">

              <div>

                <span className="section-label">
                  SHARE YOUR EXPERIENCE
                </span>

                <h2>
                  Review {selectedBooking.worker_name}
                </h2>

              </div>

              <button
                className="close-review-btn"
                onClick={closeReviewForm}
                disabled={submitting}
              >
                ×
              </button>

            </div>


            <div className="review-modal-service">
              {selectedBooking.service_name}

              <span>
                •{" "}
                {formatDate(
                  selectedBooking.booking_date
                )}
              </span>
            </div>


            <div className="rating-selector">

              <label>
                How was your experience?
              </label>

              <div className="rating-stars">

                {[1, 2, 3, 4, 5].map(
                  (star) => (

                    <button
                      key={star}
                      type="button"
                      className={
                        star <= rating
                          ? "star selected"
                          : "star"
                      }
                      onClick={() =>
                        setRating(star)
                      }
                    >
                      ★
                    </button>

                  )
                )}

              </div>

              <p>
                {rating === 0
                  ? "Select a rating"
                  : rating === 5
                  ? "Excellent"
                  : rating === 4
                  ? "Very good"
                  : rating === 3
                  ? "Good"
                  : rating === 2
                  ? "Needs improvement"
                  : "Poor"}
              </p>

            </div>


            <div className="review-comment-field">

              <label>
                Your comments
                <span>Optional</span>
              </label>

              <textarea
                rows="5"
                maxLength="500"
                value={comment}
                onChange={(e) =>
                  setComment(
                    e.target.value
                  )
                }
                placeholder="Tell us about your experience..."
              />

              <div className="character-count">
                {comment.length}/500
              </div>

            </div>


            <div className="review-modal-actions">

              <button
                className="cancel-review-btn"
                onClick={closeReviewForm}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                className="submit-review-btn"
                onClick={submitReview}
                disabled={
                  submitting ||
                  rating === 0
                }
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Review"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default MyReviews;