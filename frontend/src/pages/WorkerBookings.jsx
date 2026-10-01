import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WorkerBookings.css";
import API_URL from "../config";

function WorkerBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchBookings() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/worker/bookings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setMessage(
            data.detail || "Unable to load your bookings."
          );
          setMessageType("error");
          setLoading(false);
          return;
        }

        setBookings(data);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;

        console.error("Worker bookings error:", error);

        setMessage(
          "Unable to connect to the server. Please try again."
        );
        setMessageType("error");
        setLoading(false);
      }
    }

    fetchBookings();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function refreshBookings() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/worker/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Unable to refresh bookings."
        );
        setMessageType("error");
        return;
      }

      setBookings(data);
    } catch (error) {
      console.error("Refresh bookings error:", error);

      setMessage(
        "Unable to connect to the server. Please try again."
      );
      setMessageType("error");
    }
  }

  async function updateBookingStatus(bookingId, status) {
    if (actionLoading !== null) return;

    setActionLoading(bookingId);
    setMessage("");
    setMessageType("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/worker/bookings/${bookingId}/status?status=${status}`,
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
          data.detail || "Unable to update booking."
        );
        setMessageType("error");
        return;
      }

      setMessage(
        status === "accepted"
          ? "Booking accepted successfully."
          : "Booking rejected successfully."
      );

      setMessageType("success");

      await refreshBookings();
    } catch (error) {
      console.error("Booking status error:", error);

      setMessage(
        "Unable to connect to the server. Please try again."
      );
      setMessageType("error");
    } finally {
      setActionLoading(null);
    }
  }

  async function completeBooking(bookingId) {
    if (actionLoading !== null) return;

    setActionLoading(bookingId);
    setMessage("");
    setMessageType("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/worker/bookings/${bookingId}/complete`,
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
          data.detail || "Unable to complete booking."
        );
        setMessageType("error");
        return;
      }

      setMessage("Booking marked as completed.");
      setMessageType("success");

      await refreshBookings();
    } catch (error) {
      console.error("Complete booking error:", error);

      setMessage(
        "Unable to connect to the server. Please try again."
      );
      setMessageType("error");
    } finally {
      setActionLoading(null);
    }
  }

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  const acceptedCount = bookings.filter(
    (booking) => booking.status === "accepted"
  ).length;

  const completedCount = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  const rejectedCount = bookings.filter(
    (booking) => booking.status === "rejected"
  ).length;

  function formatDate(dateString) {
    if (!dateString) return "";

    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getInitial(name) {
    return name?.charAt(0)?.toUpperCase() || "C";
  }

  return (
    <div className="worker-bookings-page">

      {/* ================================
          NAVBAR
      ================================= */}

      <nav className="worker-bookings-navbar">

        <div
          className="worker-bookings-brand"
          onClick={() => navigate("/dashboard")}
        >
          <div className="worker-bookings-brand-icon">
            N
          </div>

          <span>NiborAid</span>
        </div>

        <button
          className="worker-bookings-dashboard-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </nav>

      {/* ================================
          MAIN CONTENT
      ================================= */}

      <main className="worker-bookings-container">

        {/* HEADER */}

        <section className="worker-bookings-header">

          <div>
            <span className="worker-bookings-badge">
              PROFESSIONAL AREA
            </span>

            <h1>Manage your bookings</h1>

            <p>
              View customer requests, manage appointments,
              and keep track of your completed services.
            </p>
          </div>

        </section>

        {/* ================================
            MESSAGE
        ================================= */}

        {message && (
          <div
            className={`worker-bookings-message ${
              messageType === "success"
                ? "worker-success-message"
                : "worker-error-message"
            }`}
          >
            <span>
              {messageType === "success" ? "✓" : "!"}
            </span>

            <p>{message}</p>

            <button
              onClick={() => {
                setMessage("");
                setMessageType("");
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ================================
            STATISTICS
        ================================= */}

        {!loading && (
          <section className="worker-booking-stats">

            <div className="worker-stat-card">

              <div className="worker-stat-icon pending-icon">
                !
              </div>

              <div>
                <strong>{pendingCount}</strong>
                <span>Pending</span>
              </div>

            </div>

            <div className="worker-stat-card">

              <div className="worker-stat-icon accepted-icon">
                ✓
              </div>

              <div>
                <strong>{acceptedCount}</strong>
                <span>Accepted</span>
              </div>

            </div>

            <div className="worker-stat-card">

              <div className="worker-stat-icon completed-icon">
                ★
              </div>

              <div>
                <strong>{completedCount}</strong>
                <span>Completed</span>
              </div>

            </div>

            <div className="worker-stat-card">

              <div className="worker-stat-icon rejected-icon">
                ×
              </div>

              <div>
                <strong>{rejectedCount}</strong>
                <span>Rejected</span>
              </div>

            </div>

          </section>
        )}

        {/* ================================
            BOOKINGS SECTION
        ================================= */}

        <section className="worker-bookings-section">

          <div className="worker-bookings-section-header">

            <div>
              <h2>Your bookings</h2>

              <p>
                {bookings.length === 0
                  ? "No bookings yet"
                  : `${bookings.length} booking${
                      bookings.length !== 1 ? "s" : ""
                    }`}
              </p>
            </div>

          </div>

          {/* LOADING */}

          {loading ? (
            <div className="worker-bookings-loading">

              <div className="loading-spinner"></div>

              <p>Loading your bookings...</p>

            </div>

          ) : bookings.length === 0 ? (

            /* EMPTY STATE */

            <div className="worker-bookings-empty">

              <div className="empty-booking-icon">
                📅
              </div>

              <h3>No bookings yet</h3>

              <p>
                Customer booking requests will appear here
                when someone books your services.
              </p>

            </div>

          ) : (

            /* BOOKING LIST */

            <div className="worker-bookings-list">

              {bookings.map((booking) => (

                <article
                  className="worker-booking-card"
                  key={booking.id}
                >

                  {/* CUSTOMER */}

                  <div className="worker-booking-top">

                    <div className="customer-info">

                      <div className="customer-avatar">
                        {getInitial(
                          booking.customer_name
                        )}
                      </div>

                      <div>
                        <h3>
                          {booking.customer_name}
                        </h3>

                        <span>
                          {booking.customer_phone}
                        </span>
                      </div>

                    </div>

                    <span
                      className={`worker-status-badge status-${booking.status}`}
                    >
                      {booking.status}
                    </span>

                  </div>

                  {/* SERVICE */}

                  <div className="worker-service-row">

                    <div className="worker-service-main">

                      <span className="worker-detail-label">
                        SERVICE
                      </span>

                      <strong>
                        {booking.service_name}
                      </strong>

                    </div>

                  </div>

                  {/* DATE + TIME */}

                  <div className="worker-booking-details">

                    <div className="worker-detail-item">

                      <span className="worker-detail-icon">
                        📅
                      </span>

                      <div>
                        <span>Date</span>

                        <strong>
                          {formatDate(
                            booking.booking_date
                          )}
                        </strong>
                      </div>

                    </div>

                    <div className="worker-detail-item">

                      <span className="worker-detail-icon">
                        🕐
                      </span>

                      <div>
                        <span>Time</span>

                        <strong>
                          {booking.start_time} –{" "}
                          {booking.end_time}
                        </strong>
                      </div>

                    </div>

                  </div>

                  {/* PROBLEM */}

                  <div className="worker-problem">

                    <span>
                      CUSTOMER'S PROBLEM
                    </span>

                    <p>
                      {booking.problem_description}
                    </p>

                  </div>

                  {/* ================================
                      PENDING ACTIONS
                  ================================= */}

                  {booking.status === "pending" && (

                    <div className="worker-booking-actions">

                      <button
                        className="reject-booking-btn"
                        onClick={() =>
                          updateBookingStatus(
                            booking.id,
                            "rejected"
                          )
                        }
                        disabled={
                          actionLoading === booking.id
                        }
                      >
                        {actionLoading === booking.id
                          ? "Updating..."
                          : "Reject"}
                      </button>

                      <button
                        className="accept-booking-btn"
                        onClick={() =>
                          updateBookingStatus(
                            booking.id,
                            "accepted"
                          )
                        }
                        disabled={
                          actionLoading === booking.id
                        }
                      >
                        {actionLoading === booking.id
                          ? "Updating..."
                          : "Accept Booking"}
                      </button>

                    </div>

                  )}

                  {/* ================================
                      ACCEPTED ACTION
                  ================================= */}

                  {booking.status === "accepted" && (

                    <div className="worker-booking-actions">

                      <button
                        className="complete-booking-btn"
                        onClick={() =>
                          completeBooking(booking.id)
                        }
                        disabled={
                          actionLoading === booking.id
                        }
                      >
                        {actionLoading === booking.id
                          ? "Updating..."
                          : "✓ Mark as Completed"}
                      </button>

                    </div>

                  )}

                  {/* ================================
                      COMPLETED
                  ================================= */}

                  {booking.status === "completed" && (

                    <div className="completed-label">
                      ✓ Service completed
                    </div>

                  )}

                  {/* ================================
                      REJECTED
                  ================================= */}

                  {booking.status === "rejected" && (

                    <div className="rejected-label">
                      Booking rejected
                    </div>

                  )}

                  {/* ================================
                      CANCELLED
                  ================================= */}

                  {booking.status === "cancelled" && (

                    <div className="cancelled-label">
                      Booking cancelled by customer
                    </div>

                  )}

                </article>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default WorkerBookings;