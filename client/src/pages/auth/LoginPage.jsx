import { useEffect, useState } from "react";
import { signInWithRedirect, signInWithEmailAndPassword, signInWithPopup, getRedirectResult } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Layout/AuthLayout.jsx";
import {
  auth,
  googleProvider,
  githubProvider,
  twitterProvider,
} from "../../api/firebase";
import { useAuthContext } from "../../context/AuthContext.jsx";

const socialIcons = {
  google: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg",
  github: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
  twitter: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { firebaseUser, loading } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const redirectFlag = "ttm_oauth_redirect";
  const successFlag = "ttm_oauth_success";
  const isInAppBrowser = (() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /Snapchat|FBAN|FBAV|Instagram|Line|Twitter|LinkedIn|Pinterest|Telegram|WhatsApp|Messenger/i.test(ua);
  })();
  const prefersPopup = (() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
    return isIOS && isSafari;
  })();

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect login error:", err);
      setError(err.message || "Login failed");
      sessionStorage.removeItem(redirectFlag);
    });
  }, []);

  useEffect(() => {
    if (loading) return;

    if (firebaseUser && (sessionStorage.getItem(redirectFlag) || sessionStorage.getItem(successFlag))) {
      sessionStorage.removeItem(redirectFlag);
      sessionStorage.removeItem(successFlag);
      navigate("/oauth/success", { replace: true });
      return;
    }
    if (firebaseUser) {
      navigate("/dashboard", { replace: true });
    }
  }, [firebaseUser, loading, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setIsSubmitting(true);
      sessionStorage.setItem(successFlag, "1");
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/oauth/success");
    } catch (err) {
      sessionStorage.removeItem(successFlag);
      setError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocial = async (provider) => {
    setError("");
    try {
      setIsSubmitting(true);
      sessionStorage.setItem(successFlag, "1");
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
        try {
          sessionStorage.setItem(redirectFlag, "1");
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          sessionStorage.removeItem(redirectFlag);
          sessionStorage.removeItem(successFlag);
          setError(redirectErr.message || "Social login failed");
          return;
        }
      }
      sessionStorage.removeItem(redirectFlag);
      sessionStorage.removeItem(successFlag);
      setError(err.message || "Social login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back">
      <form className="auth-actions" onSubmit={handleEmailLogin}>
        {error && <div className="error-text">{error}</div>}
        {isInAppBrowser && (
          <div className="error-text">
            Social sign-in is blocked inside in-app browsers (Snapchat, Instagram, etc.). Please open this site in Safari/Chrome to continue.
          </div>
        )}
        <div className="input-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="input-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
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
        {isInAppBrowser && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              const url = window.location.href;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            Open in browser
          </button>
        )}
        <div className="auth-footnote" style={{ position: "relative", zIndex: 10 }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
