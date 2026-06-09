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

  captureMessage(message, context = {}) {
    return this.send({
      message,
      exceptionType: "Message",
      stackTrace: "",
      handled: true,
      context,
    });
  }

  async captureException(error, context = {}) {
    if (typeof fetch !== "function") return { delivered: false };

    const normalizedError = error instanceof Error ? error : new Error(String(error));
    return this.send({
      message: normalizedError.message,
      exceptionType: normalizedError.name,
      stackTrace: normalizedError.stack || "",
      handled: false,
      context,
    });
  }

  flush() {
    return Promise.resolve({ delivered: true, sent: 0, failed: 0 });
  }

  async send({ message, exceptionType, stackTrace, handled, context }) {
    if (typeof fetch !== "function") return { delivered: false };

    const payload = {
      projectId: this.options.projectId,
      message,
      level: "error",
      platform: "server",
      environment: this.options.environment,
      releaseVersion: this.options.release,
      exceptionType,
      stackTrace,
      handled,
      tags: context.tags || {},
      contexts: context.contexts || {},
      metadata: context.metadata || {},
      occurredAt: new Date().toISOString(),
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
