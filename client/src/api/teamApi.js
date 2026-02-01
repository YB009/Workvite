import axios from "./axiosInstance";

export const fetchTeamMembers = async ({ token, orgId }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.get("/api/team/members", {
    headers,
    params: { orgId }
  });
  return res.data;
};

export const inviteTeamMember = async ({ token, orgId, email, role }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.post(
    "/api/team/invite",
    { orgId, email, role },
    { headers }
  );
  return res.data;
};

export const deactivateTeamMember = async ({ token, memberId }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.patch(`/api/team/${memberId}/deactivate`, {}, { headers });
  return res.data;
};

export const updateTeamRole = async ({ token, memberId, role }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.patch(`/api/team/${memberId}/role`, { role }, { headers });
  return res.data;
};

export const acceptTeamInvite = async ({ token, inviteToken }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.post("/api/team/accept-invite", { token: inviteToken }, { headers });
  return res.data;
};

export const resendTeamInvite = async ({ token, inviteId }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.post(`/api/team/invites/${inviteId}/resend`, {}, { headers });
  return res.data;
};

export const cancelTeamInvite = async ({ token, inviteId }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.patch(`/api/team/invites/${inviteId}/cancel`, {}, { headers });
  return res.data;
};

export const updateTeamProjectAccess = async ({ token, memberId, projectIds }) => {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await axios.patch(
    `/api/team/${memberId}/projects`,
    { projectIds },
    { headers }
  );
  return res.data;
};
