export function isTaskOverdue(task) {
  if (!task?.dueDate) return false;

  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return false;

  if (task.completedAt) {
    const completed = new Date(task.completedAt);
    if (Number.isNaN(completed.getTime())) return false;
    if (completed <= due) return false;
    return true;
  }

  return due < new Date();
}
