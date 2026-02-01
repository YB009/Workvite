import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import "../../App.css";
import axios from "../../api/axiosInstance";
import { useAuthContext } from "../../context/AuthContext.jsx";
import ProjectKanbanView from "../../components/ProjectKanbanView.jsx";
import ProjectListView from "../../components/ProjectListView.jsx";
import ProjectCalendarView from "../../components/ProjectCalendarView.jsx";
import CreateTaskDrawer from "../../components/tasks/CreateTaskDrawer.jsx";
import { fetchTeamMembers } from "../../api/teamApi.js";
import TaskDetailDrawer from "../../components/tasks/TaskDetailDrawer.jsx";

const normalizeStatus = (status = "") => {
  const s = status.toLowerCase();
  if (["done", "completed", "complete", "closed"].includes(s)) return "Completed";
  if (["in progress", "ongoing", "progress"].includes(s)) return "In Progress";
  return "Not Started";
};

export default function ProjectDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { firebaseUser, activeOrganization } = useAuthContext();

  const [project, setProject] = useState(location.state?.project || null);
  const [tasks, setTasks] = useState(location.state?.tasks || []);
  const [view, setView] = useState("kanban");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [members, setMembers] = useState([]);
  const projectIdFromQuery = searchParams.get("id");
  const inflightRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      if (!firebaseUser || inflightRef.current) return;
      if (!projectIdFromQuery && project) {
        setLoading(false);
        return;
      }
      if (!activeOrganization) {
        setLoading(false);
        return;
      }
      inflightRef.current = true;
      setError("");
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        const [projRes, taskRes] = await Promise.all([
          axios.get(`/api/projects/org/${activeOrganization.id}`, { headers }),
          axios.get(`/api/tasks/org/${activeOrganization.id}`, { headers })
        ]);
        const list = projRes.data || [];
        const match = list.find((p) => p.id === projectIdFromQuery) || list[0] || null;
        setProject(match);
        setTasks((taskRes.data || []).filter((t) => !match || t.projectId === match.id));
      } catch (err) {
        console.error(err);
        setError("Couldn't load project details.");
      } finally {
        setLoading(false);
        inflightRef.current = false;
      }
    };
    load();
  }, [firebaseUser, activeOrganization, projectIdFromQuery]);

  useEffect(() => {
    const loadMembers = async () => {
      if (!firebaseUser || !activeOrganization) return;
      try {
        const token = await firebaseUser.getIdToken();
        const team = await fetchTeamMembers({ token, orgId: activeOrganization.id });
        const list = (team?.items || []).filter((m) => !m.isInvite);
        setMembers(list);
      } catch (err) {
        console.error(err);
      }
    };
    loadMembers();
  }, [firebaseUser, activeOrganization]);

  const calendarItems = useMemo(() => {
    return tasks.map((t, idx) => ({
      ...t,
      day: (idx % 7) + 12,
      lane: normalizeStatus(t.status)
    }));
  }, [tasks]);

  return (
    <div className="page-stack">
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-ghost" onClick={() => navigate("/projects")}>
            Back
          </button>
          <div>
            <p className="muted" style={{ margin: 0, fontWeight: 700 }}>Project / Details</p>
            <h2 style={{ margin: 0 }}>{project?.name || "Project"}</h2>
          </div>
        </div>
        <div className="actions" style={{ gap: 8 }}>
          <button className={view === "kanban" ? "btn-primary" : "btn-ghost"} onClick={() => setView("kanban")}>
            Kanban
          </button>
          <button className={view === "list" ? "btn-primary" : "btn-ghost"} onClick={() => setView("list")}>
            List
          </button>
          <button className={view === "calendar" ? "btn-primary" : "btn-ghost"} onClick={() => setView("calendar")}>
            Calendar
          </button>
          {project && (
            <button className="btn-ghost" onClick={() => navigate(`/projects/edit?id=${project.id}`, { state: { project } })}>
              Edit Project
            </button>
          )}
          <button className="btn-ghost" onClick={() => setShowCreateTask(true)}>Create Task</button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="content-surface">
          <p className="muted">Loading project...</p>
        </div>
      )}

      {!loading && !project && (
        <div className="content-surface">
          <p className="muted">No project selected. Go back to Projects.</p>
          <button className="btn-primary" onClick={() => navigate("/projects")}>
            Back to Projects
          </button>
        </div>
      )}

      {!loading && project && view === "kanban" && (
        <div className="content-surface">
          <ProjectKanbanView
            tasks={tasks}
            onTaskClick={(task) => setActiveTask(task)}
            onStatusChange={async (taskId, statusValue) => {
              if (!activeOrganization || !firebaseUser) return;
              const label = normalizeStatus(statusValue);
              setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, status: label } : t))
              );
              setActiveTask((t) => (t && t.id === taskId ? { ...t, status: label } : t));
              try {
                const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
                await axios.patch(`/api/tasks/org/${activeOrganization.id}/${taskId}`, { status: label }, { headers });
              } catch (err) {
                console.error(err);
                setError("Failed to update task status.");
              }
            }}
          />
        </div>
      )}

      {!loading && project && view === "list" && (
        <ProjectListView tasks={tasks} onTaskClick={(task) => setActiveTask(task)} />
      )}

      {!loading && project && view === "calendar" && (
        <ProjectCalendarView tasks={tasks} onTaskClick={(task) => setActiveTask(task)} />
      )}

      <CreateTaskDrawer
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projects={project ? [project] : []}
        fixedProjectId={project?.id}
        fixedProjectName={project?.name}
        members={members}
        onCreate={async (payload) => {
          if (!activeOrganization || !firebaseUser || !project) return;
          try {
            const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
            const res = await axios.post(`/api/tasks/org/${activeOrganization.id}`, payload, { headers });
            setTasks((prev) => [res.data, ...prev]);
            setShowCreateTask(false);
          } catch (err) {
            console.error(err);
            setError("Failed to create task.");
          }
        }}
      />

      <TaskDetailDrawer
        task={activeTask}
        onClose={() => setActiveTask(null)}
        members={members}
        onDescriptionChange={(nextDescription) => {
          if (!activeTask) return;
          setTasks((prev) =>
            prev.map((t) => (t.id === activeTask.id ? { ...t, description: nextDescription } : t))
          );
          setActiveTask((t) => (t ? { ...t, description: nextDescription } : t));
        }}
        onStatusChange={async (newStatus) => {
          if (!activeTask || !activeOrganization || !firebaseUser) return;
          const label = normalizeStatus(newStatus);
          setTasks((prev) =>
            prev.map((t) => (t.id === activeTask.id ? { ...t, status: label } : t))
          );
          setActiveTask((t) => (t ? { ...t, status: label } : t));
          try {
            const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
            await axios.patch(`/api/tasks/org/${activeOrganization.id}/${activeTask.id}`, { status: label }, { headers });
          } catch (err) {
            console.error(err);
            setError("Failed to update task status.");
          }
        }}
        onDueDateChange={async (newDate) => {
          if (!activeTask || !activeOrganization || !firebaseUser) return;
          const nextDate = newDate ? new Date(newDate).toISOString() : null;
          setTasks((prev) =>
            prev.map((t) => (t.id === activeTask.id ? { ...t, dueDate: nextDate } : t))
          );
          setActiveTask((t) => (t ? { ...t, dueDate: nextDate } : t));
          try {
            const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
            await axios.patch(
              `/api/tasks/org/${activeOrganization.id}/${activeTask.id}`,
              { dueDate: newDate || null },
              { headers }
            );
          } catch (err) {
            console.error(err);
            setError("Failed to update due date.");
          }
        }}
        onAssigneesChange={async (assigneeIds) => {
          if (!activeTask || !activeOrganization || !firebaseUser) return;
          try {
            const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
            const res = await axios.patch(
              `/api/tasks/org/${activeOrganization.id}/${activeTask.id}/assignees`,
              { assigneeIds },
              { headers }
            );
            setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? res.data : t)));
            setActiveTask(res.data);
          } catch (err) {
            console.error(err);
            setError("Failed to update assignees.");
          }
        }}
        onAttachmentsChange={(nextAttachments) => {
          if (!activeTask) return;
          setTasks((prev) =>
            prev.map((t) => (t.id === activeTask.id ? { ...t, attachments: nextAttachments } : t))
          );
          setActiveTask((t) => (t ? { ...t, attachments: nextAttachments } : t));
        }}
      />
    </div>
  );
}
