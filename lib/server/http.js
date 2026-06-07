import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/server/auth";

export function ok(data, init) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message, status = 400, details) {
  return NextResponse.json({ ok: false, error: { message, details } }, { status });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    return { error: fail("Authentication required", 401) };
  }

  return { user };
}

export async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
