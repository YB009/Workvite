import { useEffect, useState } from "react";

export default function DueDateEditor({ task, onUpdate, className = "" }) {
  const [date, setDate] = useState("");

  useEffect(() => {
    if (!task?.dueDate) {
      setDate("");
      return;
    }
    try {
      const value = new Date(task.dueDate).toISOString().slice(0, 10);
      setDate(value);
    } catch {
      setDate("");
    }
  }, [task]);

  return (
    <div className={`due-date-editor ${className}`}>
      <label className="label" htmlFor="due-date-editor">Due date</label>
      <div className="due-date-editor__row due-date-editor__stack">
        <input
          id="due-date-editor"
          type="date"
          className="form-field"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="btn-ghost due-date-editor__button"
          type="button"
          onClick={() => onUpdate && onUpdate(date)}
        >
          Update
        </button>
      </div>
    </div>
  );
}
