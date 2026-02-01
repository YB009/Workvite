import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../../App.css";
import axios from "../../api/axiosInstance";
import { useAuthContext } from "../../context/AuthContext.jsx";

export default function EditProjectPage() {
  const { firebaseUser } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const projectFromState = location.state?.project;
  const projectId = searchParams.get("id") || projectFromState?.id;

  const [name, setName] = useState(projectFromState?.name || "");
  const [description, setDescription] = useState(projectFromState?.description || "");
  const [status, setStatus] = useState(projectFromState?.status || "Active");
  const [coverPreview, setCoverPreview] = useState(projectFromState?.coverImage || "");
  const [coverImage, setCoverImage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!firebaseUser || projectFromState || !projectId) return;
      try {
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        const orgRes = await axios.get("/api/orgs", { headers });
        const org = orgRes.data?.[0];
        if (!org) return;
        const projRes = await axios.get(`/api/projects/org/${org.id}`, { headers });
        const found = (projRes.data || []).find((p) => p.id === projectId);
        if (found) {
          setName(found.name);
          setDescription(found.description || "");
          setStatus(found.status || "Active");
          setCoverPreview(found.coverImage || "");
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [firebaseUser, projectFromState, projectId]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!firebaseUser || !projectId) return;
    setError("");
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
      const orgRes = await axios.get("/api/orgs", { headers });
      const org = orgRes.data?.[0];
      if (!org) {
        setError("Join or create an organization first.");
        return;
      }
      const payload = {
        name,
        description,
        status,
        coverImage: coverPreview || null
      };
      await axios.put(`/api/projects/org/${org.id}/projects/${projectId}`, payload, { headers });
      navigate(`/projects/details?id=${projectId}`);
    } catch (err) {
      console.error(err);
      setError("Failed to update project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Edit Project</h1>
      </div>
      <div className="content-surface">
        <form className="grid" style={{ gap: 16, maxWidth: 720 }} onSubmit={submit}>
          <label className="form-field">
            <span>Project name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Delayed">Delayed</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Cover image</span>
              <input type="file" accept="image/*" onChange={handleFile} />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="cover preview"
                  style={{ marginTop: 8, borderRadius: 12, maxHeight: 140, objectFit: "cover" }}
                />
              )}
            </label>
          </div>
          {error && <div className="error-banner">{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
