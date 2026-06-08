import { randomUUID } from "node:crypto";

import { updateDb } from "@/lib/server/db";
import { fail, ok, requireUser } from "@/lib/server/http";

export async function POST(_request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  let result;

  await updateDb((db) => {
    const club = db.clubs.find((candidate) => candidate.id === id);
    if (!club) {
      result = { error: "Club not found", status: 404 };
      return db;
    }
    const existing = db.clubMemberships.find(
      (membership) =>
        membership.clubId === id && membership.userId === user.id,
    );
    if (existing) {
      result = { error: "You are already a member of this club", status: 409 };
      return db;
    }

    const membership = {
      id: `mem_${randomUUID()}`,
      clubId: id,
      userId: user.id,
      role: "player",
      status: "active",
      joinedAt: new Date().toISOString(),
    };
    db.clubMemberships.push(membership);
    result = { membership };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok(result, { status: 201 });
}
