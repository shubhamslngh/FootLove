import { randomUUID } from "node:crypto";

import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await parseJson(request);
  const challengerClubId = String(body?.challengerClubId || "");
  const challengedClubId = String(body?.challengedClubId || "");
  if (!challengerClubId || !challengedClubId) {
    return fail("Choose both clubs");
  }
  if (challengerClubId === challengedClubId) {
    return fail("A club cannot challenge itself");
  }

  let result;
  await updateDb((db) => {
    const challenger = db.clubs.find((club) => club.id === challengerClubId);
    const challenged = db.clubs.find((club) => club.id === challengedClubId);
    if (!challenger || !challenged) {
      result = { error: "Club not found", status: 404 };
      return db;
    }
    if (challenger.captainUserId !== user.id) {
      result = { error: "Only the club captain can send challenges", status: 403 };
      return db;
    }
    const duplicate = db.clubChallenges.some(
      (challenge) =>
        challenge.status === "pending" &&
        challenge.challengerClubId === challengerClubId &&
        challenge.challengedClubId === challengedClubId,
    );
    if (duplicate) {
      result = { error: "A challenge is already pending", status: 409 };
      return db;
    }

    const challenge = {
      id: `chl_${randomUUID()}`,
      challengerClubId,
      challengedClubId,
      createdByUserId: user.id,
      status: "pending",
      proposedDate: String(body?.proposedDate || "").trim() || null,
      proposedTime: String(body?.proposedTime || "").trim() || null,
      venueNote: String(body?.venueNote || "").trim(),
      message: String(body?.message || "").trim(),
      createdAt: new Date().toISOString(),
    };
    db.clubChallenges.push(challenge);
    result = { challenge };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok(result, { status: 201 });
}
