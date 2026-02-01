import { isTaskOverdue } from "../utils/taskUtils.js";

export function useOverdueTasks(tasks = []) {
  return tasks.filter((task) => isTaskOverdue(task));
}
