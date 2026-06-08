import { randomUUID } from "node:crypto";

import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await parseJson(request);
  const matchId = String(body?.matchId || "");
  let result;

  await updateDb((db) => {
    const community = db.communities.find((item) => item.id === id);
    if (!community) {
      result = { error: "Community not found", status: 404 };
      return db;
    }
    if (community.createdByUserId !== user.id) {
      result = { error: "Only the community creator can add match history", status: 403 };
      return db;
    }
    const match = db.matches.find((item) => item.id === matchId);
    if (!match || match.status !== "completed") {
      result = { error: "Choose a completed match", status: 400 };
      return db;
    }
    const participated =
      match.hostUserId === user.id ||
      db.bookings.some(
        (booking) =>
          booking.matchId === matchId &&
          booking.userId === user.id &&
          booking.status === "confirmed",
      );
    if (!participated) {
      result = { error: "You can only add matches you hosted or played in", status: 403 };
      return db;
    }
    if (
      db.communityMatches.some(
        (item) => item.communityId === id && item.matchId === matchId,
      )
    ) {
      result = { error: "This match is already listed", status: 409 };
      return db;
    }

    const communityMatch = {
      id: `cmt_${randomUUID()}`,
      communityId: id,
      matchId,
      addedByUserId: user.id,
      addedAt: new Date().toISOString(),
    };
    db.communityMatches.push(communityMatch);
    result = { communityMatch };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok(result, { status: 201 });
}
