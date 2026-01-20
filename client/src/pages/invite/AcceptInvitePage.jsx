import "./AcceptInvitePage.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { acceptTeamInvite } from "../../api/teamApi.js";

const STORAGE_KEY = "ttm_invite_token";

export default function AcceptInvitePage() {
  const { firebaseUser, refreshOrganizations } = useAuthContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const inviteToken = useMemo(() => searchParams.get("token") || "", [searchParams]);

  useEffect(() => {
    if (inviteToken) {
      localStorage.setItem(STORAGE_KEY, inviteToken);
    }
  }, [inviteToken]);

  useEffect(() => {
    const acceptInvite = async () => {
      if (!firebaseUser) return;
      const token = inviteToken || localStorage.getItem(STORAGE_KEY);
      if (!token) {
        setStatus("error");
        setMessage("Invite token is missing.");
        return;
      }
      setStatus("loading");
      try {
        const authToken = await firebaseUser.getIdToken();
        await acceptTeamInvite({ token: authToken, inviteToken: token });
        localStorage.removeItem(STORAGE_KEY);
        await refreshOrganizations(authToken);
        setStatus("success");
        setMessage("Invite accepted. You're in!");
      } catch (err) {
        const apiMessage = err?.response?.data?.message;
        setStatus("error");
        setMessage(apiMessage || "Invite acceptance failed.");
      }
    };

    acceptInvite();
  }, [firebaseUser, inviteToken]);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="invite-page">
      <div className="invite-card">
        <h1>Accept invite</h1>
        {!firebaseUser && (
          <p className="muted">
            Sign in to accept this invite. We will match it to your email address.
          </p>
        )}
        {status === "loading" && <p className="muted">Accepting invite...</p>}
        {status === "success" && <p className="success">{message}</p>}
        {status === "error" && <p className="error">{message}</p>}
        {!firebaseUser && (
          <button className="btn-primary" type="button" onClick={handleLogin}>
            Sign in
          </button>
        )}
        {firebaseUser && status === "success" && (
          <button className="btn-primary" type="button" onClick={handleDashboard}>
            Go to dashboard
          </button>
        )}
      </div>
    </div>
  );
}
