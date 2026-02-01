import "../App.css";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="page-stack">
      <div className="content-surface" style={{ textAlign: "center", padding: "48px 24px" }}>
        <h2 style={{ marginTop: 0 }}>Page not found</h2>
        <p className="muted">The page you were trying to open doesn&apos;t exist.</p>
        <button className="btn-primary" onClick={() => navigate("/dashboard")}>
          Back to dashboard
        </button>
      </div>
    </div>
  );
}
