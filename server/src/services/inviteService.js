import crypto from "crypto";

export const createInviteToken = () => {
  return crypto.randomBytes(24).toString("hex");
};

export const getInviteExpiry = (days = 7) => {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
};
