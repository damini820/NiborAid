import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EditWorkerProfile.css";
import API_URL from "../config";

function EditWorkerProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    bio: "",
    experience_years: "",
    latitude: "",
    longitude: "",
  });

  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const serviceIcons = {
    Plumbing: "🔧",
    Electrical: "⚡",
    Carpentry: "🪚",
    "AC Repair": "❄️",
    "Appliance Repair": "🔌",
    Painting: "🎨",
    Cleaning: "🧹",
    "Pest Control": "🐜",
  };

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        // ----------------------------------------------------
        // Get logged-in user
        // ----------------------------------------------------

        const meResponse = await fetch(
          `${API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!meResponse.ok) {
          navigate("/login");
          return;
        }

        // ----------------------------------------------------
        // Get all services
        // ----------------------------------------------------

        const servicesResponse = await fetch(
          `${API_URL}/services`
        );

        const servicesData =
          await servicesResponse.json();

        if (
          !cancelled &&
          servicesResponse.ok
        ) {
          setServices(servicesData);
        }

        // ----------------------------------------------------
        // Get logged-in worker's own profile
        // ----------------------------------------------------

        const workerResponse = await fetch(
                `${API_URL}/workers/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const workerData =
          await workerResponse.json();

        if (!workerResponse.ok) {
          throw new Error(
            workerData.detail ||
              "Unable to load worker profile."
          );
        }

        const currentWorker =
          workerData.worker;

        if (!currentWorker) {
          throw new Error(
            "Worker profile not found."
          );
        }

        if (!cancelled) {
          setProfile({
            bio: currentWorker.bio || "",
            experience_years:
              currentWorker.experience_years ?? "",
            latitude:
              currentWorker.latitude ?? "",
            longitude:
              currentWorker.longitude ?? "",
          });

          setSelectedServices(
            (workerData.services || []).map(
              (service) => service.id
            )
          );

          setLoading(false);
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Profile loading error:",
          error
        );

        setMessage(
          error.message ||
            "Unable to load your worker profile."
        );

        setMessageType("error");
        setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  function handleChange(event) {
    const { name, value } =
      event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ============================================================
  // SERVICE SELECTION
  // ============================================================

  function toggleService(serviceId) {
    setSelectedServices((previous) => {
      if (previous.includes(serviceId)) {
        return previous.filter(
          (id) => id !== serviceId
        );
      }

      return [
        ...previous,
        serviceId,
      ];
    });
  }

  // ============================================================
  // GET CURRENT LOCATION
  // ============================================================

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setMessage(
        "Location services are not supported by your browser."
      );

      setMessageType("error");
      return;
    }

    setLocationLoading(true);
    setMessage("");
    setMessageType("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfile((previous) => ({
          ...previous,
          latitude:
            position.coords.latitude,
          longitude:
            position.coords.longitude,
        }));

        setLocationLoading(false);

        setMessage(
          "Location detected successfully."
        );

        setMessageType("success");

        setTimeout(() => {
          setMessage("");
          setMessageType("");
        }, 3000);
      },
      (error) => {
        console.error(
          "Location error:",
          error
        );

        setLocationLoading(false);

        if (error.code === 1) {
          setMessage(
            "Location permission was denied. Please allow location access."
          );
        } else {
          setMessage(
            "Unable to detect your location. Please try again."
          );
        }

        setMessageType("error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  async function handleSave(event) {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    // ----------------------------------------------------------
    // Validate bio
    // ----------------------------------------------------------

    if (!profile.bio.trim()) {
      setMessage(
        "Please enter a short bio."
      );

      setMessageType("error");
      return;
    }

    if (
      profile.bio.trim().length < 10
    ) {
      setMessage(
        "Bio must contain at least 10 characters."
      );

      setMessageType("error");
      return;
    }

    // ----------------------------------------------------------
    // Validate experience
    // ----------------------------------------------------------

    if (
      profile.experience_years === "" ||
      Number(profile.experience_years) < 0
    ) {
      setMessage(
        "Please enter a valid number of experience years."
      );

      setMessageType("error");
      return;
    }

    // ----------------------------------------------------------
    // Validate services
    // ----------------------------------------------------------

    if (
      selectedServices.length === 0
    ) {
      setMessage(
        "Please select at least one service you provide."
      );

      setMessageType("error");
      return;
    }

    // ----------------------------------------------------------
    // Validate location
    // ----------------------------------------------------------

    if (
      profile.latitude === "" ||
      profile.longitude === ""
    ) {
      setMessage(
        "Please set your location so customers can find you nearby."
      );

      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/workers/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bio: profile.bio.trim(),

            experience_years:
              Number(
                profile.experience_years
              ),

            latitude:
              Number(profile.latitude),

            longitude:
              Number(profile.longitude),

            service_ids:
              selectedServices,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.detail ||
            "Unable to update your profile."
        );

        setMessageType("error");
        return;
      }

      // --------------------------------------------------------
      // SUCCESS
      //
      // Go directly back to the worker's own profile.
      // --------------------------------------------------------

      navigate("/worker/profile");

    } catch (error) {
      console.error(
        "Save profile error:",
        error
      );

      setMessage(
        "Unable to connect to the server. Please try again."
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="edit-profile-page">
        <div className="edit-profile-loading">

          <div className="edit-loading-spinner"></div>

          <p>
            Loading your profile...
          </p>

        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="edit-profile-page">

      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="edit-profile-navbar">

        <div
          className="edit-profile-brand"
          onClick={() =>
            navigate("/dashboard")
          }
        >

          <div className="edit-profile-brand-icon">
            N
          </div>

          <span>
            NiborAid
          </span>

        </div>

        <button
          className="edit-profile-back"
          onClick={() =>
            navigate("/worker/profile")
          }
        >
          ← My Profile
        </button>

      </nav>

      <main className="edit-profile-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <section className="edit-profile-header">

          <div>

            <span className="edit-profile-badge">
              PROFESSIONAL PROFILE
            </span>

            <h1>
              Edit your professional profile
            </h1>

            <p>
              Update your experience, services,
              and location so customers can find
              the right professional for their needs.
            </p>

          </div>

          <div className="profile-header-icon">
            ★
          </div>

        </section>

        <form onSubmit={handleSave}>

          {/* ==================================================
              ABOUT
          ================================================== */}

          <section className="profile-card">

            <div className="profile-card-header">

              <div className="profile-section-icon">
                👤
              </div>

              <div>

                <h2>
                  About You
                </h2>

                <p>
                  Help customers understand your
                  professional experience.
                </p>

              </div>

            </div>

            <div className="profile-form-group">

              <label htmlFor="bio">
                Professional Bio
              </label>

              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Example: Experienced electrician specializing in home wiring, fans, switches and electrical repairs..."
                rows="5"
                maxLength="1000"
              />

              <div className="character-count">
                {profile.bio.length}/1000
              </div>

            </div>

            <div className="profile-form-group experience-group">

              <label htmlFor="experience_years">
                Years of Experience
              </label>

              <div className="experience-input-wrapper">

                <input
                  id="experience_years"
                  name="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={
                    profile.experience_years
                  }
                  onChange={handleChange}
                  placeholder="5"
                />

                <span>
                  years
                </span>

              </div>

              <small>
                Enter your total professional experience.
              </small>

            </div>

          </section>

          {/* ==================================================
              SERVICES
          ================================================== */}

          <section className="profile-card">

            <div className="profile-card-header">

              <div className="profile-section-icon service-section-icon">
                🛠
              </div>

              <div>

                <h2>
                  Services I Provide
                </h2>

                <p>
                  Select all the services you are
                  qualified to provide.
                </p>

              </div>

            </div>

            <div className="services-grid">

              {services.map(
                (service) => {

                  const selected =
                    selectedServices.includes(
                      service.id
                    );

                  return (
                    <button
                      type="button"
                      key={service.id}
                      className={`service-option ${
                        selected
                          ? "service-selected"
                          : ""
                      }`}
                      onClick={() =>
                        toggleService(
                          service.id
                        )
                      }
                    >

                      <div className="service-option-icon">
                        {serviceIcons[
                          service.name
                        ] || "🛠"}
                      </div>

                      <div className="service-option-content">

                        <strong>
                          {service.name}
                        </strong>

                        {service.description && (
                          <span>
                            {
                              service.description
                            }
                          </span>
                        )}

                      </div>

                      <div className="service-check">
                        {selected
                          ? "✓"
                          : ""}
                      </div>

                    </button>
                  );
                }
              )}

            </div>

            <div className="services-selected-info">

              <span>
                {selectedServices.length}
              </span>

              {selectedServices.length === 1
                ? " service selected"
                : " services selected"}

            </div>

          </section>

          {/* ==================================================
              LOCATION
          ================================================== */}

          <section className="profile-card location-card">

            <div className="profile-card-header">

              <div className="profile-section-icon location-section-icon">
                📍
              </div>

              <div>

                <h2>
                  Your Location
                </h2>

                <p>
                  We use your location to help customers
                  find nearby professionals.
                </p>

              </div>

            </div>

            <div className="location-box">

              <div className="location-main">

                <div className="location-pin">
                  📍
                </div>

                <div>

                  <strong>
                    {profile.latitude &&
                    profile.longitude
                      ? "Location is set"
                      : "Location not set"}
                  </strong>

                  <span>
                    {profile.latitude &&
                    profile.longitude
                      ? "Customers can find you nearby."
                      : "Set your location to appear in nearby searches."}
                  </span>

                </div>

              </div>

              {profile.latitude &&
                profile.longitude && (
                  <div className="location-status">
                    ✓
                  </div>
                )}

            </div>

            <button
              type="button"
              className="location-button"
              onClick={
                getCurrentLocation
              }
              disabled={
                locationLoading
              }
            >

              <span>
                📍
              </span>

              {locationLoading
                ? "Detecting Location..."
                : "Use My Current Location"}

            </button>

          </section>

          {/* ==================================================
              SAVE
          ================================================== */}

          <section className="profile-save-section">

            <div className="save-info">

              <div className="save-info-icon">
                ✓
              </div>

              <div>

                <strong>
                  Keep your profile updated
                </strong>

                <span>
                  Accurate information helps customers
                  choose the right professional.
                </span>

              </div>

            </div>

            <button
              type="submit"
              className="save-profile-button"
              disabled={saving}
            >

              {saving
                ? "Saving Changes..."
                : "Save Changes"}

              {!saving && (
                <span>
                  →
                </span>
              )}

            </button>

          </section>

        </form>

      </main>

      {/* ======================================================
          ERROR POPUP
      ====================================================== */}

      {message && (
        <div
          className={`profile-toast ${
            messageType === "success"
              ? "profile-toast-success"
              : "profile-toast-error"
          }`}
        >

          <div className="profile-toast-icon">
            {messageType === "success"
              ? "✓"
              : "!"}
          </div>

          <div className="profile-toast-content">

            <strong>
              {messageType === "success"
                ? "Profile Updated"
                : "Something went wrong"}
            </strong>

            <span>
              {message}
            </span>

          </div>

          <button
            className="profile-toast-close"
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

export default EditWorkerProfile;