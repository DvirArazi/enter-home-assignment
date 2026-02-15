import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_LENGTH = 64;

export const createPasswordHash = (password: string) => {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString("hex");
  const digest = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");

  return `scrypt:${salt}:${digest}`;
};

export const verifyPassword = (password: string, storedHash: string) => {
  const [algorithm, salt, digest] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !digest) {
    return false;
  }

  const expectedDigest = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const digestBuffer = Buffer.from(digest, "hex");

  if (expectedDigest.length !== digestBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedDigest, digestBuffer);
};

export const createSessionToken = () => randomBytes(32).toString("base64url");

export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
