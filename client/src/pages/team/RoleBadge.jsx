import "./TeamPage.css";

const roleStyles = {
  OWNER: "role-badge owner",
  ADMIN: "role-badge admin",
  MEMBER: "role-badge member"
};

export default function RoleBadge({ role }) {
  const label = role || "MEMBER";
  const className = roleStyles[label] || roleStyles.MEMBER;
  return <span className={className}>{label}</span>;
}
