import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Availability.css";
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

function Availability() {
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(
    DAYS.map((day) => ({
      day,
      enabled: false,
      startTime: "09:00",
      endTime: "18:00",
    }))
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/worker/availability`,
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
            data.detail ||
              "Unable to load your availability."
          );
          setMessageType("error");
          setLoading(false);
          return;
        }

        const savedSchedule = DAYS.map((day) => {
          const saved = data.find(
            (item) => item.day_of_week === day
          );

          return {
            day,
            enabled: Boolean(saved),
            startTime: saved?.start_time || "09:00",
            endTime: saved?.end_time || "18:00",
            id: saved?.id || null,
          };
        });

        setSchedule(savedSchedule);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Availability loading error:",
          error
        );

        setMessage(
          "Unable to connect to the server. Please try again."
        );
        setMessageType("error");
        setLoading(false);
      }
    }

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function showMessage(text, type) {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
  }

  function toggleDay(day) {
    setSchedule((previous) =>
      previous.map((item) =>
        item.day === day
          ? {
              ...item,
              enabled: !item.enabled,
            }
          : item
      )
    );
  }

  function changeTime(day, field, value) {
    setSchedule((previous) =>
      previous.map((item) =>
        item.day === day
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  }

  async function handleSave() {
    if (saving) return;

    setMessage("");
    setMessageType("");

    const workingDays = schedule.filter(
      (item) => item.enabled
    );

    if (workingDays.length === 0) {
      showMessage(
        "Please select at least one working day.",
        "error"
      );
      return;
    }

    for (const day of workingDays) {
      if (!day.startTime || !day.endTime) {
        showMessage(
          `Please set working hours for ${day.day}.`,
          "error"
        );
        return;
      }

      if (day.startTime >= day.endTime) {
        showMessage(
          `Start time must be before end time on ${day.day}.`,
          "error"
        );
        return;
      }
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      /*
       * Get existing availability
       */
      const existingResponse = await fetch(
        `${API_URL}/worker/availability`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const existingData =
        await existingResponse.json();

      if (!existingResponse.ok) {
        showMessage(
          existingData.detail ||
            "Unable to load current availability.",
          "error"
        );
        return;
      }

      /*
       * Remove old weekly schedule
       */
      for (const item of existingData) {
        const deleteResponse = await fetch(
          `${API_URL}/worker/availability/${item.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!deleteResponse.ok) {
          const deleteData =
            await deleteResponse.json();

          throw new Error(
            deleteData.detail ||
              "Unable to update availability."
          );
        }
      }

      /*
       * Save new weekly schedule
       */
      for (const day of workingDays) {
        const response = await fetch(
          `${API_URL}/worker/availability`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              day_of_week: day.day,
              start_time: day.startTime,
              end_time: day.endTime,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              `Unable to save ${day.day} availability.`
          );
        }
      }

      showMessage(
        "Your availability has been updated successfully.",
        "success"
      );
    } catch (error) {
      console.error(
        "Save availability error:",
        error
      );

      showMessage(
        error.message ||
          "Unable to connect to the server. Please try again.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  function formatTime(timeString) {
    if (!timeString) return "";

    const [hours, minutes] =
      timeString.split(":");

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

  if (loading) {
    return (
      <div className="availability-page">
        <div className="availability-loading">
          <div className="availability-spinner"></div>
          <p>Loading your availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="availability-page">

      {/* ================================
          NAVBAR
      ================================= */}

      <nav className="availability-navbar">

        <div
          className="availability-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <div className="availability-brand-icon">
            N
          </div>

          <div className="availability-brand-text">
            <strong>NiborAid</strong>
            <span>Your local service marketplace</span>
          </div>
        </div>

        <button
          className="availability-dashboard-btn"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← Dashboard
        </button>

      </nav>

      {/* ================================
          MAIN
      ================================= */}

      <main className="availability-container">

        {/* HEADER */}

        <section className="availability-header">

          <div className="availability-header-content">

            <span className="availability-badge">
              PROFESSIONAL AREA
            </span>

            <h1>
              Manage your availability
            </h1>

            <p>
              Set your weekly working schedule
              so customers know exactly when
              they can book you.
            </p>

          </div>

          <div className="availability-header-icon">
            📅
          </div>

        </section>

        {/* WEEKLY SCHEDULE CARD */}

        <section className="availability-card">

          <div className="availability-card-header">

            <div className="availability-section-icon">
              ✓
            </div>

            <div>
              <h2>
                Weekly Availability
              </h2>

              <p>
                Select the days you work and
                set your working hours.
              </p>
            </div>

          </div>

          <div className="weekly-schedule">

            {schedule.map((item) => (

              <div
                className={`schedule-row ${
                  item.enabled
                    ? "schedule-row-active"
                    : ""
                }`}
                key={item.day}
              >

                {/* DAY */}

                <button
                  type="button"
                  className={`day-toggle ${
                    item.enabled
                      ? "day-toggle-active"
                      : ""
                  }`}
                  onClick={() =>
                    toggleDay(item.day)
                  }
                >

                  <span className="day-checkbox">
                    {item.enabled ? "✓" : ""}
                  </span>

                  <span className="day-name">
                    {item.day}
                  </span>

                </button>

                {/* TIMES */}

                {item.enabled ? (

                  <div className="schedule-times">

                    <div className="time-field">

                      <label>
                        From
                      </label>

                      <div className="time-input-wrapper">

                        <span>
                          🕐
                        </span>

                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(event) =>
                            changeTime(
                              item.day,
                              "startTime",
                              event.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                    <span className="time-separator">
                      →
                    </span>

                    <div className="time-field">

                      <label>
                        Until
                      </label>

                      <div className="time-input-wrapper">

                        <span>
                          🕐
                        </span>

                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(event) =>
                            changeTime(
                              item.day,
                              "endTime",
                              event.target.value
                            )
                          }
                        />

                      </div>

                    </div>

                    <div className="schedule-preview">

                      {formatTime(
                        item.startTime
                      )}

                      {" – "}

                      {formatTime(
                        item.endTime
                      )}

                    </div>

                  </div>

                ) : (

                  <span className="day-off-label">
                    Not available
                  </span>

                )}

              </div>

            ))}

          </div>

          {/* HINT */}

          <div className="availability-hint">

            <span>
              💡
            </span>

            <p>
              Customers will only see you as
              available on the days and times
              you select here.
            </p>

          </div>

          {/* SAVE */}

          <div className="availability-save-section">

            <div className="schedule-summary">

              <strong>
                {
                  schedule.filter(
                    (item) => item.enabled
                  ).length
                }{" "}

                working{" "}

                {
                  schedule.filter(
                    (item) => item.enabled
                  ).length === 1
                    ? "day"
                    : "days"
                }
              </strong>

              <span>
                in your weekly schedule
              </span>

            </div>

            <button
              type="button"
              className="save-availability-btn"
              onClick={handleSave}
              disabled={saving}
            >

              {saving
                ? "Saving Schedule..."
                : "Save Availability"}

              {!saving && (
                <span>
                  →
                </span>
              )}

            </button>

          </div>

        </section>

        {/* INFO CARD */}

        <section className="availability-info-card">

          <div className="availability-info-icon">
            ℹ
          </div>

          <div>

            <h3>
              How your availability works
            </h3>

            <p>
              Your weekly schedule is used when
              customers search for professionals.
              If a customer chooses a date that
              falls on one of your working days,
              they can book you during the hours
              you've set.
            </p>

          </div>

        </section>

      </main>

      {/* SUCCESS / ERROR POPUP */}

      {message && (

        <div
          className={`availability-toast ${
            messageType === "success"
              ? "availability-toast-success"
              : "availability-toast-error"
          }`}
        >

          <div className="availability-toast-icon">

            {messageType === "success"
              ? "✓"
              : "!"}

          </div>

          <div className="availability-toast-content">

            <strong>

              {messageType === "success"
                ? "Availability Updated"
                : "Something went wrong"}

            </strong>

            <span>
              {message}
            </span>

          </div>

          <button
            className="availability-toast-close"
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

export default Availability;