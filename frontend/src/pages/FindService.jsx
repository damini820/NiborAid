import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FindService.css";
import API_URL from "../config";

function FindService() {
  const navigate = useNavigate();

  const [problem, setProblem] = useState("");
  const [service, setService] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [problemType, setProblemType] = useState("");
  const [workers, setWorkers] = useState([]);

  const [bookingDate, setBookingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ============================================================
  // FIND MATCHING WORKERS
  // ============================================================

  async function findWorkers(serviceId) {
    try {
      const params = new URLSearchParams();

      params.append("service_id", serviceId);
      params.append("date", bookingDate);
      params.append("start_time", startTime);
      params.append("end_time", endTime);

      const response = await fetch(
        `${API_URL}/workers?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Unable to find workers.");
        return;
      }

      setWorkers(data);

      if (data.length === 0) {
        setMessage(
          "No available workers found for this service and time."
        );
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error("Worker search error:", error);
      setMessage("Unable to connect to the server.");
    }
  }

  // ============================================================
  // AI SERVICE DETECTION
  // ============================================================

  async function detectService() {
    if (!problem.trim()) {
      setMessage("Please describe your problem.");
      return;
    }

    if (problem.trim().length < 5) {
      setMessage(
        "Please provide a little more detail about your problem."
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setService("");
    setConfidence(null);
    setProblemType("");
    setWorkers([]);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/ai/detect-service`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            problem: problem.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.detail || "Unable to detect the service."
        );
        setLoading(false);
        return;
      }

      // Invalid / unclear problem
      if (data.service === "INVALID" || !data.service_id) {
        setService("");
        setConfidence(data.confidence);
        setProblemType(data.problem_type || "");

        setMessage(
          "We couldn't identify a service from your description. Please describe the problem in a little more detail."
        );

        setLoading(false);
        return;
      }

      // Save AI result
      setService(data.service);
      setConfidence(data.confidence);
      setProblemType(data.problem_type || "");

      // Find workers
      await findWorkers(data.service_id);
    } catch (error) {
      console.error("Service detection error:", error);

      setMessage("Unable to connect to the server.");
    }

    setLoading(false);
  }

  // ============================================================
  // SEARCH VALIDATION
  // ============================================================

  function handleSearch() {
    if (!bookingDate) {
      setMessage("Please select a booking date.");
      return;
    }

    if (!startTime || !endTime) {
      setMessage("Please select both start and end time.");
      return;
    }

    if (startTime >= endTime) {
      setMessage("Start time must be before end time.");
      return;
    }

    if (bookingDate === today) {
      const now = new Date();

      const currentHours = String(now.getHours()).padStart(2, "0");
      const currentMinutes = String(now.getMinutes()).padStart(2, "0");

      const currentTime = `${currentHours}:${currentMinutes}`;

      if (startTime <= currentTime) {
        setMessage("Booking start time must be in the future.");
        return;
      }
    }

    detectService();
  }

  // ============================================================
  // BOOK WORKER
  // ============================================================

  function handleBookWorker(worker) {
    navigate("/booking", {
      state: {
        worker,
        service,
        bookingDate,
        startTime,
        endTime,
        problem: problem.trim(),
      },
    });
  }

  // ============================================================
  // VIEW WORKER PROFILE
  // ============================================================

  function handleViewProfile(workerId) {
    navigate(`/worker/${workerId}`);
  }

  // ============================================================
  // FORMAT CONFIDENCE
  // ============================================================

  function formatConfidence(value) {
    if (value === null || value === undefined) {
      return null;
    }

    return `${Math.round(Number(value) * 100)}%`;
  }

  // ============================================================
  // FORMAT MATCH SCORE
  // ============================================================

  function formatMatchScore(value) {
    if (value === null || value === undefined) {
      return "—";
    }

    return `${Number(value).toFixed(0)}%`;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="find-service-page">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav className="service-navbar">

        <div
          className="service-brand"
          onClick={() => navigate("/dashboard")}
        >
          <div className="service-brand-icon">
            N
          </div>

          <span>NiborAid</span>
        </div>

        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </nav>

      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="find-service-container">

        {/* ===================================================
            HEADER
        ==================================================== */}

        <section className="service-header">

          <div className="service-badge">
            AI POWERED
          </div>

          <h1>
            What do you need help with?
          </h1>

          <p>
            Describe your problem in your own words and
            NiborAid will find the right service and
            professionals for you.
          </p>

        </section>

        {/* ===================================================
            SEARCH CARD
        ==================================================== */}

        <section className="search-card">

          {/* Problem */}

          <div className="form-section">

            <label>
              Describe your problem
            </label>

            <textarea
              rows="5"
              value={problem}
              onChange={(e) => {
                setProblem(e.target.value);
                setWorkers([]);
                setService("");
                setConfidence(null);
                setProblemType("");
                setMessage("");
              }}
              placeholder="Example: My AC is blowing hot air..."
            />

            <p className="field-hint">
              Tell us what is wrong and our AI will identify
              the required service.
            </p>

          </div>

          {/* Booking fields */}

          <div className="booking-fields">

            {/* Date */}

            <div className="form-section">

              <label>
                Date
              </label>

              <div className="picker-wrapper">

                <input
                  type="date"
                  min={today}
                  value={bookingDate}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setWorkers([]);
                    setMessage("");
                  }}
                />

              </div>

              <p className="picker-hint">
                Choose your preferred date.
              </p>

            </div>

            {/* Start Time */}

            <div className="form-section">

              <label>
                Start Time
              </label>

              <div className="picker-wrapper">

                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setWorkers([]);
                    setMessage("");
                  }}
                />

              </div>

              <p className="picker-hint">
                When should the service start?
              </p>

            </div>

            {/* End Time */}

            <div className="form-section">

              <label>
                End Time
              </label>

              <div className="picker-wrapper">

                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setWorkers([]);
                    setMessage("");
                  }}
                />

              </div>

              <p className="picker-hint">
                When should the service end?
              </p>

            </div>

          </div>

          {/* Find button */}

          <button
            className="find-help-btn"
            onClick={handleSearch}
            disabled={loading}
          >
            {loading
              ? "Finding the right professionals..."
              : "Find Service"}
          </button>

          {/* Message */}

          {message && (
            <div className="message-box">
              {message}
            </div>
          )}

        </section>

        {/* ===================================================
            DETECTED SERVICE
        ==================================================== */}

        {service && (
          <section className="detected-service">

            <div className="detected-icon">
              ✓
            </div>

            <div>

              <span>
                AI DETECTED SERVICE
              </span>

              <h2>
                {service}
              </h2>

              {problemType && (
                <p>
                  <strong>
                    Problem identified:
                  </strong>{" "}
                  {problemType}
                </p>
              )}

              {confidence !== null && (
                <div className="ai-confidence">
                  AI confidence: {formatConfidence(confidence)}
                </div>
              )}

              <p>
                We found professionals who provide this
                service and are available for your
                requested time.
              </p>

            </div>

          </section>
        )}

        {/* ===================================================
            WORKERS
        ==================================================== */}

        {workers.length > 0 && (
          <section className="workers-section">

            <div className="workers-header">

              <div>

                <span className="small-heading">
                  AI-MATCHED PROFESSIONALS
                </span>

                <h2>
                  Recommended for you
                </h2>

              </div>

              <span className="worker-count">
                {workers.length} available
              </span>

            </div>

            <div className="workers-grid">

              {workers.map((worker) => (

                <div
                  className="worker-card"
                  key={worker.id}
                >

                  {/* =========================================
                      WORKER TOP + MATCH SCORE
                  ========================================== */}

                  <div className="worker-top">

                    <div className="worker-avatar">
                      {worker.name
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>

                      <h3>
                        {worker.name}
                      </h3>

                      <p className="worker-rating">
                        ⭐{" "}
                        {worker.rating
                          ? Number(worker.rating).toFixed(1)
                          : "New"}
                      </p>

                    </div>

                    <div className="match-score">

                      <span>
                        MATCH
                      </span>

                      <strong>
                        {formatMatchScore(worker.match_score)}
                      </strong>

                    </div>

                  </div>

                  {/* =========================================
                      AVAILABLE
                  ========================================== */}

                  <div className="available-label">
                    ● AVAILABLE
                  </div>

                  {/* =========================================
                      WORKER STATS
                  ========================================== */}

                  <div className="worker-stats">

                    <div className="worker-stat">
                      ⭐{" "}
                      {worker.rating
                        ? Number(worker.rating).toFixed(1)
                        : "New"}{" "}
                      rating
                    </div>

                    <div className="worker-stat">
                      🛠{" "}
                      {worker.experience_years || 0}{" "}
                      years experience
                    </div>

                    {worker.distance_km !== null &&
                      worker.distance_km !== undefined && (
                        <div className="worker-stat">
                          📍{" "}
                          {Number(worker.distance_km).toFixed(1)}{" "}
                          km away
                        </div>
                      )}

                  </div>

                  {/* =========================================
                      BIO
                  ========================================== */}

                  {worker.bio && (
                    <p className="worker-bio">
                      {worker.bio}
                    </p>
                  )}

                  {/* =========================================
                      WHY THIS WORKER
                  ========================================== */}

                  {worker.match_reasons &&
                    worker.match_reasons.length > 0 && (

                      <div className="match-reasons">

                        <div className="match-reasons-title">
                          Why we recommend this worker
                        </div>

                        {worker.match_reasons.map(
                          (reason, index) => (

                            <div
                              className="match-reason"
                              key={index}
                            >
                              {reason}
                            </div>

                          )
                        )}

                      </div>

                    )}

                  {/* =========================================
                      ACTIONS
                  ========================================== */}

                  <div className="worker-actions">

                    <button
                      className="book-worker-btn"
                      onClick={() =>
                        handleBookWorker(worker)
                      }
                    >
                      Book Worker
                    </button>

                    <button
                      className="profile-btn"
                      onClick={() =>
                        handleViewProfile(worker.id)
                      }
                    >
                      View Profile
                    </button>

                  </div>

                </div>

              ))}

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default FindService;