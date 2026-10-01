import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import API_URL from "../config";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!name || !email || !phone || !password) {
      setError("Please fill in all the required fields.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            phone,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.detail ||
            data.error ||
            "Unable to create your account."
        );
        setLoading(false);
        return;
      }

      setSuccess("Account created successfully!");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    }

    setLoading(false);
  }

  return (
    <div className="signup-page">

      {/* LEFT SECTION */}
      <div className="signup-left">

        <div className="signup-brand">
          <div className="signup-brand-icon">N</div>
          <span>NiborAid</span>
        </div>

        <div className="signup-left-content">

          <span className="signup-tag">
            JOIN NIBORAID
          </span>

          <h1>
            One account,
            <br />
            <span>many possibilities.</span>
          </h1>

          <p>
            Whether you need a trusted professional or want
            to offer your skills, NiborAid makes connecting
            with local services simple.
          </p>

          <div className="signup-role-cards">

            <div className="signup-role-info">
              <div className="role-info-icon">⌂</div>

              <div>
                <strong>Need a service?</strong>
                <span>
                  Find professionals and book services
                  around you.
                </span>
              </div>
            </div>

            <div className="signup-role-info">
              <div className="role-info-icon">★</div>

              <div>
                <strong>Offer your services?</strong>
                <span>
                  Connect with customers and grow your
                  local business.
                </span>
              </div>
            </div>

          </div>

        </div>

        <div className="signup-left-footer">
          © 2026 NiborAid
        </div>

      </div>

      {/* RIGHT SECTION */}
      <div className="signup-right">

        <div className="signup-card">

          {/* Mobile brand */}
          <div className="signup-mobile-brand">
            <div className="signup-brand-icon">N</div>
            <span>NiborAid</span>
          </div>

          <div className="signup-header">

            <span className="signup-form-badge">
              CREATE ACCOUNT
            </span>

            <h2>Join NiborAid</h2>

            <p>
              Create your account and get started today.
            </p>

          </div>

          <form onSubmit={handleSignup}>

            {/* Name */}
            <div className="signup-form-group">

              <label>Full name</label>

              <div className="signup-input-wrapper">
                <span className="signup-input-icon">
                  👤
                </span>

                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

            </div>

            {/* Email + Phone */}
            <div className="signup-two-column">

              <div className="signup-form-group">

                <label>Email address</label>

                <div className="signup-input-wrapper">
                  <span className="signup-input-icon">
                    ✉
                  </span>

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

              </div>

              <div className="signup-form-group">

                <label>Phone number</label>

                <div className="signup-input-wrapper">
                  <span className="signup-input-icon">
                    ☎
                  </span>

                  <input
                    type="tel"
                    placeholder="10 digit number"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);

                      setPhone(value);
                    }}
                    autoComplete="tel"
                  />
                </div>

              </div>

            </div>

            {/* Password */}
            <div className="signup-form-group">

              <label>Password</label>

              <div className="signup-input-wrapper">

                <span className="signup-input-icon">
                  🔒
                </span>

                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="signup-show-password"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

              <div className="password-hint">
                Use at least 8 characters
              </div>

            </div>

            {/* Role */}
            <div className="signup-form-group">

              <label>How will you use NiborAid?</label>

              <div className="role-selection">

                <button
                  type="button"
                  className={`role-option ${
                    role === "customer"
                      ? "role-selected"
                      : ""
                  }`}
                  onClick={() => setRole("customer")}
                >
                  <div className="role-option-icon">
                    ⌂
                  </div>

                  <div className="role-option-text">
                    <strong>Customer</strong>
                    <span>
                      I need services
                    </span>
                  </div>

                  <div className="role-radio">
                    {role === "customer" && "✓"}
                  </div>
                </button>

                <button
                  type="button"
                  className={`role-option ${
                    role === "worker"
                      ? "role-selected"
                      : ""
                  }`}
                  onClick={() => setRole("worker")}
                >
                  <div className="role-option-icon">
                    ★
                  </div>

                  <div className="role-option-text">
                    <strong>Professional</strong>
                    <span>
                      I offer services
                    </span>
                  </div>

                  <div className="role-radio">
                    {role === "worker" && "✓"}
                  </div>
                </button>

              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="signup-message signup-error">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="signup-message signup-success">
                <span>✓</span>
                <p>{success}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="signup-submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create Account"}

              {!loading && <span>→</span>}
            </button>

          </form>

          <div className="signup-login-prompt">
            <span>Already have an account?</span>

            <button
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;