import "./TeamPage.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../api/axiosInstance";
import { useAuthContext } from "../../context/AuthContext.jsx";
import MembersTable from "./MembersTable.jsx";
import InviteModal from "./InviteModal.jsx";
import ProjectAccessModal from "./ProjectAccessModal.jsx";
import { useProfile } from "../../context/ProfileContext.jsx";
import {
  deactivateTeamMember,
  cancelTeamInvite,
  fetchTeamMembers,
  inviteTeamMember,
  resendTeamInvite,
  updateTeamProjectAccess,
  updateTeamRole
} from "../../api/teamApi.js";

const initialsFrom = (name = "", email = "") => {
  const source = name || email || "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const normalizeMember = (member, currentUserId) => {
  const projectIds = member.projectIds || [];
  return {
    ...member,
    initials: initialsFrom(member.name, member.email),
    isSelf: member.userId === currentUserId,
    isInvite: Boolean(member.isInvite),
    projectIds,
    projectCount: member.projectCount ?? projectIds.length
  };
};

export default function TeamPage() {
  const { firebaseUser, user, activeOrganization } = useAuthContext();
  const { openProfile } = useProfile();
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [activeMember, setActiveMember] = useState(null);

  const currentRole = useMemo(() => {
    if (!user) return "MEMBER";
    const match = members.find((m) => m.userId === user.id);
    return match?.role || "MEMBER";
  }, [members, user]);

  const loadOrgAndProjects = useCallback(async () => {
    if (!firebaseUser) return;
    const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
    if (!activeOrganization) {
      setProjects([]);
      return { org: null };
    }

    const projectRes = await axios.get(`/api/projects/org/${activeOrganization.id}`, { headers });
    const projectList = projectRes.data || [];
    setProjects(projectList);

    return { org: activeOrganization };
  }, [firebaseUser, activeOrganization]);

  const loadMembers = useCallback(async () => {
    if (!firebaseUser) return;
    setLoading(true);
    setError("");
    try {
      const { org: activeOrg } = await loadOrgAndProjects();
      if (!activeOrg) {
        setMembers([]);
        return;
      }
      const token = await firebaseUser.getIdToken();
      const data = await fetchTeamMembers({ token, orgId: activeOrg.id });
      const list = (data?.items || data || []).map((member) =>
        normalizeMember(member, user?.id)
      );
      setMembers(list);
    } catch (err) {
      console.error(err);
      setError("Couldn't load team members. Try again.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, loadOrgAndProjects, user?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleInvite = async ({ email, role }) => {
    if (!firebaseUser || !activeOrganization) throw new Error("Missing organization context.");
    try {
      const token = await firebaseUser.getIdToken();
      const data = await inviteTeamMember({ token, orgId: activeOrganization.id, email, role });
      await loadMembers();
      setToast(`Invite sent to ${email}`);
      return data;
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Invite failed. Try again.");
      throw err;
    }
  };

  const handleDeactivate = async (member) => {
    if (!firebaseUser) return;
    try {
      const token = await firebaseUser.getIdToken();
      await deactivateTeamMember({ token, memberId: member.id });
      await loadMembers();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Deactivation failed. Try again.");
    }
  };

  const handleRoleChange = async (member) => {
    if (!firebaseUser) return;
    try {
      const nextRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
      const token = await firebaseUser.getIdToken();
      await updateTeamRole({ token, memberId: member.id, role: nextRole });
      await loadMembers();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Role update failed. Try again.");
    }
  };

  const handleManageProjects = (member) => {
    setActiveMember(member);
    setProjectModalOpen(true);
  };

  const handleSaveProjectAccess = async (member, projectIds) => {
    if (!firebaseUser || !member?.id) return;
    try {
      const token = await firebaseUser.getIdToken();
      await updateTeamProjectAccess({ token, memberId: member.id, projectIds });
      await loadMembers();
      setToast("Project access updated");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to update project access.");
    }
  };

  const handleInviteResend = async (member) => {
    if (!firebaseUser || !member?.id) return;
    try {
      const token = await firebaseUser.getIdToken();
      const data = await resendTeamInvite({ token, inviteId: member.id });
      await loadMembers();
      if (data?.inviteLink) {
        await navigator.clipboard.writeText(data.inviteLink);
        setToast("Invite link copied");
      } else {
        setToast("Invite resent");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Resend failed. Try again.");
    }
  };

  const handleInviteCopy = async (member) => {
    if (!member?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(member.inviteLink);
      setToast("Invite link copied");
    } catch (err) {
      console.error(err);
      setError("Couldn't copy invite link.");
    }
  };

  const handleInviteCancel = async (member) => {
    if (!firebaseUser || !member?.id) return;
    try {
      const token = await firebaseUser.getIdToken();
      await cancelTeamInvite({ token, inviteId: member.id });
      await loadMembers();
      setToast("Invite cancelled");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Cancel failed. Try again.");
    }
  };

  const handleOpenProfile = (member) => {
    if (!member) return;
    if (member.isInvite) {
      openProfile(null, "readonly", {
        name: member.name || "",
        email: member.email,
        role: member.role,
        status: member.status || "INVITED"
      });
      return;
    }
    if (member.userId) {
      openProfile(member.userId, member.isSelf ? "self" : "readonly");
    }
  };

  const canInvite = ["OWNER", "ADMIN"].includes(currentRole);

  return (
    <div className="page-stack team-page">
      <div className="toolbar team-page__toolbar">
        <div>
          <h1>Team</h1>
          <p className="muted">People, roles, and access for your workspace.</p>
        </div>
        <button
          className="btn-primary"
          type="button"
          onClick={() => setInviteOpen(true)}
          disabled={!canInvite}
        >
          Invite member
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {toast && <div className="toast-banner">{toast}</div>}

      <div className="content-surface">
        {loading && (
          <div className="team-loading">
            <div className="spinner" />
            <p className="muted">Loading team...</p>
          </div>
        )}

        {!loading && !activeOrganization && (
          <div className="team-empty">
            <h3>No organization yet</h3>
            <p className="muted">Create an organization to manage team access.</p>
          </div>
        )}

        {!loading && activeOrganization && (
          <MembersTable
            members={members}
            currentRole={currentRole}
            onOpenProfile={handleOpenProfile}
            onInviteResend={handleInviteResend}
            onInviteCopy={handleInviteCopy}
            onInviteCancel={handleInviteCancel}
            onDeactivate={handleDeactivate}
            onChangeRole={handleRoleChange}
            onManageProjects={handleManageProjects}
          />
        )}
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
      />

      <ProjectAccessModal
        open={projectModalOpen}
        member={activeMember}
        projects={projects}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProjectAccess}
      />
    </div>
  );
}
