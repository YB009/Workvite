import { useState } from "react";
import "./TeamPage.css";

export default function InviteModal({ open, onClose, onInvite }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onInvite({ email: email.trim(), role });
      setEmail("");
      setRole("MEMBER");
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Invite failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__header">
          <h3>Invite member</h3>
          <button className="btn-ghost btn-small" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          <label className="form-field">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
            />
          </label>
          <label className="form-field">
            Role
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </select>
          </label>
          {error && <div className="error-banner">{error}</div>}
          <div className="modal__footer">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Inviting..." : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
