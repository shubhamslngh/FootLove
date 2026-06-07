import { randomUUID } from "node:crypto";

import { ok, fail, parseJson, requireUser } from "@/lib/server/http";
import { canHostMatch, canManagePlatform } from "@/lib/server/roles";
import { readDb, updateDb } from "@/lib/server/db";

export async function GET() {
  const db = await readDb();
  return ok({ venues: db.venues.filter((venue) => venue.status !== "rejected") });
}

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!canHostMatch(user)) return fail("Your manager payment method must be approved before you can create venues", 403);

  const body = await parseJson(request);
  const name = String(body?.name || "").trim();
  const area = String(body?.area || "").trim();
  const city = String(body?.city || "").trim();
  if (!name || !area || !city) return fail("Venue name, area, and city are required");

  const now = new Date().toISOString();
  const venue = {
    id: `ven_${randomUUID()}`,
    name,
    area,
    city,
    address: String(body?.address || "").trim(),
    mapUrl: String(body?.mapUrl || "").trim(),
    status: canManagePlatform(user.role) ? "approved" : "pending",
    submittedByUserId: user.id,
    approvedByUserId: canManagePlatform(user.role) ? user.id : null,
    approvedAt: canManagePlatform(user.role) ? now : null,
    createdAt: now,
  };

  await updateDb((db) => {
    db.venues.push(venue);
    return db;
  });

  return ok({ venue }, { status: 201 });
}
