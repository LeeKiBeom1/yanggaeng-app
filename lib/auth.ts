import crypto from "crypto";

const COOKIE_NAME = "yanggaeng_session";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is required");
  }
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionToken() {
  const payload = `${Date.now()}.${crypto.randomBytes(16).toString("hex")}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length < 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const providedSig = parts.slice(2).join(".");
  const expectedSig = sign(payload);
  if (providedSig.length !== expectedSig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(providedSig), Buffer.from(expectedSig));
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function getSessionAgeSeconds() {
  return SESSION_AGE_SECONDS;
}
