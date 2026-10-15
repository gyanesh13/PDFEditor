
import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Moon,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import "./Header.css";

type ToolLink = {
  label: string;
  path: string;
};

type ToolMenu = {
  title: string;
  links: ToolLink[];
};

const menus: ToolMenu[] = [
  {
    title: "Convert",
    links: [
      { label: "PDF to Word", path: "/pdf-to-word" },
      { label: "PDF to Excel", path: "/pdf-to-excel" },
      { label: "PDF to PPT", path: "/pdf-to-ppt" },
      { label: "PDF to JPG", path: "/pdf-to-jpg" },
      { label: "JPG to PDF", path: "/jpg-to-pdf" },
    ],
  },
  {
    title: "Organize",
    links: [
      { label: "Merge PDF", path: "/merge-pdf" },
      { label: "Split PDF", path: "/split-pdf" },
      { label: "Compress PDF", path: "/compress-pdf" },
      { label: "Rotate PDF", path: "/rotate-pdf" },
      { label: "Delete Pages", path: "/delete-pages" },
      { label: "Rearrange Pages", path: "/rearrange-pdf" },
    ],
  },
  {
    title: "Edit",
    links: [
      { label: "Edit PDF", path: "/edit-pdf" },
      { label: "Add Text", path: "/edit-pdf" },
      { label: "Add Image", path: "/edit-pdf" },
      { label: "Highlight PDF", path: "/edit-pdf" },
    ],
  },
  {
    title: "Security",
    links: [
      { label: "Protect PDF", path: "/protect-pdf" },
      { label: "Unlock PDF", path: "/unlock-pdf" },
      { label: "Sign PDF", path: "/sign-pdf" },
      { label: "Watermark", path: "/watermark-pdf" },
    ],
  },
  {
    title: "AI Tools",
    links: [
      { label: "OCR PDF", path: "/ocr-pdf" },
      { label: "Summarize PDF", path: "/summarize-pdf" },
      { label: "Chat with PDF", path: "/chat-with-pdf" },
      { label: "Extract Tables", path: "/extract-tables" },
    ],
  },
  {
    title: "More Tools",
    links: [
      { label: "Extract Pages", path: "/extract-pages" },
      { label: "Crop PDF", path: "/crop-pdf" },
      { label: "Compare PDFs", path: "/compare-pdf" },
      { label: "Fill Forms", path: "/fill-pdf" },
      { label: "PNG to PDF", path: "/png-to-pdf" },
    ],
  },
  {
  title: "Photo Tools",
  links: [
    {
      label: "Passport Size Photo Maker",
      path: "/passport-photo",
    },
  ],
},
];

export default function Header() {
  const { user, loading, signOut } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  const headerRef = useRef<HTMLElement>(null);

  // Close dropdowns when route changes
  useEffect(() => {
    setOpenMenu(null);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Close menus on outside click / Escape
  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      if (
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  const displayName =
    typeof user?.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : user?.email?.split("@")[0] || "User";

  const toggleMenu = (menuTitle: string) => {
    setOpenMenu((current) =>
      current === menuTitle ? null : menuTitle
    );

    setProfileOpen(false);
  };

  const closeMenus = () => {
    setOpenMenu(null);
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setLogoutError("");

    try {
      await signOut();
      closeMenus();
      navigate("/");
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Could not log out."
      );
    } finally {
      setLoggingOut(false);
    }
  };

  // Supabase authentication controls
  const authControls = loading ? (
    <span className="auth-loading">
      Loading...
    </span>
  ) : user ? (
    <div className="header-account">
      <button
        type="button"
        className="header-account-trigger"
        aria-expanded={profileOpen}
        aria-haspopup="menu"
        onClick={() => {
          setProfileOpen((previous) => !previous);
          setOpenMenu(null);
        }}
      >
        <span className="header-account-avatar">
          {displayName.charAt(0).toUpperCase()}
        </span>

        <span className="header-account-name">
          {displayName}
        </span>

        <ChevronDown size={16} />
      </button>

      {profileOpen && (
        <div
          className="header-account-menu"
          role="menu"
        >
          <div className="header-account-email">
            <strong>{displayName}</strong>
            <span>{user.email}</span>
          </div>

          <button
            type="button"
            className="header-account-logout"
            disabled={loggingOut}
            onClick={() => void handleLogout()}
            role="menuitem"
          >
            <LogOut size={16} />
            {loggingOut
              ? "Logging out..."
              : "Log Out"}
          </button>

          {logoutError && (
            <p role="alert">{logoutError}</p>
          )}
        </div>
      )}
    </div>
  ) : (
    <>
      <Link
        to="/login"
        className="login-button"
        onClick={closeMenus}
      >
        Login
      </Link>

      <Link
        to="/signup"
        className="signup-button"
        onClick={closeMenus}
      >
        Sign Up
      </Link>
    </>
  );

  return (
    <header
      className="header"
      ref={headerRef}
    >
      <div className="container nav">
        {/* Logo */}
        <Link
          to="/"
          className="logo"
          aria-label="PDFEditor Home"
          onClick={closeMenus}
        >
          <div className="logo-icon">
            <FileText
              size={22}
              strokeWidth={2.5}
            />
            <span>PDF</span>
          </div>

          <span className="logo-text">
            PDFEditor
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="desktop-nav"
          aria-label="PDF Tools Navigation"
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
            onClick={closeMenus}
          >
            Home
          </NavLink>

          {menus.map((menu) => (
            <div
              className="header-nav-group"
              key={menu.title}
            >
              <button
                type="button"
                className={`nav-dropdown ${
                  openMenu === menu.title
                    ? "is-open"
                    : ""
                }`}
                aria-expanded={
                  openMenu === menu.title
                }
                aria-haspopup="true"
                onClick={() =>
                  toggleMenu(menu.title)
                }
              >
                {menu.title}

                <ChevronDown size={14} />
              </button>

              {/* Dropdown content */}
              {openMenu === menu.title && (
                <div className="header-tools-menu">
                  <div className="header-tools-menu-title">
                    {menu.title} PDF
                  </div>

                  {menu.links.map((tool) => (
                    <Link
                      to={tool.path}
                      key={`${menu.title}-${tool.label}`}
                      onClick={closeMenus}
                    >
                      <FileText size={16} />
                      <span>{tool.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Header actions */}
        <div className="nav-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Dark mode coming soon"
            title="Dark mode (coming soon)"
            disabled
          >
            <Moon size={18} />
          </button>

          <div className="header-desktop-auth">
            {authControls}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="header-mobile-toggle"
            aria-label={
              mobileOpen
                ? "Close menu"
                : "Open menu"
            }
            aria-expanded={mobileOpen}
            onClick={() =>
              setMobileOpen((previous) => !previous)
            }
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <nav
          className="header-mobile-nav"
          aria-label="Mobile PDF Tools Navigation"
        >
          <Link
            to="/"
            onClick={closeMenus}
          >
            Home
          </Link>

          {menus.map((menu) => (
            <div
              className="header-mobile-group"
              key={menu.title}
            >
              <button
                type="button"
                aria-expanded={
                  openMenu === menu.title
                }
                onClick={() =>
                  toggleMenu(menu.title)
                }
              >
                {menu.title}

                <ChevronDown size={16} />
              </button>

              {openMenu === menu.title && (
                <div className="header-mobile-links">
                  {menu.links.map((tool) => (
                    <Link
                      key={`${menu.title}-${tool.label}`}
                      to={tool.path}
                      onClick={closeMenus}
                    >
                      {tool.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="header-mobile-auth">
            {authControls}
          </div>
        </nav>
      )}
    </header>
  );
}
