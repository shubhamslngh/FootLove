import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import { canManagePlatform } from "@/lib/server/roles";

function canControlMatch(user, match) {
  return canManagePlatform(user.role) || match.hostUserId === user.id;
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await parseJson(request);
  const assignments = Array.isArray(body?.assignments)
    ? body.assignments
    : [];
  let result;

  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (!canControlMatch(user, match)) {
      result = { error: "Only this match host can start scoring", status: 403 };
      return db;
    }

    const confirmedBookings = db.bookings.filter(
      (booking) =>
        booking.matchId === id && booking.status === "confirmed",
    );
    const confirmedIds = new Set(
      confirmedBookings.map((booking) => booking.id),
    );
    const validAssignments = assignments.filter(
      (assignment) =>
        confirmedIds.has(assignment.bookingId) &&
        ["home", "away"].includes(assignment.team),
    );

    if (
      validAssignments.length !== confirmedBookings.length ||
      validAssignments.some(
        (assignment, index) =>
          validAssignments.findIndex(
            (candidate) => candidate.bookingId === assignment.bookingId,
          ) !== index,
      )
    ) {
      result = {
        error: "Assign every confirmed player to one team",
        status: 400,
      };
      return db;
    }

    validAssignments.forEach((assignment) => {
      const booking = confirmedBookings.find(
        (candidate) => candidate.id === assignment.bookingId,
      );
      booking.team = assignment.team;
    });

    match.status = "live";
    match.homeScore = Number(match.homeScore || 0);
    match.awayScore = Number(match.awayScore || 0);
    match.kickedOffAt = new Date().toISOString();
    match.phase = "first_half";
    match.timerRunning = true;
    match.timerStartedAt = match.kickedOffAt;
    match.elapsedSeconds = Number(match.elapsedSeconds || 0);
    match.homeTimeouts = Number(match.homeTimeouts || 0);
    match.awayTimeouts = Number(match.awayTimeouts || 0);
    match.events ??= [];
    match.events.push({
      id: `evt_${Date.now()}`,
      type: "kickoff",
      label: "Match kicked off",
      elapsedSeconds: match.elapsedSeconds,
      createdAt: match.kickedOffAt,
    });
    result = { match };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ match: result.match });
}
