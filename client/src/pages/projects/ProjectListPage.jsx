import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProjectCard from "../../components/ProjectCard.jsx";
import "../../App.css";
import { useAuthContext } from "../../context/AuthContext.jsx";
import axios from "../../api/axiosInstance";

export default function ProjectListPage() {
  const { firebaseUser } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!firebaseUser) return;
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        const orgRes = await axios.get("/api/orgs", { headers });
        const org = orgRes.data?.[0];
        if (!org) {
          setProjects([]);
          setTasks([]);
          return;
        }
        const [projRes, taskRes] = await Promise.all([
          axios.get(`/api/projects/org/${org.id}`, { headers }),
          axios.get(`/api/tasks/org/${org.id}`, { headers })
        ]);
        setProjects(projRes.data || []);
        setTasks(taskRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Couldn't load projects. Check backend and auth.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firebaseUser]);

  const enhancedProjects = useMemo(() => {
    const taskByProject = tasks.reduce((acc, t) => {
      acc[t.projectId] = acc[t.projectId] || [];
      acc[t.projectId].push(t);
      return acc;
    }, {});

    return projects.map((p) => {
      const taskList = taskByProject[p.id] || [];
      const completed = taskList.filter((t) => (t.status || "").toLowerCase().includes("done") || t.status === "completed").length;
      const progress = taskList.length ? Math.round((completed / taskList.length) * 100) : 0;
      return {
        ...p,
        stats: { tasks: taskList.length, team: 0, files: 0 },
        progress,
        dueLabel: p.updatedAt ? "Updated" : "Created",
        date: p.updatedAt || p.createdAt || ""
      };
    });
  }, [projects, tasks]);

  const filteredProjects = useMemo(() => {
    const q = (searchParams.get("q") || "").toLowerCase();
    if (!q) return enhancedProjects;
    return enhancedProjects.filter((p) =>
      [p.name, p.description].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [enhancedProjects, searchParams]);

  const emptyState = (
    <div className="content-surface" style={{ textAlign: "center", padding: "40px" }}>
      <p style={{ margin: 0, color: "#4b5563", fontWeight: 600 }}>No projects yet</p>
      <p className="muted">Create your first project to start organizing tasks.</p>
      <button className="btn-primary" onClick={() => navigate("/projects/create")}>
        Create Project
      </button>
    </div>
  );

  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Projects</h1>
        <div className="actions">
          <button className="btn-ghost" onClick={() => navigate("/projects/create")}>Create Project</button>
        </div>
      </div>
      <div className="content-surface">
        {loading && <div className="muted">Loading projects...</div>}
        {error && <div className="error-banner">{error}</div>}
        {!loading && !error && filteredProjects.length === 0 && emptyState}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className="grid projects">
            {filteredProjects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onSelect={() =>
                  navigate(`/projects/details?id=${p.id}`, {
                    state: { project: p, tasks: tasks.filter((t) => t.projectId === p.id) }
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
