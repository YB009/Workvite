import RoleBadge from "./RoleBadge.jsx";
import "./TeamPage.css";

const statusStyles = {
  ACTIVE: "status-badge active",
  INVITED: "status-badge invited",
  DEACTIVATED: "status-badge deactivated"
};

const statusLabel = (status) => status || "ACTIVE";

export default function MembersTable({
  members,
  currentRole,
  onOpenProfile,
  onInviteResend,
  onInviteCopy,
  onInviteCancel,
  onDeactivate,
  onChangeRole,
  onManageProjects
}) {
  const canManage = ["OWNER", "ADMIN"].includes(currentRole);
  const canChangeRole = ["OWNER", "ADMIN"].includes(currentRole);

  if (!members.length) {
    return (
      <div className="team-empty">
        <h3>No team members yet</h3>
        <p className="muted">Invite teammates to collaborate on projects.</p>
      </div>
    );
  }

  return (
    <div className="team-table">
      <div className="team-table__header">
        <span>Member</span>
        <span>Role</span>
        <span>Status</span>
        <span>Projects</span>
        <span>Actions</span>
      </div>
      {members.map((member) => {
        const status = statusLabel(member.status);
        const isSelf = member.isSelf;
        const isOwner = member.role === "OWNER";
        const isInvite = member.isInvite;
        const canDeactivate = (() => {
          if (!canManage || isSelf || isInvite) return false;
          if (member.role === "OWNER") return false;
          if (currentRole === "ADMIN" && member.role !== "MEMBER") return false;
          return true;
        })();
        const canResend = status === "INVITED" && canManage;
        const canCopyInvite = status === "INVITED" && Boolean(member.inviteLink);
        const canCancelInvite = status === "INVITED" && canManage;
        const canChange = (() => {
          if (!canChangeRole || isSelf || isInvite) return false;
          if (isOwner) return false;
          if (currentRole === "ADMIN" && member.role === "OWNER") return false;
          return true;
        })();
        const canManageProjects = canManage && !isSelf && !isInvite && !(currentRole === "ADMIN" && isOwner);

        return (
          <div className="team-table__row" key={member.id}>
            <button
              type="button"
              className="member-cell member-button"
              onClick={() => onOpenProfile?.(member)}
            >
              <div className="member-avatar">
                {member.initials}
              </div>
              <div>
                <p className="member-name">{member.name}</p>
                <p className="member-email">{member.email}</p>
              </div>
            </button>
            <RoleBadge role={member.role} />
            <span className={statusStyles[status] || statusStyles.ACTIVE}>
              {status}
            </span>
            <span className="member-projects">{member.projectCount}</span>
            <div className="member-actions">
              {canManageProjects && (
                <button
                  className="btn-ghost btn-small"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onManageProjects(member);
                  }}
                >
                  Projects
                </button>
              )}
              {canChange && (
                <button
                  className="btn-ghost btn-small"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onChangeRole(member);
                  }}
                >
                  Change role
                </button>
              )}
              {canResend && (
                <button
                  className="btn-ghost btn-small"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onInviteResend(member);
                  }}
                >
                  Resend
                </button>
              )}
              {canCopyInvite && (
                <button
                  className="btn-ghost btn-small"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onInviteCopy(member);
                  }}
                >
                  Copy link
                </button>
              )}
              {canCancelInvite && (
                <button
                  className="btn-ghost btn-small danger"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onInviteCancel(member);
                  }}
                >
                  Cancel invite
                </button>
              )}
              {canDeactivate && !isInvite && (
                <button
                  className="btn-ghost btn-small danger"
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onDeactivate(member);
                  }}
                >
                  Deactivate
                </button>
              )}
              {!canManage && <span className="muted small">No actions</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
