import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const endpoint = process.env.BUGSENSE_ENDPOINT;
const projectId = process.env.BUGSENSE_PROJECT_ID;
const apiKey = process.env.BUGSENSE_API_KEY;

const isConfigured = Boolean(endpoint && projectId && apiKey);

class ServerBugSense {
  constructor(options) {
    this.options = options;
  }

  async captureException(error, context = {}) {
    if (typeof fetch !== "function") return { delivered: false };

    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const payload = {
      projectId: this.options.projectId,
      environment: this.options.environment,
      release: this.options.release,
      message: normalizedError.message,
      exceptionType: normalizedError.name,
      stackTrace: normalizedError.stack || "",
      tags: context.tags || {},
      metadata: context.metadata || {},
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(this.options.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bugsense-api-key": this.options.apiKey,
        },
        body: JSON.stringify(payload),
      });

      return { delivered: response.ok };
    } catch {
      return { delivered: false };
    }
  }
}

export const bugsense = isConfigured
  ? new ServerBugSense({
      endpoint,
      projectId,
      apiKey,
      environment: process.env.NODE_ENV || "development",
      release: process.env.BUGSENSE_RELEASE || "workvite-server@dev",
    })
  : null;

if (!bugsense && process.env.NODE_ENV !== "production") {
  console.warn(
    "[BugSense] Missing BUGSENSE_ENDPOINT, BUGSENSE_PROJECT_ID, or BUGSENSE_API_KEY. Server SDK not started."
  );
}
