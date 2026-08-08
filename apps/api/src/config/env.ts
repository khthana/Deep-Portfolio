import dotenv from "dotenv";

dotenv.config();

/**
 * Reads a required environment variable.
 *
 * Secrets must never have a hardcoded fallback: a fallback turns a
 * misconfigured deployment into a silently insecure one. Fail loudly instead.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. See .env.example.`,
    );
  }

  return value;
}
