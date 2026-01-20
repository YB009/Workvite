import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import "../../App.css";
import TaskCard from "../../components/tasks/TaskCard.jsx";
import axios from "../../api/axiosInstance";
import { useAuthContext } from "../../context/AuthContext.jsx";

export default function TaskDetailsPage() {
  const { firebaseUser } = useAuthContext();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [task, setTask] = useState(location.state?.task || null);
  const [loading, setLoading] = useState(!task);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (task || !firebaseUser) return;
      const taskId = searchParams.get("id");
      if (!taskId) {
        setError("No task id provided.");
        setLoading(false);
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        const orgRes = await axios.get("/api/orgs", { headers });
        const org = orgRes.data?.[0];
        if (!org) {
          setError("No organization found.");
          setLoading(false);
          return;
        }
        const tasksRes = await axios.get(`/api/tasks/org/${org.id}`, { headers });
        const found = (tasksRes.data || []).find((t) => t.id === taskId);
        if (found) setTask(found);
        else setError("Task not found.");
      } catch (err) {
        console.error(err);
        setError("Failed to load task.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firebaseUser, searchParams, task]);

  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Task Details</h1>
        <div className="actions">
          <button className="btn-ghost">Share</button>
        </div>
      </div>
      <div className="content-surface" style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 320px" }}>
        {loading && <div className="muted">Loading task...</div>}
        {error && <div className="error-banner">{error}</div>}
        {!loading && !error && task && (
          <>
            <div style={{ display: "grid", gap: 12 }}>
              <TaskCard task={task} />
              <div className="content-surface" style={{ background: "#f8fafc" }}>
                <p className="muted" style={{ marginTop: 0, fontWeight: 600 }}>Description</p>
                <p style={{ margin: 0 }}>{task.description || "No description yet."}</p>
              </div>
              <div className="content-surface" style={{ background: "#f8fafc" }}>
                <p className="muted" style={{ marginTop: 0, fontWeight: 600 }}>Comments</p>
                <p className="muted">Comment thread can live here (frontend only for now).</p>
              </div>
            </div>
            <div className="content-surface" style={{ border: "1px dashed #e5e7eb" }}>
              <p className="muted" style={{ margin: 0, fontWeight: 600 }}>Attachments</p>
              <p className="muted">Hook storage later. Not added yet.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
