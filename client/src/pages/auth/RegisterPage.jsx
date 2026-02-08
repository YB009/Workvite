import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../../components/Layout/AuthLayout.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";
import {
  auth,
  googleProvider,
  githubProvider,
  twitterProvider,
} from "../../api/firebase";
import { signInWithRedirect, createUserWithEmailAndPassword, signInWithPopup, getRedirectResult } from "firebase/auth";
import {
  isInAppBrowser,
  shouldAutoRedirectInApp,
  markInAppRedirectAttempted,
  openInExternalBrowser,
} from "../../utils/inAppBrowser.js";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { firebaseUser, loading } = useAuthContext();
  const redirectFlag = "ttm_oauth_redirect";
  const successFlag = "ttm_oauth_success";
  const inAppBrowser = isInAppBrowser();
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const prefersPopup = (() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
    return isIOS && isSafari;
  })();

  const socialIcons = {
    google: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg",
    github: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
    twitter: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg",
  };

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect signup error:", err);
      setError(err.message || "Signup failed");
      sessionStorage.removeItem(redirectFlag);
    });
  }, []);

  useEffect(() => {
    if (!inAppBrowser) return;
    if (!shouldAutoRedirectInApp()) return;
    markInAppRedirectAttempted();
    openInExternalBrowser(window.location.href);
  }, [inAppBrowser]);

  useEffect(() => {
    if (loading) return;

    if (firebaseUser) {
      if (sessionStorage.getItem(redirectFlag) || sessionStorage.getItem(successFlag) || localStorage.getItem(successFlag)) {
        sessionStorage.removeItem(redirectFlag);
        sessionStorage.removeItem(successFlag);
        localStorage.removeItem(successFlag);
        navigate("/oauth/success");
        return;
      }
      navigate("/dashboard");
    }
  }, [firebaseUser, loading, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      setIsSubmitting(true);
      sessionStorage.setItem(successFlag, "1");
      localStorage.setItem(successFlag, "1");
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      navigate("/oauth/success");
    } catch (err) {
      sessionStorage.removeItem(successFlag);
      localStorage.removeItem(successFlag);
      setError(err.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocial = async (provider) => {
    setError("");
    try {
      setIsSubmitting(true);
      sessionStorage.setItem(successFlag, "1");
      localStorage.setItem(successFlag, "1");
      // Prefer popup on iOS Safari (redirect can stall); otherwise use redirect on mobile.
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (prefersPopup) {
        await signInWithPopup(auth, provider);
        navigate("/oauth/success");
        return;
      }
      if (isMobile) {
        sessionStorage.setItem(redirectFlag, "1");
        await signInWithRedirect(auth, provider);
        return;
      }

      await signInWithPopup(auth, provider);
      navigate("/oauth/success");
    } catch (err) {
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/popup-closed-by-user" || err?.code === "auth/operation-not-supported-in-this-environment") {
        if (prefersPopup) {
          sessionStorage.removeItem(successFlag);
          localStorage.removeItem(successFlag);
          setError("Please allow pop-ups in Safari to continue with social sign-up.");
          return;
        }
        try {
          sessionStorage.setItem(redirectFlag, "1");
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          sessionStorage.removeItem(redirectFlag);
          sessionStorage.removeItem(successFlag);
          localStorage.removeItem(successFlag);
          setError(redirectErr.message || "Social signup failed");
          return;
        }
      }
      sessionStorage.removeItem(redirectFlag);
      sessionStorage.removeItem(successFlag);
      localStorage.removeItem(successFlag);
      setError(err.message || "Social signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account">
      <form className="auth-actions" onSubmit={handleSubmit}>
        {error && <div className="error-text">{error}</div>}
        {inAppBrowser && (
          <div className="error-text">
            Opening this page in your browser so sign-up will work.
          </div>
        )}
        <div className="input-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
        </div>
        <div className="input-field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
        </div>
        <div className="input-field">
          <label htmlFor="confirm">Confirm password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={form.confirm} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create account"}
        </button>
        <div className="social-grid">
          <button type="button" className="btn-ghost social-btn" disabled={isSubmitting} onClick={() => handleSocial(googleProvider)}>
            <span className="social-icon"><img src={socialIcons.google} alt="Google" /></span>
            <span>Continue with Google</span>
          </button>
          <button type="button" className="btn-ghost social-btn" disabled={isSubmitting} onClick={() => handleSocial(githubProvider)}>
            <span className="social-icon"><img src={socialIcons.github} alt="GitHub" /></span>
            <span>Continue with GitHub</span>
          </button>
          <button type="button" className="btn-ghost social-btn" disabled={isSubmitting} onClick={() => handleSocial(twitterProvider)}>
            <span className="social-icon"><img src={socialIcons.twitter} alt="Twitter" /></span>
            <span>Continue with Twitter</span>
          </button>
        </div>
        {inAppBrowser && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              openInExternalBrowser(window.location.href);
            }}
          >
            Open in browser
          </button>
        )}
        <div className="auth-footnote" style={{ position: "relative", zIndex: 10 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
