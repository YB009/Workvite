import "../../App.css";
import { useState } from "react";
import axios from "../../api/axiosInstance";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function CreateProjectPage() {
  const { firebaseUser, activeOrganization } = useAuthContext();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("OnTrack");
  const [cover, setCover] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCover(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setError("");
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
      if (!activeOrganization) {
        setError("Join or create an organization first.");
        return;
      }
      const payload = {
        name,
        description,
        status,
        organizationId: activeOrganization.id,
        coverImage: coverPreview || null
      };
      await axios.post(`/api/projects/org/${activeOrganization.id}`, payload, { headers });
      navigate("/projects");
    } catch (err) {
      console.error(err);
      setError("Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Create Project</h1>
      </div>
      <div className="content-surface">
        <form className="grid" style={{ gap: 16, maxWidth: 720 }} onSubmit={submit}>
          <label className="form-field">
            <span>Project name</span>
            <input type="text" placeholder="Sunstone App" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea placeholder="Short summary of this project" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="OnTrack">On track</option>
                <option value="AtRisk">At risk</option>
                <option value="Delayed">Delayed</option>
              </select>
            </label>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Cover image (optional)</span>
              <input type="file" accept="image/*" onChange={handleFile} />
              {coverPreview && (
                <img src={coverPreview} alt="preview" style={{ marginTop: 8, borderRadius: 12, maxHeight: 120, objectFit: "cover" }} />
              )}
            </label>
          </div>
          {error && <div className="error-banner">{error}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-ghost" onClick={() => navigate("/projects")}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
