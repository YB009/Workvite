import { useEffect, useRef, useState } from "react";
import { signInWithRedirect, signInWithEmailAndPassword, signInWithPopup, getRedirectResult } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/Layout/AuthLayout.jsx";
import {
  auth,
  googleProvider,
  githubProvider,
  facebookProvider,
  twitterProvider,
} from "../../api/firebase";
import { useAuthContext } from "../../context/AuthContext.jsx";

const socialIcons = {
  google: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg",
  github: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
  facebook: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg",
  twitter: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/twitter/twitter-original.svg",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { firebaseUser } = useAuthContext();
  const pendingOAuthRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const redirectFlag = "ttm_oauth_redirect";

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect login error:", err);
      setError(err.message || "Login failed");
      sessionStorage.removeItem(redirectFlag);
    });
  }, []);

  useEffect(() => {
    if (firebaseUser && sessionStorage.getItem(redirectFlag)) {
      sessionStorage.removeItem(redirectFlag);
      navigate("/oauth/success", { replace: true });
      return;
    }
    if (firebaseUser && !pendingOAuthRef.current) {
      navigate("/dashboard", { replace: true });
    }
  }, [firebaseUser, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setLoading(true);
      pendingOAuthRef.current = true;
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/oauth/success");
    } catch (err) {
      pendingOAuthRef.current = false;
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    setError("");
    try {
      setLoading(true);
      pendingOAuthRef.current = true;
      const isLocalhost = window.location.hostname === "localhost";
      if (isLocalhost) {
        await signInWithPopup(auth, provider);
        navigate("/oauth/success");
      } else {
        sessionStorage.setItem(redirectFlag, "1");
        await signInWithRedirect(auth, provider);
      }
    } catch (err) {
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/popup-closed-by-user") {
        try {
          sessionStorage.setItem(redirectFlag, "1");
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          pendingOAuthRef.current = false;
          sessionStorage.removeItem(redirectFlag);
          setError(redirectErr.message || "Social login failed");
          return;
        }
      }
      pendingOAuthRef.current = false;
      sessionStorage.removeItem(redirectFlag);
      setError(err.message || "Social login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back">
      <form className="auth-actions" onSubmit={handleEmailLogin}>
        {error && <div className="error-text">{error}</div>}
        <div className="input-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="input-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <div className="social-grid">
          <button type="button" className="btn-ghost social-btn" disabled={loading} onClick={() => handleSocial(googleProvider)}>
            <span className="social-icon"><img src={socialIcons.google} alt="Google" /></span>
            <span>Continue with Google</span>
          </button>
          <button type="button" className="btn-ghost social-btn" disabled={loading} onClick={() => handleSocial(githubProvider)}>
            <span className="social-icon"><img src={socialIcons.github} alt="GitHub" /></span>
            <span>Continue with GitHub</span>
          </button>
          <button type="button" className="btn-ghost social-btn" disabled={loading} onClick={() => handleSocial(facebookProvider)}>
            <span className="social-icon"><img src={socialIcons.facebook} alt="Facebook" /></span>
            <span>Continue with Facebook</span>
          </button>
          <button type="button" className="btn-ghost social-btn" disabled={loading} onClick={() => handleSocial(twitterProvider)}>
            <span className="social-icon"><img src={socialIcons.twitter} alt="Twitter" /></span>
            <span>Continue with Twitter</span>
          </button>
        </div>
        <div className="