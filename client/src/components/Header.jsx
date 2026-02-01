import { useEffect, useRef, useState } from "react";
import { Bell, Settings, LogOut, User, ChevronDown } from "lucide-react";
import "./Header.css";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import workviteIcon from "../assets/workvite-icon.svg";
import workviteLogo from "../assets/workvite-logo.svg";

export default function Header() {
  const { logout, firebaseUser, user, organizations, activeOrganization, setActiveOrganization } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const menuRef = useRef(null);
  const orgRef = useRef(null);

  const displayName =
    user?.name ||
    firebaseUser?.displayName ||
    user?.email ||
    firebaseUser?.email ||
    "User";

  const avatarSrc = firebaseUser?.photoURL || "https://i.pravatar.cc/100?img=32";

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (orgRef.current && !orgRef.current.contains(e.target)) {
        setOrgOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOrgOpen(false);
  }, [location]);

  const handleBell = () => navigate("/activity");
  const handleSettings = () => navigate("/settings");
  const handleOrgChange = (orgId) => {
    setActiveOrganization(orgId);
    setOrgOpen(false);
  };

  return (
    <header className="header-root">
      <div className="header-brand">
        <div className="header-logo-icon">
          <img src={workviteIcon} alt="Workvite" />
        </div>
        <div className="org-switch org-switch--hero" ref={orgRef}>
          <button className="org-switch__button org-switch__button--hero" onClick={() => setOrgOpen((p) => !p)}>
            <span className="org-switch__label-text">Workspace</span>
            <span className="org-switch__name-row">
              <ChevronDown size={16} />
              <span>{activeOrganization?.name || "Organization"}</span>
            </span>
          </button>
          {orgOpen && (
            <div className="org-switch__menu">
              <div className="org-switch__label">Organizations</div>
              {(organizations || []).map((org) => (
                <button
                  key={org.id}
                  className={`org-switch__item ${org.id === activeOrganization?.id ? "is-active" : ""}`}
                  onClick={() => handleOrgChange(org.id)}
                >
                  <span>{org.name}</span>
                  {org.role && <span className="org-switch__role">{org.role}</span>}
                </button>
              ))}
              <div className="org-switch__divider" />
              <button className="org-switch__item" onClick={() => navigate("/organizations")}>
                + Create or join
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="header-logo">
        <img src={workviteLogo} alt="Workvite" />
      </div>

      <div className="header-actions">
        <button className="icon-btn" onClick={handleBell} aria-label="Notifications">
          <Bell size={18} />
          <span className="badge-dot" />
        </button>
        <button className="icon-btn" onClick={handleSettings} aria-label="Settings">
          <Settings size={18} />
        </button>
        <div
          className="profile-chip"
          ref={menuRef}
          onClick={() => setMenuOpen((p) => !p)}
        >
          <img src={avatarSrc} alt="avatar" />
          <div className="profile-text">
            <span className="profile-name">{displayName}</span>
            {user?.email && <span className="profile-email">{user.email}</span>}
          </div>
          {menuOpen && (
            <div className="profile-menu">
              <div className="profile-menu__section">My Account</div>
              <button className="profile-menu__item" onClick={() => navigate("/settings")}>
                <User size={16} />
                <span>Profile</span>
              </button>
              <button className="profile-menu__item" onClick={handleSettings}>
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <div className="profile-menu__divider" />
              <button className="profile-menu__item" onClick={logout}>
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
