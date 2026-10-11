import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "friend-game-night";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function sign(expiry: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(expiry).digest("hex");
}

export function createSessionToken() {
  const expiry = String(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS);
  return `${expiry}.${sign(expiry)}`;
}

export function isValidSession(token: string) {
  const [expiry, signature, extra] = token.split(".");
  if (!expiry || !signature || extra !== undefined || !/^\d+$/.test(expiry)) return false;
  if (Number(expiry) <= Math.floor(Date.now() / 1000)) return false;
  try {
    const expected = Buffer.from(sign(expiry), "hex");
    const actual = Buffer.from(signature, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
