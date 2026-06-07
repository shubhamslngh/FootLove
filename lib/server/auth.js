import crypto from "node:crypto";
import { cookies } from "next/headers";

import { publicUser, readDb } from "@/lib/server/db";
import { getSessionSecret } from "@/lib/server/env";

const SESSION_COOKIE = "footlove_session";

function sign(value) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("hex");
}

function createSessionToken(user) {
  const payload = Buffer.from(JSON.stringify({ userId: user.id, role: user.role })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

async function getCookieStore() {
  return cookies();
}

export async function setSessionCookie(user) {
  const cookieStore = await getCookieStore();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await getCookieStore();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await getCookieStore();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const db = await readDb();
    return publicUser(db.users.find((user) => user.id === data.userId));
  } catch {
    return null;
  }
}
