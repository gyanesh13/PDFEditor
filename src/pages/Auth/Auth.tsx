
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    FileText,
    LoaderCircle,
    LockKeyhole,
    Mail,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import "./Auth.css";

export default function Auth() {
    const location = useLocation();
    const navigate = useNavigate();

    const isSignup = location.pathname === "/signup";

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);

    const clearMessages = () => {
        setError("");
        setSuccess("");
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (loading) return;

        clearMessages();

        if (isSignup) {
            if (!fullName.trim()) {
                setError("Please enter your full name.");
                return;
            }

            if (password.length < 8) {
                setError("Password must be at least 8 characters.");
                return;
            }

            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
            }
        }

        setLoading(true);

        try {
            if (isSignup) {
                const { data, error: signUpError } =
                    await supabase.auth.signUp({
                        email: email.trim(),
                        password,
                        options: {
                            data: {
                                full_name: fullName.trim(),
                            },
                            emailRedirectTo: `${window.location.origin}/`,
                        },
                    });

                if (signUpError) throw signUpError;

                if (data.session) {
                    navigate("/", { replace: true });
                } else {
                    setSuccess(
                        "Sign-up request received. If email verification is enabled, check your inbox to confirm your account."
                    );
                }
            } else {
                const { error: loginError } =
                    await supabase.auth.signInWithPassword({
                        email: email.trim(),
                        password,
                    });

                if (loginError) throw loginError;

                navigate("/", { replace: true });
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleLogin = async () => {
        if (googleLoading) return;

        setGoogleLoading(true);
        setError("");
        setSuccess("");

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin + "/",
                    queryParams: {
                        prompt: "select_account",
                    },
                },
            });

            if (error) throw error;
            // Supabase redirects the browser to Google.
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Google login failed. Please try again."
            );
            setGoogleLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-brand-panel">
                <Link to="/" className="auth-brand-logo">
                    <span className="auth-brand-icon">
                        <FileText size={25} />
                    </span>
                    <span>PDFEditor</span>
                </Link>

                <div className="auth-brand-content">
                    <div className="auth-brand-label">
                        <ShieldCheck size={16} />
                        Your PDF Workspace
                    </div>

                    <h1>
                        Everything you need to work with PDFs.
                    </h1>

                    <p>
                        Merge, split, compress and convert your
                        documents with powerful, easy-to-use tools.
                    </p>

                    <div className="auth-brand-feature">
                        <span className="auth-feature-check">✓</span>
                        Powerful document conversion tools
                    </div>

                    <div className="auth-brand-feature">
                        <span className="auth-feature-check">✓</span>
                        Easy-to-use PDF editing experience
                    </div>

                    <div className="auth-brand-feature">
                        <span className="auth-feature-check">✓</span>
                        Your personal account and workspace
                    </div>
                </div>

                <p className="auth-brand-footer">
                    © {new Date().getFullYear()} PDFEditor.
                    All rights reserved.
                </p>
            </section>

            <section className="auth-form-panel">
                <div className="auth-form-container">
                    <Link to="/" className="auth-back-link">
                        <ArrowLeft size={17} />
                        Back to home
                    </Link>

                    <div className="auth-mobile-logo">
                        <FileText size={26} />
                        <strong>PDFEditor</strong>
                    </div>

                    <div className="auth-form-heading">
                        <h2>
                            {isSignup
                                ? "Create an account"
                                : "Welcome back"}
                        </h2>

                        <p>
                            {isSignup
                                ? "Sign up to get started with PDFEditor."
                                : "Enter your credentials to sign in."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {isSignup && (
                            <div className="auth-field">
                                <label htmlFor="auth-name">
                                    Full Name
                                </label>

                                <div className="auth-input">
                                    <UserRound size={19} />

                                    <input
                                        id="auth-name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        autoComplete="name"
                                        value={fullName}
                                        onChange={(e) =>
                                            setFullName(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="auth-field">
                            <label htmlFor="auth-email">
                                Email Address
                            </label>

                            <div className="auth-input">
                                <Mail size={19} />

                                <input
                                    id="auth-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="auth-password">
                                Password
                            </label>

                            <div className="auth-input">
                                <LockKeyhole size={19} />

                                <input
                                    id="auth-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    autoComplete={
                                        isSignup
                                            ? "new-password"
                                            : "current-password"
                                    }
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    minLength={isSignup ? 8 : undefined}
                                    required
                                />

                                <button
                                    type="button"
                                    className="auth-password-toggle"
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {isSignup && (
                            <div className="auth-field">
                                <label htmlFor="auth-confirm">
                                    Confirm Password
                                </label>

                                <div className="auth-input">
                                    <LockKeyhole size={19} />

                                    <input
                                        id="auth-confirm"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Confirm your password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) =>
                                            setConfirmPassword(e.target.value)
                                        }
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="auth-password-toggle"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (prev) => !prev
                                            )
                                        }
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide confirmation password"
                                                : "Show confirmation password"
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div
                                className="auth-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        {success && (
                            <div
                                className="auth-success"
                                role="status"
                            >
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <LoaderCircle
                                        size={19}
                                        className="auth-spinner"
                                    />
                                    Please wait...
                                </>
                            ) : isSignup ? (
                                "Create Account"
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="auth-google-section">
                        <div className="auth-google-divider">
                            <span />
                            <p>OR</p>
                            <span />
                        </div>

                        <button
                            type="button"
                            className="auth-google-button"
                            onClick={handleGoogleLogin}
                            disabled={loading || googleLoading}
                        >
                            {googleLoading ? (
                                <LoaderCircle
                                    size={19}
                                    className="auth-spinner"
                                />
                            ) : (
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        fill="#EA4335"
                                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                    />
                                    <path
                                        fill="#4285F4"
                                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.88 46.98 24.55z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.51 2.56 10.78l7.97-6.19z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6C30.03 37.65 27.25 38.5 24 38.5c-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                    />
                                </svg>
                            )}

                            {googleLoading
                                ? "Connecting to Google..."
                                : "Continue with Google"}
                        </button>
                    </div>


                    <div className="auth-divider">
                        <span />
                        <p>
                            {isSignup
                                ? "Already have an account?"
                                : "New to PDFEditor?"}
                        </p>
                        <span />
                    </div>

                    <Link
                        to={isSignup ? "/login" : "/signup"}
                        className="auth-switch-button"
                        onClick={clearMessages}
                    >
                        {isSignup
                            ? "Sign In Instead"
                            : "Create a Free Account"}
                    </Link>

                    <p className="auth-terms">
                        By continuing, you agree to our Terms of
                        Service and Privacy Policy.
                    </p>
                </div>
            </section>
        </main>
    );
}
