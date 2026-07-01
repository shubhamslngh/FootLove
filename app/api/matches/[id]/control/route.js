import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import { canManagePlatform } from "@/lib/server/roles";

function canControl(user, match) {
  return canManagePlatform(user.role) || match.hostUserId === user.id;
}

function freezeTimer(match) {
  if (match.timerRunning && match.timerStartedAt) {
    match.elapsedSeconds =
      Number(match.elapsedSeconds || 0) +
      Math.floor(
        (Date.now() - new Date(match.timerStartedAt).getTime()) / 1000,
      );
  }
  match.timerRunning = false;
  match.timerStartedAt = null;
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  const body = await parseJson(request);
  const action = String(body?.action || "");
  let result;

  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (!canControl(user, match)) {
      result = { error: "Only this match host can control play", status: 403 };
      return db;
    }
    if (
      match.status !== "live" &&
      !(canManagePlatform(user.role) && match.status === "completed" && action === "undo")
    ) {
      result = { error: "Match is not live", status: 409 };
      return db;
    }

    match.events ??= [];
    if (action === "pause") {
      freezeTimer(match);
    } else if (action === "resume") {
      if (!match.timerRunning) {
        match.timerRunning = true;
        match.timerStartedAt = new Date().toISOString();
      }
    } else if (action === "half_time") {
      freezeTimer(match);
      match.phase = "half_time";
      match.events.push({
        id: `evt_${Date.now()}`,
        type: "half_time",
        label: "Half time",
        elapsedSeconds: match.elapsedSeconds,
        createdAt: new Date().toISOString(),
      });
    } else if (action === "second_half") {
      match.phase = "second_half";
      match.timerRunning = true;
      match.timerStartedAt = new Date().toISOString();
      match.events.push({
        id: `evt_${Date.now()}`,
        type: "second_half",
        label: "Second half started",
        elapsedSeconds: match.elapsedSeconds,
        createdAt: new Date().toISOString(),
      });
    } else if (action === "timeout") {
      const team = body?.team === "away" ? "away" : "home";
      const field = team === "home" ? "homeTimeouts" : "awayTimeouts";
      match[field] = Number(match[field] || 0) + 1;
      match.events.push({
        id: `evt_${Date.now()}`,
        type: "timeout",
        team,
        label: `Time-out: ${team === "home" ? match.homeTeam : match.awayTeam}`,
        elapsedSeconds: Number(match.elapsedSeconds || 0),
        createdAt: new Date().toISOString(),
      });
    } else if (action === "undo") {
      const eventIndex = [...match.events]
        .reverse()
        .findIndex((event) => event.type === "goal");
      if (eventIndex < 0) {
        result = { error: "No goal to undo", status: 409 };
        return db;
      }
      const actualIndex = match.events.length - 1 - eventIndex;
      const event = match.events[actualIndex];
      const field = event.team === "home" ? "homeScore" : "awayScore";
      match[field] = Math.max(0, Number(match[field] || 0) - 1);
      match.events.splice(actualIndex, 1);
    } else {
      result = { error: "Invalid match control", status: 400 };
      return db;
    }

    result = { match };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ match: result.match });
}
