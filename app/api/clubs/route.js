import { randomUUID } from "node:crypto";

import { readDb, updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const db = await readDb();
  return ok({ clubs: db.clubs, memberships: db.clubMemberships });
}

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await parseJson(request);
  const name = String(body?.name || "").trim();
  const city = String(body?.city || "").trim();
  const description = String(body?.description || "").trim();
  const logoDataUrl = String(body?.logoDataUrl || "").trim();
  if (!name || !city || !logoDataUrl) {
    return fail("Club name, city, and logo are required");
  }
  if (!logoDataUrl.startsWith("data:image/")) {
    return fail("Upload a valid club logo");
  }
  if (name.length > 160 || city.length > 160) {
    return fail("Club name or city is too long");
  }

  const now = new Date().toISOString();
  let result;
  await updateDb((db) => {
    const nameTaken = db.clubs.some(
      (club) => club.name.toLowerCase() === name.toLowerCase(),
    );
    if (nameTaken) {
      result = { error: "A club with this name already exists", status: 409 };
      return db;
    }

    const club = {
      id: `clb_${randomUUID()}`,
      name,
      slug: `${slugify(name)}-${randomUUID().slice(0, 6)}`,
      city,
      description,
      logoDataUrl,
      captainUserId: user.id,
      createdAt: now,
    };
    const membership = {
      id: `mem_${randomUUID()}`,
      clubId: club.id,
      userId: user.id,
      role: "captain",
      status: "active",
      joinedAt: now,
    };
    db.clubs.push(club);
    db.clubMemberships.push(membership);
    result = { club, membership };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok(result, { status: 201 });
}
