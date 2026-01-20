import { useEffect, useRef, useState } from "react";
import { Bell, Settings, Search, LogOut, User, ChevronDown } from "lucide-react";
import "./Header.css";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const { logout, firebaseUser, user, organizations, activeOrganization, setActiveOrganization } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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

  useEffect(() => {
    if (location.pathname !== "/dashboard") return;
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setSearch(q);
  }, [location.pathname, location.search]);

  const handleSearch = (value) => {
    setSearch(value);
    if (location.pathname === "/dashboard") {
      navigate(`/dashboard?q=${encodeURIComponent(value)}`);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleSearch(e.target.value);
  };

  const handleBell = () => navigate("/activity");
  const handleSettings = () => navigate("/settings");
  const handleOrgChange = (orgId) => {
    setActiveOrganization(orgId);
    setOrgOpen(false);
  };

  return (
    <header className="header-root">
      <div className="header-brand">
        <div className="brand-mark">
          <div className="brand-dot" />
        </div>
        <div className="org-switch org-switch--hero" ref={orgRef}>
          <button className="org-switch__button org-switch__button--hero" onClick={() => setOrgOpen((p) => !p)}>
            <span className="org-switch__label-text">Workspace</span>
            <span className="org-switch__name">{activeOrganization?.name || "Organization"}</span>
            <ChevronDown size={16} />
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
              <button className="org-switch__item" onClick={() => navigate("/onboarding/organization")}>
                + Create or join
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`header-search ${showMobileSearch ? "header-search--open" : ""}`}>
        <Search size={16} />
        <input
          type="text"
          placeholder="Search anything..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          className="search-toggle"
          onClick={() => setShowMobileSearch((p) => !p)}
        >
          <Search size={16} />
        </button>
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
