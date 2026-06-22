const BASE_URL = "https://www.thesportsdb.com/api/v2/json";
const WORLD_CUP_SEASON = "2026";
const DEFAULT_LEAGUE_SEARCH = "fifa_world_cup";

export const WORLD_CUP_API = {
  search: {
    league: (leagueName = DEFAULT_LEAGUE_SEARCH) =>
      `${BASE_URL}/search/league/${encodeURIComponent(leagueName)}`,
    team: (teamName) =>
      `${BASE_URL}/search/team/${encodeURIComponent(teamName)}`,
    event: (eventQuery) =>
      `${BASE_URL}/search/event/${encodeURIComponent(eventQuery)}`,
  },
  schedule: {
    fullSeason: (leagueId, season = WORLD_CUP_SEASON) =>
      `${BASE_URL}/schedule/league/${leagueId}/${encodeURIComponent(season)}`,
    nextMatches: (leagueId) => `${BASE_URL}/schedule/next/league/${leagueId}`,
    pastMatches: (leagueId) =>
      `${BASE_URL}/schedule/previous/league/${leagueId}`,
  },
  teams: {
    listByLeague: (leagueId) => `${BASE_URL}/list/teams/${leagueId}`,
    details: (teamId) => `${BASE_URL}/lookup/team/${teamId}`,
    squad: (teamId) => `${BASE_URL}/list/players/${teamId}`,
  },
  matchDetails: {
    summary: (eventId) => `${BASE_URL}/lookup/event/${eventId}`,
    lineup: (eventId) => `${BASE_URL}/lookup/event_lineup/${eventId}`,
    statistics: (eventId) => `${BASE_URL}/lookup/event_stats/${eventId}`,
    timeline: (eventId) => `${BASE_URL}/lookup/event_timeline/${eventId}`,
    highlights: (eventId) =>
      `${BASE_URL}/lookup/event_highlights/${eventId}`,
  },
  livescores: {
    byLeague: (leagueId) => `${BASE_URL}/livescore/${leagueId}`,
    allSoccer: () => `${BASE_URL}/livescore/soccer`,
  },
};

function getApiKey() {
  const apiKey = process.env.THESPORTSDB_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("THESPORTSDB_API_KEY is not configured");
  }
  return apiKey;
}

function findList(payload, keys) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

export async function sportsDbRequest(url, { revalidate = 900 } = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-API-KEY": getApiKey(),
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`TheSportsDB request failed with status ${response.status}`);
  }

  return response.json();
}

export async function findWorldCupLeague() {
  const payload = await sportsDbRequest(WORLD_CUP_API.search.league());
  const leagues = findList(payload, ["leagues", "league"]);
  const league =
    leagues.find((candidate) => String(candidate.strSport).toLowerCase() === "soccer") ||
    leagues[0] ||
    null;

  return { league, leagues };
}

export async function getWorldCupLeagueId() {
  const configuredId = process.env.THESPORTSDB_WORLD_CUP_LEAGUE_ID?.trim();
  if (configuredId) return configuredId;

  const { league } = await findWorldCupLeague();
  const leagueId = league?.idLeague || league?.id;
  if (!leagueId) {
    throw new Error("The FIFA World Cup league could not be found");
  }
  return String(leagueId);
}

export async function getWorldCupOverview() {
  const leagueId = await getWorldCupLeagueId();
  const [schedulePayload, teamsPayload] = await Promise.all([
    sportsDbRequest(WORLD_CUP_API.schedule.fullSeason(leagueId)),
    sportsDbRequest(WORLD_CUP_API.teams.listByLeague(leagueId)),
  ]);

  return {
    leagueId,
    season: WORLD_CUP_SEASON,
    events: findList(schedulePayload, ["events", "schedule"]),
    teams: findList(teamsPayload, ["teams"]),
  };
}

export { WORLD_CUP_SEASON };
