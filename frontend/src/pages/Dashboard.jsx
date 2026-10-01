import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // Get logged-in user
  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to read user data:", error);
  }

  const name = user?.name || "there";
  const role = user?.role || "";

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Remove older keys as well, in case
    // they exist from the previous version.
    localStorage.removeItem("user_id");
    localStorage.removeItem("name");
    localStorage.removeItem("role");

    navigate("/login");
  }

  return (
    <div className="dashboard-page">

      {/* ==================================================
          NAVBAR
          ================================================== */}

      <nav className="navbar">

        <div
          className="brand"
          onClick={() => navigate("/dashboard")}
        >
          <div className="brand-icon">
            N
          </div>

          <span>
            NiborAid
          </span>
        </div>


        <div className="nav-right">

          <span className="user-name">
            Hi, {name}
          </span>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </nav>


      {/* ==================================================
          MAIN CONTENT
          ================================================== */}

      <main className="dashboard-container">


        {/* ==================================================
            WELCOME SECTION
            ================================================== */}

        <section className="welcome-section">

          <div className="welcome-badge">
            {role === "customer"
              ? "CUSTOMER DASHBOARD"
              : "WORKER DASHBOARD"}
          </div>


          <h1>
            Welcome back, {name}! 👋
          </h1>


          <p className="welcome-text">
            {role === "customer"
              ? "Find trusted professionals for your household needs."
              : "Manage your services, availability and bookings."}
          </p>

        </section>



        {/* ==================================================
            CUSTOMER DASHBOARD
            ================================================== */}

        {role === "customer" && (

          <section>

            <h2 className="section-title">
              What do you need help with?
            </h2>


            <div className="dashboard-grid">


              {/* FIND SERVICE */}

              <div
                className="dashboard-card featured-card"
                onClick={() =>
                  navigate("/find-service")
                }
              >

                <div className="card-icon blue-icon">
                  🔎
                </div>


                <h3>
                  Find a Service
                </h3>


                <p>
                  Describe your problem and let
                  NiborAid find the right service
                  and available workers.
                </p>


                <span className="card-arrow">
                  →
                </span>

              </div>



              {/* MY BOOKINGS */}

              <div
                className="dashboard-card"
                onClick={() =>
                  navigate("/my-bookings")
                }
              >

                <div className="card-icon">
                  📅
                </div>


                <h3>
                  My Bookings
                </h3>


                <p>
                  View your bookings, track their
                  status and manage appointments.
                </p>


                <span className="card-arrow">
                  →
                </span>

              </div>



              {/* MY REVIEWS */}

              <div
                className="dashboard-card"
                onClick={() =>
                  navigate("/my-reviews")
                }
              >

                <div className="card-icon">
                  ⭐
                </div>


                <h3>
                  My Reviews
                </h3>


                <p>
                  Your feedback helps build a
                  trusted local community.
                </p>


                <span className="card-arrow">
                  →
                </span>

              </div>

            </div>

          </section>

        )}



        {/* ==================================================
            WORKER DASHBOARD
            ================================================== */}

        {role === "worker" && (

          <section>

            <h2 className="section-title">
              Manage your work
            </h2>


            <div className="dashboard-grid">


              {/* MY BOOKINGS */}

              <div
                className="dashboard-card featured-card"
                onClick={() =>
                  navigate("/worker-bookings")
                }
              >

                <div className="card-icon blue-icon">
                  📋
                </div>


                <h3>
                  My Bookings
                </h3>


                <p>
                  View customer requests and
                  manage your bookings.
                </p>


                <span className="card-arrow">
                  →
                </span>

              </div>



              {/* PROFILE */}

              <div
                className="dashboard-card"
                onClick={() =>
                  navigate("/worker/profile")
                }
              >

                <div className="card-icon">
                  👤
                </div>


                <h3>
                  My Profile
                </h3>


                <p>
                  Update your bio, experience
                  and location.
                </p>


                <span className="card-arrow">
                  →
                </span>

              </div>



              {/* AVAILABILITY */}

              <div
                className="dashboard-card"
                onClick={() =>
                  navigate(
                    "/worker/availability"
                  )
                }
              >

                <div className="card-icon">
                  🕐
                </div>


                <h3>
                  Availability
                </h3>


                <p>
                  Tell customers when you're
                  available for bookings.
                </p>


                <span className="card-arrow">
                  →
                </span>

              </div>

            </div>

          </section>

        )}



        {/* ==================================================
            HOW NIBORAID WORKS
            ================================================== */}

        <section className="how-section">

          <h2 className="section-title">
            How NiborAid works
          </h2>


          <div className="steps">


            {/* STEP 1 */}

            <div className="step">

              <div className="step-number">
                1
              </div>


              <div>

                <h3>
                  Describe
                </h3>

                <p>
                  Tell us what's wrong in
                  your own words.
                </p>

              </div>

            </div>



            {/* STEP 2 */}

            <div className="step">

              <div className="step-number">
                2
              </div>


              <div>

                <h3>
                  Match
                </h3>

                <p>
                  Our AI identifies the right
                  service and finds available
                  workers.
                </p>

              </div>

            </div>



            {/* STEP 3 */}

            <div className="step">

              <div className="step-number">
                3
              </div>


              <div>

                <h3>
                  Book
                </h3>

                <p>
                  Choose a professional and
                  book a convenient time.
                </p>

              </div>

            </div>

          </div>

        </section>


      </main>

    </div>
  );
}

export default Dashboard;