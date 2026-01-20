import { useEffect, useMemo, useState } from "react";
import "./TeamPage.css";

export default function ProjectAccessModal({ open, member, projects, onClose, onSave }) {
  const initial = useMemo(() => {
    return new Set(member?.projectIds || []);
  }, [member?.id, member?.projectIds]);
  const [selection, setSelection] = useState(initial);

  useEffect(() => {
    if (!open || !member) return;
    setSelection(new Set(member?.projectIds || []));
  }, [open, member?.id, member?.projectIds]);

  if (!open || !member) return null;

  const toggleProject = (projectId) => {
    const next = new Set(selection);
    if (next.has(projectId)) {
      next.delete(projectId);
    } else {
      next.add(projectId);
    }
    setSelection(next);
  };

  const handleSave = () => {
    onSave(member, Array.from(selection));
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__header">
          <h3>Project access</h3>
          <button className="btn-ghost btn-small" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal__body">
          <p className="muted">
            Select which projects {member.name || member.email} can access.
          </p>
          <div className="project-access">
            {projects.map((project) => (
              <label className="project-access__item" key={project.id} htmlFor={`project-${member.id}-${project.id}`}>
                <input
                  id={`project-${member.id}-${project.id}`}
                  type="checkbox"
                  checked={selection.has(project.id)}
                  onChange={() => toggleProject(project.id)}
                />
                <span>{project.name}</span>
              </label>
            ))}
          </div>
          <div className="modal__footer">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-primary" type="button" onClick={handleSave}>
              Save access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
