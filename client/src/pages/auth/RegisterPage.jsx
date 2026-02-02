import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../../components/Layout/AuthLayout.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";
import {
  auth,
  googleProvider,
  githubProvider,
  facebookProvider,
  twitterProvider,
} from "../../api/firebase";
import { signInWithRedirect, createUserWithEmailAndPassword, signInWithPopup, getRedirectResult } from "firebase/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { firebaseUser } = useAuthContext();
  const pendingOAuthRef = useRef(false);
  const redirectFlag = "ttm_oauth_redirect";
  const [form, setForm] = useState({ email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const socialIcons = {
    google: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg",
    github: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg",
    facebook: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg",
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
    if (firebaseUser) {
      if (sessionStorage.getItem(redirectFlag)) {
        sessionStorage.removeItem(redirectFlag);
        navigate("/oauth/success");
      } else if (!pendingOAuthRef.current) {
        navigate("/dashboard");
      }
    }
  }, [firebaseUser, navigate]);

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
      setLoading(true);
      pendingOAuthRef.current = true;
      await createUserWithEmailAndPassword(auth, form.email, form.password);
      navigate("/oauth/success");
    } catch (err) {
      pendingOAuthRef.current = false;
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    setError("");
    try {
      setLoading(true);
      pendingOAuthRef.current = true;

      // Detect mobile to prefer redirect (fixes Safari popup issues)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        sessionStorage.setItem(redirectFlag, "1");
        await signInWithRedirect(auth, provider);
        return;
      }

      // Use popup for all environments to avoid browser redirect/state-loss issues
      await signInWithPopup(auth, provider);
      navigate("/oauth/success");
    } catch (err) {
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/popup-closed-by-user") {
        try {
          sessionStorage.setItem(redirectFlag, "1");
          await signInWithRedirect(auth, provider);
          return;
        } catch (redirectErr) {
          pendingOAuthRef.current = false;
          sessionStorage.removeItem(redirectFlag);
          setError(redirectErr.message || "Social signup failed");
          return;
        }
      }
      pendingOAuthRef.current = false;
      sessionStorage.removeItem(redirectFlag);
      setError(err.message || "Social signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account">
      <form className="auth-actions" onSubmit={handleSubmit}>
        {error && <div className="error-text">{error}</div>}
        <div className="input-field">
          <label>Email</label>
          <input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
        </div>
        <div className="input-field">
          <label>Password</label>
          <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
        </div>
        <div className="input-field">
          <label>Confirm password</label>
          <input name="confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
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
        <div className="auth-footnote" style={{ position: "relative", zIndex: 10 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
