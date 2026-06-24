const INDIA_TIME_ZONE = "Asia/Kolkata";

function getIndiaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function getMatchState(match, now = new Date()) {
  if (match?.status === "completed") return "completed";
  if (String(match?.date || "") < getIndiaDate(now)) return "expired";
  if (match?.status === "open") return "active";
  return "inactive";
}

export function canAcceptBookings(match, now = new Date()) {
  return getMatchState(match, now) === "active";
}

export function isMatchScheduledToday(match, now = new Date()) {
  return String(match?.date || "") === getIndiaDate(now);
}

export function isPastOrCompletedMatch(match, now = new Date()) {
  const state = getMatchState(match, now);
  return state === "completed" || state === "expired";
}
