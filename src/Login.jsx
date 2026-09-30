import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);

    const enteredName = username.trim().toLowerCase();

    // =========================
    // TEACHER LOGIN
    // Username: Navpreet
    // Password: nav@13
    // =========================
    if (
      (enteredName === "navpreet" ||
        enteredName === "navpreet kaur") &&
      password === "nav@13"
    ) {
      const user = {
        id: "teacher-001",
        username: "navpreet kaur",
        role: "teacher",
        display_name: "Navpreet Kaur",
      };

      localStorage.setItem(
        "loggedInUser",
        JSON.stringify(user)
      );

      if (onLogin) {
        onLogin(user);
      }

      setLoading(false);

      navigate("/teacher-dashboard");
      return;
    }

    // =========================
    // SIR ADMIN LOGIN
    // Username: Pawan
    // Password: pawan@13
    // =========================
    if (
      (enteredName === "pawan" ||
        enteredName === "pawan grover") &&
      password === "pawan@13"
    ) {
      const user = {
        id: "sir-001",
        username: "pawan grover",
        role: "sir",
        display_name: "Pawan Grover",
      };

      localStorage.setItem(
        "loggedInUser",
        JSON.stringify(user)
      );

      if (onLogin) {
        onLogin(user);
      }

      setLoading(false);

      navigate("/sir-dashboard");
      return;
    }

    // Wrong credentials
    setError("Invalid username or password.");
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <span>FM</span>
        </div>

        <h1>Fee Management</h1>

        <p className="login-subtitle">
          Login to your admin account
        </p>

        <form onSubmit={handleLogin}>

          {/* USERNAME */}
          <div className="input-group">
            <label>Username</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              autoComplete="username"
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label>Password</label>

            <div className="password-box">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
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

          {/* ERROR */}
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "LOGIN"}
          </button>

        </form>

        <div className="login-footer">
          Institute Fee Management System
        </div>

      </div>
    </div>
  );
}