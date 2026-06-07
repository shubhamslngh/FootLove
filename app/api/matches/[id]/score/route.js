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
  const team = String(body?.team || "");
  const change = Number(body?.change);
  const finish = Boolean(body?.finish);
  const scorerBookingId = String(body?.scorerBookingId || "");
  const assistBookingId = String(body?.assistBookingId || "");
  const goalType = String(body?.goalType || "normal");
  let result;

  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (!canControlMatch(user, match)) {
      result = { error: "Only this match host can update scoring", status: 403 };
      return db;
    }
    if (match.status !== "live") {
      result = { error: "Kick off the match before updating scores", status: 409 };
      return db;
    }

    if (finish) {
      if (match.timerRunning && match.timerStartedAt) {
        match.elapsedSeconds =
          Number(match.elapsedSeconds || 0) +
          Math.floor(
            (Date.now() - new Date(match.timerStartedAt).getTime()) / 1000,
          );
      }
      match.timerRunning = false;
      match.timerStartedAt = null;
      match.status = "completed";
      match.phase = "full_time";
      match.completedAt = new Date().toISOString();
      match.events ??= [];
      match.events.push({
        id: `evt_${Date.now()}`,
        type: "full_time",
        label: "Full time",
        elapsedSeconds: match.elapsedSeconds,
        createdAt: match.completedAt,
      });
      result = { match };
      return db;
    }

    if (
      !["home", "away"].includes(team) ||
      ![-1, 1].includes(change) ||
      (change === 1 &&
        !["normal", "free_kick", "corner", "own_goal", "penalty"].includes(
          goalType,
        ))
    ) {
      result = { error: "Invalid score update", status: 400 };
      return db;
    }

    const scorerBooking = db.bookings.find(
      (booking) =>
        booking.id === scorerBookingId &&
        booking.matchId === id &&
        booking.status === "confirmed",
    );
    if (change === 1 && !scorerBooking) {
      result = { error: "Select a confirmed player as scorer", status: 400 };
      return db;
    }
    const assistBooking = assistBookingId
      ? db.bookings.find(
          (booking) =>
            booking.id === assistBookingId &&
            booking.matchId === id &&
            booking.status === "confirmed",
        )
      : null;
    if (assistBookingId && !assistBooking) {
      result = { error: "Selected assist player is invalid", status: 400 };
      return db;
    }
    if (assistBookingId && assistBookingId === scorerBookingId) {
      result = { error: "Scorer cannot assist their own goal", status: 400 };
      return db;
    }

    const creditedTeam =
      goalType === "own_goal"
        ? team === "home"
          ? "away"
          : "home"
        : team;
    const field = creditedTeam === "home" ? "homeScore" : "awayScore";
    match[field] = Math.max(0, Number(match[field] || 0) + change);
    const elapsedSeconds =
      Number(match.elapsedSeconds || 0) +
      (match.timerRunning && match.timerStartedAt
        ? Math.floor(
            (Date.now() - new Date(match.timerStartedAt).getTime()) / 1000,
          )
        : 0);
    match.events ??= [];
    const scorer = scorerBooking
      ? db.users.find((candidate) => candidate.id === scorerBooking.userId)
      : null;
    const assist = assistBooking
      ? db.users.find((candidate) => candidate.id === assistBooking.userId)
      : null;
    match.events.push({
      id: `evt_${Date.now()}`,
      type: change > 0 ? "goal" : "score_correction",
      team: creditedTeam,
      change,
      goalType,
      scorerBookingId: scorerBooking?.id || null,
      scorerUserId: scorer?.id || null,
      scorerName: scorer?.username || scorer?.name || null,
      assistBookingId: assistBooking?.id || null,
      assistUserId: assist?.id || null,
      assistName: assist?.username || assist?.name || null,
      label:
        change > 0
          ? `${goalType === "own_goal" ? "Own goal" : "Goal"} by @${scorer?.username || scorer?.name || "player"}${assist ? `, assisted by @${assist.username || assist.name}` : ""}`
          : `Score corrected for ${team === "home" ? match.homeTeam : match.awayTeam}`,
      elapsedSeconds,
      createdAt: new Date().toISOString(),
    });
    result = { match };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ match: result.match });
}
