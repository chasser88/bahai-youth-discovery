// Password hashing + signed session tokens.
// Uses only Node's built-in crypto -- no npm dependencies to install.

import { randomBytes, pbkdf2Sync, createHmac, timingSafeEqual } from "crypto";

const ITERATIONS = 120000;
const KEYLEN = 32;
const DIGEST = "sha256";
const SESSION_DAYS = 30;

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is not set (needs to be a long random string)");
  }
  return s;
}

// ---------- passwords ----------

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------- tokens ----------

function b64url(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(payloadB64) {
  return b64url(createHmac("sha256", secret()).update(payloadB64).digest());
}

export function issueToken({ email, role }) {
  const payload = {
    email: String(email).toLowerCase(),
    role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  };
  const p = b64url(JSON.stringify(payload));
  return `${p}.${sign(p)}`;
}

// Returns the payload, or null if the token is missing, malformed,
// tampered with, or expired.
export function readToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [p, sig] = token.split(".");
  if (!p || !sig) return null;

  let expected;
  try { expected = sign(p); } catch { return null; }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload;
  try { payload = JSON.parse(fromB64url(p).toString("utf8")); } catch { return null; }
  if (!payload?.exp || Date.now() > payload.exp) return null;

  return payload;
}

// ---------- validation ----------

export function normEmail(e) {
  return String(e || "").trim().toLowerCase();
}

export function validEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normEmail(e));
}

export function passwordProblem(pw) {
  if (typeof pw !== "string" || pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must include a letter and a number.";
  return null;
}

export function isAdmin(payload) {
  const adminEmail = normEmail(process.env.ADMIN_EMAIL);
  return payload?.role === "admin" || (adminEmail && payload?.email === adminEmail);
}
