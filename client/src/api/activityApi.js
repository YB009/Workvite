import axios from "./axiosInstance";

const buildParams = (filters = {}, page, pageSize) => {
  const params = { page, pageSize };
  if (filters.projectId) params.projectId = filters.projectId;
  if (filters.userId) params.userId = filters.userId;
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;
  return params;
};

export const fetchActivity = async ({ token, filters, page = 1, pageSize = 25 }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const params = buildParams(filters, page, pageSize);
  const res = await axios.get("/api/activity", { headers, params });
  return res.data;
};

export const logActivity = async ({ token, type, message, projectId, taskId }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.post(
    "/api/activity",
    { type, message, projectId, taskId },
    { headers }
  );
  return res.data;
};
