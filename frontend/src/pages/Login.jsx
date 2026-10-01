import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import API_URL from "../config";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await 
        fetch(`${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail || "Invalid email or password."
        );
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "token",
        data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify({
          user_id: data.user_id,
          name: data.name,
          role: data.role,
        })
      );

      if (rememberMe) {
        localStorage.setItem(
          "rememberMe",
          "true"
        );
      } else {
        localStorage.removeItem("rememberMe");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      setError(
        "Unable to connect to the server. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      {/* ==================================================
          LEFT HERO SECTION
          ================================================== */}

      <section className="login-left">

        <div className="login-hero-background-circle circle-one"></div>
        <div className="login-hero-background-circle circle-two"></div>

        {/* Brand */}

        <div className="login-brand">

          <div className="login-brand-icon">
            N
          </div>

          <div className="login-brand-text">
            <span>NiborAid</span>

            <small>
              Your local service marketplace
            </small>
          </div>

        </div>


        {/* Hero Content */}

        <div className="login-left-content">

          <h1>
            Get the help you need,
            <br />
            <span>when you need it.</span>
          </h1>

          <p>
            Connect with trusted professionals
            in your area for all your home and
            personal service needs.
          </p>


          {/* Illustration */}

          <div className="login-illustration">

            <div className="illustration-cloud cloud-one"></div>
            <div className="illustration-cloud cloud-two"></div>

            {/* House */}

            <div className="illustration-house">

              <div className="house-roof"></div>

              <div className="house-body">

                <div className="house-window">
                  +
                </div>

                <div className="house-door"></div>

              </div>

            </div>


            {/* Service icons */}

            <div className="service-icon service-icon-one">
              🔧
            </div>

            <div className="service-icon service-icon-two">
              ⚡
            </div>

            <div className="service-icon service-icon-three">
              🧹
            </div>


            {/* Van */}

            <div className="service-van">

              <div className="van-body">
                <span>N</span>
              </div>

              <div className="van-front"></div>

              <div className="van-window"></div>

              <div className="van-wheel wheel-one"></div>
              <div className="van-wheel wheel-two"></div>

            </div>

            <div className="illustration-ground"></div>

          </div>


          {/* Features */}

          <div className="login-feature-list">

            <div className="login-feature">

              <div className="feature-icon">
                ✓
              </div>

              <div>
                <strong>
                  Trusted Professionals
                </strong>

                <span>
                  Verified and reviewed
                  service providers
                </span>
              </div>

            </div>


            <div className="login-feature">

              <div className="feature-icon">
                ⚡
              </div>

              <div>
                <strong>
                  Fast & Easy
                </strong>

                <span>
                  Get help in just a
                  few clicks
                </span>
              </div>

            </div>


            <div className="login-feature">

              <div className="feature-icon">
                ●
              </div>

              <div>
                <strong>
                  Local Service
                </strong>

                <span>
                  Find professionals
                  in your area
                </span>
              </div>

            </div>


            <div className="login-feature">

              <div className="feature-icon">
                ★
              </div>

              <div>
                <strong>
                  Quality Guaranteed
                </strong>

                <span>
                  Reliable service,
                  real reviews
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          RIGHT LOGIN SECTION
          ================================================== */}

      <section className="login-right">

        <div className="login-card">

          {/* Mobile brand */}

          <div className="login-mobile-brand">

            <div className="login-brand-icon">
              N
            </div>

            <span>
              NiborAid
            </span>

          </div>


          {/* Header */}

          <div className="login-header">

            <h2>
              Welcome Back
            </h2>

            <p>
              Log in to your account to continue
            </p>

          </div>


          {/* Login form */}

          <form
            onSubmit={handleLogin}
            className="login-form"
          >

            {/* EMAIL */}

            <div className="login-form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="login-input-wrapper">

                <span className="input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email address"
                  autoComplete="email"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="login-form-group">

              <div className="password-label-row">

                <label htmlFor="password">
                  Password
                </label>

                <button
  type="button"
  className="forgot-password"
  onClick={() =>
    navigate("/forgot-password")
  }
>
  Forgot password?
</button>

              </div>

              <div className="login-input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>


            {/* REMEMBER ME */}

            <label className="remember-me">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked
                  )
                }
              />

              <span>
                Remember me
              </span>

            </label>


            {/* ERROR */}

            {error && (

              <div className="login-error">

                <span>!</span>

                <p>
                  {error}
                </p>

              </div>

            )}


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >

              {loading
                ? "Logging in..."
                : "Log In"}

              {!loading && (
                <span>→</span>
              )}

            </button>

          </form>


          {/* DIVIDER */}

          <div className="login-divider">
            <span>OR</span>
          </div>


          {/* SIGNUP */}

          <div className="signup-prompt">

            <span>
              Don't have an account?
            </span>

            <button
              type="button"
              onClick={() =>
                navigate("/signup")
              }
            >
              Create a new account
            </button>

          </div>


          {/* Support */}

          <div className="login-support">

            Need help?{" "}

            <button
              type="button"
              onClick={() =>
                setError(
                  "Please contact NiborAid support."
                )
              }
            >
              Contact support
            </button>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Login;