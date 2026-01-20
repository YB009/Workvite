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

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Project", icon: FolderKanban },
  { to: "/tasks", label: "My Task", icon: CheckSquare },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/team", label: "Team", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const { activeOrganization } = useAuthContext();

  const orgName = activeOrganization?.name || "Workspace";
  const orgRole = activeOrganization?.role || "";
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
      <div className="sidebar__workspace">
        <p className="sidebar__workspace-label">Workspace</p>
        <div className="sidebar__workspace-chip">
          <span className="dot" />
          <div className="workspace-text">
            <span className="workspace-name">{orgName}</span>
            {orgRole && <span className="workspace-role">{orgRole}</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
