
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./AuthHeaderActions.css";

export default function AuthHeaderActions() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    try {
      setError("");
      await signOut();
      setOpen(false);
      navigate("/");
    } catch {
      setError("Unable to log out. Please try again.");
    }
  };

  if (loading) {
    return <div className="header-auth-loading" />;
  }

  if (!user) {
    return (
      <div className="header-auth-actions">
        <Link to="/login" className="header-login">
          Log In
        </Link>

        <Link to="/signup" className="header-signup">
          Sign Up
        </Link>
      </div>
    );
  }

  const name =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] || "User";

  return (
    <div className="header-profile">
      <button
        type="button"
        className="header-profile-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="header-avatar">
          {name.charAt(0).toUpperCase()}
        </span>

        <span className="header-profile-name">{name}</span>

        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="header-profile-menu">
          <div className="header-profile-info">
            <UserRound size={17} />
            <span>{user.email}</span>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
          >
            <LogOut size={17} />
            Log Out
          </button>

          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
