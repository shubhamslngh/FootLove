import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await parseJson(request);
  const action = String(body?.action || "");
  if (!["accept", "decline"].includes(action)) {
    return fail("Invalid challenge response");
  }

  let result;
  await updateDb((db) => {
    const challenge = db.clubChallenges.find(
      (candidate) => candidate.id === id,
    );
    if (!challenge) {
      result = { error: "Challenge not found", status: 404 };
      return db;
    }
    const challengedClub = db.clubs.find(
      (club) => club.id === challenge.challengedClubId,
    );
    if (challengedClub?.captainUserId !== user.id) {
      result = { error: "Only the challenged club captain can respond", status: 403 };
      return db;
    }
    if (challenge.status !== "pending") {
      result = { error: "This challenge has already been answered", status: 409 };
      return db;
    }

    challenge.status = action === "accept" ? "accepted" : "declined";
    challenge.respondedByUserId = user.id;
    challenge.respondedAt = new Date().toISOString();
    result = { challenge };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok(result);
}
