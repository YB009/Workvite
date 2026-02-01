import nodemailer from "nodemailer";

const buildTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secureEnv = process.env.SMTP_SECURE;
  const secure = secureEnv ? secureEnv === "true" : port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
    ,
    connectionTimeout: 15000,
    greetingTimeout: 15000
  });
};

export const sendInviteEmail = async ({ to, inviteLink, orgName, inviterName }) => {
  const transporter = buildTransporter();
  if (!transporter) {
    return { skipped: true };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = `You're invited to join ${orgName || "a workspace"}`;
  const text = [
    `Hi,`,
    ``,
    `${inviterName || "A teammate"} invited you to join ${orgName || "a workspace"}.`,
    `Accept the invite using this link:`,
    inviteLink,
    ``,
    `If you did not expect this invite, you can ignore this email.`,
  ].join("\n");

  await transporter.sendMail({
    from,
    to,
    subject,
    text
  });

  return { sent: true };
};
