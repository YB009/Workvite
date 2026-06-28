import prisma from "../prisma/client.js";

export default async function handler(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("[health] database ping failed:", error?.message || error);
    res.status(500).json({ status: "error", database: "unavailable" });
  }
}
