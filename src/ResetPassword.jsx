import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import "./Login.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setSessionReady(true);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        event === "PASSWORD_RECOVERY" ||
        event === "SIGNED_IN"
      ) {
        if (session) {
          setSessionReady(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // STEP 1: Send password reset email
  const handleSendReset = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      setMessage(
        "Password reset link has been sent to your email. Please check your inbox."
      );
    } catch (err) {
      console.error(err);
      setError("Unable to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Save new password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Please enter both password fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error(error);
        setError(error.message);
        return;
      }

      setMessage(
        "Password changed successfully. You can now login with your new password."
      );

      setNewPassword("");
      setConfirmPassword("");

      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Unable to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        className="login-card"
        style={{
          width: "100%",
          maxWidth: "460px",
        }}
      >
        <div className="login-logo">
          <span>FM</span>
        </div>

        <h1>
          {sessionReady ? "Create New Password" : "Reset Password"}
        </h1>

        <p className="login-subtitle">
          {sessionReady
            ? "Enter your new password below."
            : "Enter your admin email to receive a password reset link."}
        </p>

        {!sessionReady ? (
          <form onSubmit={handleSendReset}>
            <div className="input-group">
              <label>Email Address</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Sending..."
                : "SEND RESET LINK"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <div className="input-group">
              <label>New Password</label>

              <div className="password-box">
                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Confirm Password</label>

              <div className="password-box">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="show-password"
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

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  background: "#ecfdf5",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Updating..."
                : "CHANGE PASSWORD"}
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: "18px",
            textAlign: "center",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#6b7280",
              fontSize: "14px",
            }}
          >
            ← Back to Login
          </button>
        </div>

        <div className="login-footer">
          Institute Fee Management System
        </div>
      </div>
    </div>
  );
}