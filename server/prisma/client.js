// server/prisma/client.js
import pkgClient from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Ensure environment variables are loaded even when this file is imported early.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const { Pool } = pkg;
const { PrismaClient } = pkgClient;
const rawConnectionString = process.env.DATABASE_URL;
const allowInvalidCerts =
  /sslaccept=accept_invalid_certs/i.test(rawConnectionString || "") ||
  process.env.PG_SSL_REJECT_UNAUTHORIZED === "false";

let connectionString = rawConnectionString;
if (allowInvalidCerts && rawConnectionString) {
  try {
    const url = new URL(rawConnectionString);
    // node-postgres can let URL SSL params override the explicit `ssl` config object.
    // Strip SSL query params and set SSL behavior explicitly below.
    [
      "sslmode",
      "sslaccept",
      "sslcert",
      "sslkey",
      "sslrootcert",
      "sslcrl",
    ].forEach((key) => url.searchParams.delete(key));
    connectionString = url.toString();
  } catch {
    connectionString = rawConnectionString;
  }
}

const pool = new Pool({
  connectionString,
  // Supabase pooler certificates can fail strict validation in some serverless runtimes.
  ...(allowInvalidCerts ? { ssl: { rejectUnauthorized: false } } : {}),
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
