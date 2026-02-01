import "./SettingsPage.css";
import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import axios from "../../api/axiosInstance";
import { useNavigate, useParams } from "react-router-dom";
import { PencilLine, CheckCircle2 } from "lucide-react";
import { useProfile } from "../../context/ProfileContext.jsx";

const isTaskComplete = (status = "") => {
  const normalized = status.toLowerCase();
  return ["done", "completed", "complete", "closed"].includes(normalized);
};

const normalizeProjectStatus = (status = "") => {
  const s = status.toLowerCase();
  if (["completed", "done", "complete"].includes(s)) return "Completed";
  if (["delayed", "at risk", "atrisk"].includes(s)) return "Delayed";
  return "Active";
};

export default function SettingsPage({ profileUserId, readOnly = false, inviteProfile = null }) {
  const { firebaseUser, user, logout, activeOrganization } = useAuthContext();
  const { closeProfile } = useProfile();
  const { userId } = useParams();
  const navigate = useNavigate();
  const effectiveUserId = profileUserId || userId;
  const isSelf = !effectiveUserId || effectiveUserId === user?.id;
  const canEdit = isSelf && !readOnly;

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [orgRoles, setOrgRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    title: "",
    bio: "",
    avatarUrl: ""
  });

  useEffect(() => {
    const load = async () => {
      if (!firebaseUser) return;
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        const org = activeOrganization;

        if (inviteProfile) {
          setProfile({
            user: { id: null, name: "", email: inviteProfile.email, provider: "invite" },
            profile: { title: "", bio: "", avatarUrl: "" },
            organizations: [
              {
                id: org?.id || "org",
                name: org?.name || "Organization",
                role: inviteProfile.role || "MEMBER"
              }
            ],
            invite: inviteProfile
          });
          setOrgRoles([
            {
              id: org?.id || "org",
              name: org?.name || "Organization",
              role: inviteProfile.role || "MEMBER"
            }
          ]);
          setProjects([]);
          setStats(null);
          setForm({
            name: inviteProfile.name || "",
            title: "",
            bio: "",
            avatarUrl: ""
          });
          return;
        }

        if (effectiveUserId && effectiveUserId !== user?.id) {
          if (!org) {
            setError("No workspace found for profile lookup.");
            return;
          }
          const profileRes = await axios.get(`/api/users/${effectiveUserId}/profile`, { headers });
          const profileData = profileRes.data;
          setProfile(profileData);
          setOrgRoles(profileData.organizations || []);
          setProjects(profileData.projects || []);
          setStats(profileData.stats || null);
          setForm({
            name: profileData.user?.name || "",
            title: profileData.profile?.title || "",
            bio: profileData.profile?.bio || "",
            avatarUrl: profileData.profile?.avatarUrl || ""
          });
          return;
        }

        const profileRes = await axios.get("/api/profile/me", { headers });
        const profileData = profileRes.data;
        setProfile(profileData);
        setOrgRoles(profileData.organizations || []);
        setForm({
          name: profileData.user?.name || "",
          title: profileData.profile?.title || "",
          bio: profileData.profile?.bio || "",
          avatarUrl: profileData.profile?.avatarUrl || ""
        });

        if (!org) {
          setProjects([]);
          setStats(null);
          return;
        }

        const [projectRes, taskRes] = await Promise.all([
          axios.get(`/api/projects/org/${org.id}`, { headers }),
          axios.get(`/api/tasks/org/${org.id}`, { headers })
        ]);

        const allProjects = projectRes.data || [];
        const allTasks = taskRes.data || [];

        const userTasks = allTasks.filter((t) => t.userId === profileData.user?.id);
        const tasksCompleted = userTasks.filter((t) => isTaskComplete(t.status)).length;
        const tasksInProgress = userTasks.filter((t) => !isTaskComplete(t.status)).length;

        const completedProjects = allProjects.filter((p) => {
          const related = allTasks.filter((t) => t.projectId === p.id);
          if (related.length === 0) return false;
          return related.every((t) => isTaskComplete(t.status));
        });

        const activeProjects = allProjects.filter((p) => !completedProjects.find((c) => c.id === p.id));

        setStats({
          projectsCompleted: completedProjects.length,
          activeProjects: activeProjects.length,
          tasksCompleted,
          tasksInProgress,
          roles: profileData.organizations?.map((o) => o.role) || []
        });

        setProjects(
          allProjects.map((p) => {
            const derivedStatus = completedProjects.find((c) => c.id === p.id) ? "Completed" : "Active";
            return {
              ...p,
              role: p.userId === profileData.user?.id ? "Owner" : "Member",
              status: normalizeProjectStatus(p.status || derivedStatus),
              organization: org ? { id: org.id, name: org.name } : null
            };
          })
        );
      } catch (err) {
        console.error(err);
        setError("Couldn't load profile data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firebaseUser, effectiveUserId, inviteProfile, user, activeOrganization]);

  const handleAvatarUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, avatarUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
      await axios.put("/api/profile/me", {
        name: form.name,
        title: form.title,
        bio: form.bio,
        avatarUrl: form.avatarUrl
      }, { headers });
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const avatarFallback = firebaseUser?.photoURL || "https://i.pravatar.cc/100?img=5";
  const avatarSrc = form.avatarUrl || avatarFallback;
  const showDrawerBack = typeof closeProfile === "function" && (profileUserId || readOnly || !isSelf);
  const handleBack = () => {
    if (typeof closeProfile === "function") {
      closeProfile();
      return;
    }
    navigate(-1);
  };

  if (loading) {
    return <div className="page-stack"><div className="muted">Loading profile...</div></div>;
  }

  return (
    <div className={`page-stack settings-page ${editing ? "settings-page--editing" : ""}`}>
      {showDrawerBack && (
        <div className="profile-backbar">
          <button className="btn-ghost profile-backbar-btn" onClick={handleBack}>
            Back
          </button>
          <span className="profile-backbar-title">Profile</span>
        </div>
      )}
      <div className="settings-header">
        <div>
          {!isSelf && (
            <button className="btn-ghost profile-back" onClick={handleBack}>
              Back
            </button>
          )}
          <h1>{isSelf ? "My Profile" : "Profile"}</h1>
          <p className="muted">
            {isSelf ? "Your workspace identity and contribution summary." : "Workspace profile overview."}
          </p>
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={() => (editing ? handleSave() : setEditing(true))} disabled={saving}>
            {editing ? <CheckCircle2 size={16} /> : <PencilLine size={16} />}
            {editing ? "Save profile" : "Edit profile"}
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <section className={`settings-card profile-overview ${editing ? "is-editing" : ""}`}>
        <div className="profile-avatar">
          <img src={avatarSrc} alt="profile" />
          {isSelf && editing && (
            <label className="upload-chip">
              <input type="file" accept="image/*" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
              Update avatar
            </label>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-row">
            <div>
              <p className="label">Full name</p>
              <input
                className="settings-input"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!editing || !canEdit}
              />
            </div>
            <div>
              <p className="label">Email</p>
              <input className="settings-input" value={profile?.user?.email || ""} readOnly />
            </div>
          </div>
          <div className="profile-row">
            <div>
              <p className="label">Title</p>
              <input
                className="settings-input"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                disabled={!editing || !canEdit}
                placeholder="Product designer"
              />
            </div>
            <div className="provider-badge">
              {profile?.user?.provider ? profile.user.provider.toUpperCase() : "OAUTH"}
            </div>
          </div>
          <div className="profile-row full">
            <div>
              <p className="label">Bio</p>
              <textarea
                className="settings-input"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                disabled={!editing || !canEdit}
              />
            </div>
          </div>
          <div className="profile-meta">
            <span>Member since: {new Date(profile?.profile?.createdAt || Date.now()).toLocaleDateString()}</span>
            <span>Roles: {orgRoles.map((o) => o.role).join(", ") || "Member"}</span>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <h3>Organizations</h3>
        <div className="org-list">
          {orgRoles.length === 0 && <p className="muted">No organization memberships yet.</p>}
          {orgRoles.map((org) => (
            <div key={org.id} className="org-row">
              <div>
                <p className="org-name">{org.name}</p>
                <span className="muted">Role: {org.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isSelf && (
        <section className="settings-grid">
          <div className="settings-card">
            <h3>Workspace Stats</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <p>Projects completed</p>
                <strong>{stats?.projectsCompleted ?? 0}</strong>
              </div>
              <div className="stat-card">
                <p>Active projects</p>
                <strong>{stats?.activeProjects ?? 0}</strong>
              </div>
              <div className="stat-card">
                <p>Tasks completed</p>
                <strong>{stats?.tasksCompleted ?? 0}</strong>
              </div>
              <div className="stat-card">
                <p>Tasks in progress</p>
                <strong>{stats?.tasksInProgress ?? 0}</strong>
              </div>
            </div>
          </div>
          <div className="settings-card">
            <h3>Preferences</h3>
            <div className="preference-item">
              <div>
                <p className="label">Theme</p>
                <p className="muted">Coming soon</p>
              </div>
              <button className="btn-ghost" disabled>Default</button>
            </div>
            <div className="preference-item">
              <div>
                <p className="label">Notifications</p>
                <p className="muted">Coming soon</p>
              </div>
              <button className="btn-ghost" disabled>Enabled</button>
            </div>
          </div>
        </section>
      )}

      {isSelf && !inviteProfile && (
        <section className="settings-card">
          <h3>Projects</h3>
          <div className="project-list">
            {projects.length === 0 && <p className="muted">No projects yet.</p>}
            {projects.slice(0, 6).map((p) => (
              <button key={p.id} className="project-row" onClick={() => navigate(`/projects/details?id=${p.id}`)}>
                <div>
                  <p className="project-name">{p.name}</p>
                  <span className="muted">
                    Role: {p.role}
                    {p.organization?.name ? ` • ${p.organization.name}` : ""}
                  </span>
                </div>
                <span className={`status-pill status-pill--${(p.status || "active").toLowerCase()}`}>
                  {p.status || "Active"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {isSelf && (
        <section className="settings-card danger-zone">
          <h3>Account Actions</h3>
          <p className="muted">Use caution with account-level actions.</p>
          <div className="action-row">
            <button className="btn-primary" onClick={logout}>Logout</button>
            <button className="btn-danger" disabled>Delete account</button>
          </div>
        </section>
      )}
    </div>
  );
}
