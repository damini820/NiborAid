import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./WorkerProfile.css";
import API_URL from "../config";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SERVICE_EMOJIS = {
  Plumbing: "🔧",
  Electrical: "⚡",
  Carpentry: "🪚",
  "AC Repair": "❄️",
  "Appliance Repair": "🔌",
  Painting: "🎨",
  Cleaning: "🧹",
  "Pest Control": "🐜",
};

function getServiceEmoji(serviceName) {
  return SERVICE_EMOJIS[serviceName] || "🛠️";
}

function WorkerProfile() {
  const navigate = useNavigate();
  const { workerId } = useParams();

  const isOwnProfile = !workerId;

  const [workerData, setWorkerData] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWorkerProfile() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (isOwnProfile && !token) {
          navigate("/login");
          return;
        }

        const profileUrl = isOwnProfile
          ? `${API_URL}/workers/me`
          : `${API_URL}/workers/${workerId}`;

        const profileOptions = isOwnProfile
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : {};

        const profileResponse = await fetch(
          profileUrl,
          profileOptions
        );

        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.detail ||
              "Unable to load worker profile."
          );
        }

        if (!profileData || !profileData.worker) {
          throw new Error(
            "Worker profile data is unavailable."
          );
        }

        const currentWorkerId = profileData.worker.id;

        const reviewsResponse = await fetch(
          `${API_URL}/reviews/worker/${currentWorkerId}`
        );

        const reviews = await reviewsResponse.json();

        if (!reviewsResponse.ok) {
          throw new Error(
            reviews.detail ||
              "Unable to load worker reviews."
          );
        }

        if (cancelled) return;

        setWorkerData(profileData);
        setReviewsData(reviews);
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Worker profile loading error:",
          err
        );

        setError(
          typeof err.message === "string"
            ? err.message
            : "Unable to load the professional profile."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWorkerProfile();

    return () => {
      cancelled = true;
    };
  }, [workerId, isOwnProfile, navigate]);

  // ============================================================
  // FORMAT TIME
  // ============================================================

  function formatTime(timeString) {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");

    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  // ============================================================
  // GET AVAILABILITY
  // ============================================================

  function getAvailabilityForDay(day) {
    const availability =
      workerData?.availability || [];

    return availability.find(
      (item) =>
        item.day_of_week === day
    );
  }

  // ============================================================
  // STARS
  // ============================================================

  function renderStars(rating) {
    const numericRating =
      Number(rating) || 0;

    return (
      <div className="worker-profile-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={
              star <= Math.round(numericRating)
                ? "star-filled"
                : "star-empty"
            }
          >
            ★
          </span>
        ))}
      </div>
    );
  }

  // ============================================================
  // NAVIGATION
  // ============================================================

  function handleBook() {
    navigate("/find-service");
  }

  function handleEditProfile() {
    navigate("/worker/edit-profile");
  }

  function handleBack() {
    if (isOwnProfile) {
      navigate("/dashboard");
    } else {
      navigate("/find-service");
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="worker-profile-page">
        <div className="worker-profile-loading">
          <div className="worker-profile-spinner"></div>

          <p>
            Loading professional profile...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error || !workerData) {
    return (
      <div className="worker-profile-page">
        <nav className="worker-profile-navbar">
          <div
            className="worker-profile-brand"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <div className="worker-profile-brand-icon">
              N
            </div>

            <div className="worker-profile-brand-text">
              <strong>NiborAid</strong>
              <span>
                Your local service marketplace
              </span>
            </div>
          </div>
        </nav>

        <main className="worker-profile-container">
          <div className="worker-profile-error">
            <div className="worker-profile-error-icon">
              !
            </div>

            <h2>
              Unable to load profile
            </h2>

            <p>
              {error ||
                "This professional could not be found."}
            </p>

            <button onClick={handleBack}>
              {isOwnProfile
                ? "← Dashboard"
                : "← Find a Service"}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ============================================================
  // DATA
  // ============================================================

  const worker = workerData.worker;

  const services =
    workerData.services || [];

  const reviews =
    reviewsData?.reviews || [];

  const totalReviews =
    reviewsData?.total_reviews ||
    reviews.length ||
    0;

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="worker-profile-page">

      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="worker-profile-navbar">

        <div
          className="worker-profile-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <div className="worker-profile-brand-icon">
            N
          </div>

          <div className="worker-profile-brand-text">
            <strong>NiborAid</strong>

            <span>
              Your local service marketplace
            </span>
          </div>
        </div>

        <button
          className="worker-profile-back-btn"
          onClick={handleBack}
        >
          {isOwnProfile
            ? "← Dashboard"
            : "← Back to Services"}
        </button>

      </nav>

      <main className="worker-profile-container">

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="worker-profile-hero">

          <div className="worker-profile-avatar">
            {worker.name
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div className="worker-profile-main-info">

            <span className="worker-profile-badge">
              {isOwnProfile
                ? "YOUR PROFESSIONAL PROFILE"
                : "VERIFIED PROFESSIONAL"}
            </span>

            <h1>{worker.name}</h1>

            <div className="worker-profile-rating-row">

              {renderStars(worker.rating)}

              <strong>
                {Number(
                  worker.rating || 0
                ).toFixed(2)}
              </strong>

              <span>
                ({totalReviews}{" "}
                {totalReviews === 1
                  ? "review"
                  : "reviews"})
              </span>

            </div>

            <p className="worker-profile-bio-preview">
              {worker.bio ||
                "Professional local service provider ready to help with your needs."}
            </p>

            <div className="worker-profile-hero-stats">

              <div className="hero-stat">
                <span className="hero-stat-icon">
                  💼
                </span>

                <div>
                  <strong>
                    {worker.experience_years ||
                      0}
                  </strong>

                  <span>
                    Years Experience
                  </span>
                </div>
              </div>

              <div className="hero-stat">
                <span className="hero-stat-icon">
                  🛠️
                </span>

                <div>
                  <strong>
                    {services.length}
                  </strong>

                  <span>
                    {services.length === 1
                      ? "Service"
                      : "Services"}
                  </span>
                </div>
              </div>

              <div className="hero-stat">
                <span className="hero-stat-icon">
                  ✓
                </span>

                <div>
                  <strong>
                    {worker.is_available
                      ? "Available"
                      : "Unavailable"}
                  </strong>

                  <span>
                    Current Status
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ==================================================
              TOP ACTION
          ================================================== */}

          <div className="worker-profile-action">

            <div className="availability-status">

              <span
                className={
                  worker.is_available
                    ? "status-dot status-online"
                    : "status-dot status-offline"
                }
              ></span>

              {worker.is_available
                ? "Available for bookings"
                : "Currently unavailable"}

            </div>

            {isOwnProfile ? (
              <button
                className="worker-book-btn"
                onClick={handleEditProfile}
              >
                Edit Profile
                <span>✎</span>
              </button>
            ) : (
              <button
                className="worker-book-btn"
                onClick={handleBook}
                disabled={!worker.is_available}
              >
                Book This Professional
                <span>→</span>
              </button>
            )}

          </div>

        </section>

        {/* ====================================================
            MAIN GRID
        ==================================================== */}

        <div className="worker-profile-grid">

          {/* ==================================================
              LEFT COLUMN
          ================================================== */}

          <div className="worker-profile-left">

            {/* =================================================
                ABOUT
            ================================================= */}

            <section className="profile-section-card">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  👤
                </div>

                <div>
                  <h2>
                    About this professional
                  </h2>

                  <p>
                    Get to know your service provider.
                  </p>
                </div>

              </div>

              <p className="profile-about-text">
                {worker.bio ||
                  "This professional has not added a bio yet."}
              </p>

            </section>

            {/* =================================================
                SERVICES
            ================================================= */}

            <section
              className={`profile-section-card services-section ${
                services.length === 1
                  ? "single-service-section"
                  : ""
              }`}
            >

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  🛠️
                </div>

                <div>
                  <h2>
                    Services offered
                  </h2>

                  <p>
                    Professional services you can book.
                  </p>
                </div>

              </div>

              <div
                className={`worker-services-list ${
                  services.length === 1
                    ? "single-service-list"
                    : ""
                }`}
              >

                {services.length > 0 ? (

                  services.map((service) => (

                    <div
                      className="worker-service-item"
                      key={service.id}
                    >

                      <div className="service-emoji">
                        {getServiceEmoji(
                          service.name
                        )}
                      </div>

                      <div className="service-info">

                        <strong>
                          {service.name}
                        </strong>

                        {service.description && (
                          <p>
                            {service.description}
                          </p>
                        )}

                      </div>

                    </div>

                  ))

                ) : (

                  <p className="empty-profile-text">
                    No services listed.
                  </p>

                )}

              </div>

            </section>

            {/* =================================================
                REVIEWS
            ================================================= */}

            <section className="profile-section-card reviews-section">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  ⭐
                </div>

                <div>
                  <h2>
                    Customer reviews
                  </h2>

                  <p>
                    Real feedback from customers.
                  </p>
                </div>

              </div>

              <div className="reviews-summary">

                <div className="review-big-rating">

                  <strong>
                    {Number(
                      worker.rating || 0
                    ).toFixed(1)}
                  </strong>

                  {renderStars(worker.rating)}

                  <span>
                    {reviews.length}{" "}
                    {reviews.length === 1
                      ? "review"
                      : "reviews"}
                  </span>

                </div>

              </div>

              <div className="reviews-list">

                {reviews.length > 0 ? (

                  reviews.map(
                    (review, index) => (

                      <div
                        className="review-item"
                        key={
                          review.review_id ||
                          review.id ||
                          index
                        }
                      >

                        <div className="review-avatar">
                          {review.customer_name
                            ?.charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="review-content">

                          <div className="review-top-row">

                            <div>
                              <strong>
                                {
                                  review.customer_name
                                }
                              </strong>

                              <div className="review-stars">
                                {renderStars(
                                  review.rating
                                )}
                              </div>
                            </div>

                            <span className="review-date">
                              {review.created_at
                                ? new Date(
                                    review.created_at
                                  ).toLocaleDateString(
                                    "en-IN"
                                  )
                                : ""}
                            </span>

                          </div>

                          {review.comment && (
                            <p>
                              {review.comment}
                            </p>
                          )}

                        </div>

                      </div>

                    )
                  )

                ) : (

                  <div className="no-reviews">

                    <div>⭐</div>

                    <strong>
                      No reviews yet
                    </strong>

                    <p>
                      Be the first customer to
                      review this professional.
                    </p>

                  </div>

                )}

              </div>

            </section>

          </div>

          {/* ==================================================
              RIGHT COLUMN
          ================================================== */}

          <aside className="worker-profile-right">

            {/* =================================================
                WEEKLY AVAILABILITY
            ================================================= */}

            <section className="profile-section-card availability-card">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  📅
                </div>

                <div>
                  <h2>
                    Weekly availability
                  </h2>

                  <p>
                    Regular working hours.
                  </p>
                </div>

              </div>

              <div className="profile-weekly-schedule">

                {DAYS.map((day) => {

                  const dayAvailability =
                    getAvailabilityForDay(day);

                  return (
                    <div
                      className={`profile-day-row ${
                        dayAvailability
                          ? "profile-day-active"
                          : ""
                      }`}
                      key={day}
                    >

                      <span className="profile-day-name">
                        {day}
                      </span>

                      {dayAvailability ? (

                        <span className="profile-day-time">

                          {formatTime(
                            dayAvailability.start_time
                          )}

                          {" – "}

                          {formatTime(
                            dayAvailability.end_time
                          )}

                        </span>

                      ) : (

                        <span className="profile-day-off">
                          Not available
                        </span>

                      )}

                    </div>
                  );
                })}

              </div>

              <div className="availability-note">

                <span>💡</span>

                <p>
                  Availability is updated by the
                  professional and may change over
                  time.
                </p>

              </div>

            </section>

            {/* =================================================
                CONTACT
            ================================================= */}

            <section className="profile-section-card contact-card">

              <div className="profile-section-heading">

                <div className="profile-section-icon">
                  📞
                </div>

                <div>
                  <h2>Contact</h2>

                  <p>
                    Professional contact details.
                  </p>
                </div>

              </div>

              <div className="contact-item">

                <span>📱</span>

                <div>
                  <small>Phone</small>

                  <strong>
                    {worker.phone ||
                      "Not provided"}
                  </strong>
                </div>

              </div>

            </section>

          </aside>

        </div>

      </main>
    </div>
  );
}

export default WorkerProfile;