import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import { canManagePlatform } from "@/lib/server/roles";

function canManageMatch(user, match) {
  return canManagePlatform(user.role) || match.hostUserId === user.id;
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await parseJson(request);
  const homeTeam = String(body?.homeTeam || "").trim();
  const awayTeam = String(body?.awayTeam || "").trim();
  const assignments = Array.isArray(body?.assignments) ? body.assignments : [];
  if (!homeTeam || !awayTeam) {
    return fail("Both team names are required");
  }

  let result;
  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (!canManageMatch(user, match)) {
      result = {
        error: "Only this match host or an admin can manage this match",
        status: 403,
      };
      return db;
    }

    match.homeTeam = homeTeam;
    match.awayTeam = awayTeam;
    if (assignments.length) {
      const confirmedBookings = db.bookings.filter(
        (booking) =>
          booking.matchId === id &&
          ["pending", "confirmed"].includes(booking.status),
      );
      const bookingById = new Map(
        confirmedBookings.map((booking) => [booking.id, booking]),
      );
      for (const assignment of assignments) {
        const booking = bookingById.get(String(assignment.bookingId || ""));
        if (!booking || !["home", "away"].includes(assignment.team)) continue;
        booking.team = assignment.team;
      }
    }
    match.updatedAt = new Date().toISOString();
    result = { match };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ match: result.match });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await parseJson(request);
  const bookingId = String(body?.bookingId || "");
  if (!bookingId) return fail("Select a player to remove");

  let result;
  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (!canManageMatch(user, match)) {
      result = {
        error: "Only this match host or an admin can manage this match",
        status: 403,
      };
      return db;
    }

    const booking = db.bookings.find(
      (candidate) => candidate.id === bookingId && candidate.matchId === id,
    );
    if (!booking) {
      result = { error: "Player booking not found", status: 404 };
      return db;
    }
    if (!["pending", "confirmed"].includes(booking.status)) {
      result = { error: "This player is already removed", status: 409 };
      return db;
    }

    if (booking.status === "confirmed") {
      match.booked = Math.max(0, Number(match.booked || 0) - 1);
    }
    booking.status = "removed";
    booking.team = null;
    booking.rejectedByUserId = user.id;
    booking.rejectedAt = new Date().toISOString();
    result = { bookingId };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ bookingId: result.bookingId });
}
