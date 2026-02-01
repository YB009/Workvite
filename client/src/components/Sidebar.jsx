import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Activity,
  Users,
  Settings,
} from "lucide-react";
import "./Sidebar.css";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Project", icon: FolderKanban },
  { to: "/tasks", label: "My Task", icon: CheckSquare },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/team", label: "Team", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { activeOrganization, organizations, setActiveOrganization } = useAuthContext();
  const [orgOpen, setOrgOpen] = useState(false);
  const orgRef = useRef(null);

  const orgName = activeOrganization?.name || "Workspace";
  const orgRole = activeOrganization?.role || "";

  useEffect(() => {
    const handler = (event) => {
      if (orgRef.current && !orgRef.current.contains(event.target)) {
        setOrgOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);
  return (
    <aside className="sidebar">
      <div className="sidebar__top">
        <h2>Dashhboard</h2>
      </div>
      <nav className="sidebar__nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__workspace" ref={orgRef}>
        <p className="sidebar__workspace-label">Workspace</p>
        <button className="sidebar__workspace-chip" type="button" onClick={() => setOrgOpen((p) => !p)}>
          <ChevronDown size={14} />
          <span className="dot" />
          <div className="workspace-text">
            <span className="workspace-name">{orgName}</span>
            {orgRole && <span className="workspace-role">{orgRole}</span>}
          </div>
        </button>
        <select
          className="sidebar__workspace-select"
          value={activeOrganization?.id || ""}
          onChange={(e) => {
            const next = e.target.value;
            if (next === "__create__") {
              window.location.href = "/organizations";
              return;
            }
            setActiveOrganization(next);
          }}
        >
          <option value="" disabled>
            Select organization
          </option>
          {(organizations || []).map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
          <option value="__create__">+ Create or join</option>
        </select>
        {orgOpen && (
          <div className="sidebar__workspace-menu">
            <div className="sidebar__workspace-title">Organizations</div>
            {(organizations || []).map((org) => (
              <button
                key={org.id}
                className={`sidebar__workspace-item ${org.id === activeOrganization?.id ? "is-active" : ""}`}
                type="button"
                onClick={() => {
                  setActiveOrganization(org.id);
                  setOrgOpen(false);
                }}
              >
                <span>{org.name}</span>
                {org.role && <span className="sidebar__workspace-role">{org.role}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
