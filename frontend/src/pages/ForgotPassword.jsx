import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";
import API_URL from "../config";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");

  async function handleForgotPassword(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setResetToken("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            "Unable to process password reset request."
        );

        setLoading(false);
        return;
      }

      setSuccess(
        "Password reset request created successfully."
      );

      // Local development only.
      // Later this token will be sent through email.
      setResetToken(data.reset_token);

    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    }

    setLoading(false);
  }

  function continueToReset() {
    navigate(
      `/reset-password?token=${encodeURIComponent(
        resetToken
      )}`
    );
  }

  return (
    <div className="forgot-page">

      <div className="forgot-card">

        {/* BRAND */}

        <div
          className="forgot-brand"
          onClick={() =>
            navigate("/login")
          }
        >

          <div className="forgot-brand-icon">
            N
          </div>

          <span>
            NiborAid
          </span>

        </div>


        {/* HEADER */}

        <div className="forgot-header">

          <div className="forgot-icon">
            🔑
          </div>

          <h1>
            Forgot Password?
          </h1>

          <p>
            Enter the email address associated
            with your NiborAid account and we'll
            help you reset your password.
          </p>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleForgotPassword}
          className="forgot-form"
        >

          <div className="forgot-form-group">

            <label htmlFor="forgot-email">
              Email Address
            </label>

            <div className="forgot-input-wrapper">

              <span>
                ✉
              </span>

              <input
                id="forgot-email"
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


          {error && (

            <div className="forgot-error">
              <span>!</span>
              <p>{error}</p>
            </div>

          )}


          {success && (

            <div className="forgot-success">
              <span>✓</span>
              <p>{success}</p>
            </div>

          )}


          <button
            type="submit"
            className="forgot-submit"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : "Continue"}

            {!loading && (
              <span>→</span>
            )}

          </button>

        </form>


        {/* LOCAL DEVELOPMENT RESET */}

        {resetToken && (

          <div className="local-reset-box">

            <div className="local-reset-title">
              Local Development Mode
            </div>

            <p>
              Your reset token was generated
              successfully.
            </p>

            <div className="reset-token">
              {resetToken}
            </div>

            <button
              type="button"
              className="continue-reset-btn"
              onClick={continueToReset}
            >
              Continue to Reset Password →
            </button>

          </div>

        )}


        {/* BACK TO LOGIN */}

        <button
          type="button"
          className="back-login-btn"
          onClick={() =>
            navigate("/login")
          }
        >
          ← Back to Login
        </button>

      </div>

    </div>
  );
}

export default ForgotPassword;