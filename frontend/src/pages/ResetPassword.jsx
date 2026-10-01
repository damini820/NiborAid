import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./ResetPassword.css";
import API_URL from "../config";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleResetPassword(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError(
        "Invalid or missing password reset token."
      );
      return;
    }

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            new_password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            "Unable to reset your password."
        );

        setLoading(false);
        return;
      }

      setSuccess(
        "Your password has been reset successfully."
      );

      setPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    }

    setLoading(false);
  }

  return (
    <div className="reset-page">

      <div className="reset-card">

        {/* BRAND */}

        <div
          className="reset-brand"
          onClick={() =>
            navigate("/login")
          }
        >
          <div className="reset-brand-icon">
            N
          </div>

          <span>
            NiborAid
          </span>
        </div>


        {/* HEADER */}

        <div className="reset-header">

          <div className="reset-icon">
            🔐
          </div>

          <h1>
            Reset Password
          </h1>

          <p>
            Create a new password for your
            NiborAid account.
          </p>

        </div>


        {/* FORM */}

        <form
          onSubmit={handleResetPassword}
          className="reset-form"
        >

          {/* NEW PASSWORD */}

          <div className="reset-form-group">

            <label htmlFor="new-password">
              New Password
            </label>

            <div className="reset-input-wrapper">

              <span className="reset-input-icon">
                🔒
              </span>

              <input
                id="new-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your new password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="reset-show-password"
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

            <small>
              Use at least 8 characters.
            </small>

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="reset-form-group">

            <label htmlFor="confirm-password">
              Confirm New Password
            </label>

            <div className="reset-input-wrapper">

              <span className="reset-input-icon">
                🔒
              </span>

              <input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm your new password"
                autoComplete="new-password"
              />

              <button
                type="button"
                className="reset-show-password"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div className="reset-error">

              <span>!</span>

              <p>
                {error}
              </p>

            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div className="reset-success">

              <span>✓</span>

              <p>
                {success}
              </p>

            </div>
          )}


          {/* SUBMIT */}

          {!success ? (
            <button
              type="submit"
              className="reset-submit"
              disabled={loading}
            >
              {loading
                ? "Resetting Password..."
                : "Reset Password"}

              {!loading && (
                <span>→</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="reset-submit"
              onClick={() =>
                navigate("/login")
              }
            >
              Continue to Login
              <span>→</span>
            </button>
          )}

        </form>


        {/* BACK */}

        {!success && (
          <button
            type="button"
            className="back-login-btn"
            onClick={() =>
              navigate("/login")
            }
          >
            ← Back to Login
          </button>
        )}

      </div>

    </div>
  );
}

export default ResetPassword;