const BASE_URL = "https://worldcup26.ir/get";

export const WORLD_CUP_API = {
  games: `${BASE_URL}/games`,
  teams: `${BASE_URL}/teams`,
  groups: `${BASE_URL}/groups`,
};

async function worldCupRequest(url, { revalidate = 900 } = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`World Cup API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getWorldCupGames() {
  const payload = await worldCupRequest(WORLD_CUP_API.games, { revalidate: 60 });
  return Array.isArray(payload?.games) ? payload.games : [];
}

export async function getWorldCupTeams() {
  const payload = await worldCupRequest(WORLD_CUP_API.teams, { revalidate: 3600 });
  return Array.isArray(payload?.teams) ? payload.teams : [];
}

export async function getWorldCupGroups() {
  const payload = await worldCupRequest(WORLD_CUP_API.groups, { revalidate: 300 });
  return Array.isArray(payload?.groups) ? payload.groups : [];
}

export async function getWorldCupOverview() {
  const [games, teams, groups] = await Promise.all([
    getWorldCupGames(),
    getWorldCupTeams(),
    getWorldCupGroups(),
  ]);

  return {
    games,
    teams,
    groups,
  };
}

export { worldCupRequest };
