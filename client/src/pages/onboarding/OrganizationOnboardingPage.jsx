import "./OrganizationOnboardingPage.css";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Mail, Sparkles } from "lucide-react";
import axios from "../../api/axiosInstance";
import { acceptTeamInvite } from "../../api/teamApi";
import { useAuthContext } from "../../context/AuthContext.jsx";

const INVITE_STORAGE_KEY = "ttm_invite_token";

export default function OrganizationOnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { firebaseUser, refreshOrganizations, logout } = useAuthContext();
  const [orgName, setOrgName] = useState("");
  const [inviteToken, setInviteToken] = useState(searchParams.get("token") || "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const inviteHint = useMemo(() => {
    return inviteToken ? "Invite token detected. Join to continue." : "";
  }, [inviteToken]);

  const isOnboardingRoute = location.pathname.startsWith("/onboarding/organization");

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!firebaseUser) return;
    const name = orgName.trim();
    if (!name) {
      setError("Organization name is required.");
      return;
    }
    setError("");
    setStatus("create");
    try {
      const idToken = await firebaseUser.getIdToken();
      await axios.post(
        "/api/orgs",
        { name },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      await refreshOrganizations(idToken);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Unable to create organization.");
    } finally {
      setStatus("");
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    if (!firebaseUser) return;
    const token = inviteToken.trim();
    if (!token) {
      setError("Invite token is required.");
      return;
    }
    setError("");
    setStatus("join");
    try {
      const idToken = await firebaseUser.getIdToken();
      await acceptTeamInvite({ token: idToken, inviteToken: token });
      localStorage.removeItem(INVITE_STORAGE_KEY);
      await refreshOrganizations(idToken);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      setError(apiMessage || "Invite acceptance failed.");
    } finally {
      setStatus("");
    }
  };

  return (
    <div className="org-onboarding">
      <div className="org-onboarding__card">
        <div className="org-onboarding__header">
          <div className="org-onboarding__badge">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="org-onboarding__eyebrow">Welcome</p>
            <h1>Set up your workspace</h1>
            <p className="org-onboarding__subtitle">
              Create an organization or join an existing one to continue.
            </p>
          </div>
          <div className="org-onboarding__actions">
            {isOnboardingRoute ? (
              <button type="button" className="org-onboarding__link" onClick={logout}>
                Log out
              </button>
            ) : (
              <button type="button" className="org-onboarding__link" onClick={() => navigate("/dashboard")}>
                Back to dashboard
              </button>
            )}
          </div>
        </div>

        {error && <div className="org-onboarding__error">{error}</div>}

        <div className="org-onboarding__grid">
          <form className="org-onboarding__panel" onSubmit={handleCreate}>
            <div className="org-onboarding__panel-header">
              <div className="org-onboarding__icon">
                <Building2 size={18} />
              </div>
              <div>
                <h2>Create an organization</h2>
                <p>Start fresh and invite your team later.</p>
              </div>
            </div>

            <label className="org-onboarding__label">
              Organization name
              <input
                type="text"
                value={orgName}
                onChange={(event) => setOrgName(event.target.value)}
                placeholder="e.g. Superboard Studio"
              />
            </label>

            <button
              type="submit"
              className="org-onboarding__primary"
              disabled={status === "create"}
            >
              {status === "create" ? "Creating..." : "Create organization"}
            </button>
          </form>

          <form className="org-onboarding__panel" onSubmit={handleJoin}>
            <div className="org-onboarding__panel-header">
              <div className="org-onboarding__icon">
                <Mail size={18} />
              </div>
              <div>
                <h2>Join with invite</h2>
                <p>Have a token? Paste it to join the workspace.</p>
              </div>
            </div>

            <label className="org-onboarding__label">
              Invite token
              <input
                type="text"
                value={inviteToken}
                onChange={(event) => setInviteToken(event.target.value)}
                placeholder="Paste invite token"
              />
            </label>
            {inviteHint && <p className="org-onboarding__hint">{inviteHint}</p>}

            <button
              type="submit"
              className="org-onboarding__secondary"
              disabled={status === "join"}
            >
              {status === "join" ? "Joining..." : "Join organization"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
