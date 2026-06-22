import { fail, ok } from "@/lib/server/http";
import {
  findWorldCupLeague,
  getWorldCupLeagueId,
  getWorldCupOverview,
  sportsDbRequest,
  WORLD_CUP_API,
  WORLD_CUP_SEASON,
} from "@/lib/server/world-cup";

export const runtime = "nodejs";

function validId(value) {
  return /^\d+$/.test(value || "");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || "overview";
  const id = searchParams.get("id") || "";

  try {
    if (resource === "league") {
      return ok(await findWorldCupLeague());
    }

    if (resource === "overview") {
      return ok(await getWorldCupOverview());
    }

    const leagueId = await getWorldCupLeagueId();

    if (resource === "schedule") {
      return ok(
        await sportsDbRequest(
          WORLD_CUP_API.schedule.fullSeason(leagueId, WORLD_CUP_SEASON),
        ),
      );
    }
    if (resource === "next") {
      return ok(
        await sportsDbRequest(WORLD_CUP_API.schedule.nextMatches(leagueId), {
          revalidate: 60,
        }),
      );
    }
    if (resource === "past") {
      return ok(
        await sportsDbRequest(WORLD_CUP_API.schedule.pastMatches(leagueId), {
          revalidate: 60,
        }),
      );
    }
    if (resource === "teams") {
      return ok(
        await sportsDbRequest(WORLD_CUP_API.teams.listByLeague(leagueId)),
      );
    }
    if (resource === "live") {
      return ok(
        await sportsDbRequest(WORLD_CUP_API.livescores.byLeague(leagueId), {
          revalidate: 15,
        }),
      );
    }

    const detailResources = {
      team: WORLD_CUP_API.teams.details,
      squad: WORLD_CUP_API.teams.squad,
      match: WORLD_CUP_API.matchDetails.summary,
      lineup: WORLD_CUP_API.matchDetails.lineup,
      statistics: WORLD_CUP_API.matchDetails.statistics,
      timeline: WORLD_CUP_API.matchDetails.timeline,
      highlights: WORLD_CUP_API.matchDetails.highlights,
    };
    const buildUrl = detailResources[resource];

    if (buildUrl) {
      if (!validId(id)) return fail(`A numeric id is required for ${resource}`);
      return ok(
        await sportsDbRequest(buildUrl(id), {
          revalidate: resource === "team" || resource === "squad" ? 3600 : 60,
        }),
      );
    }

    return fail("Unknown World Cup resource", 400, {
      resources: [
        "overview",
        "league",
        "schedule",
        "next",
        "past",
        "teams",
        "live",
        "team",
        "squad",
        "match",
        "lineup",
        "statistics",
        "timeline",
        "highlights",
      ],
    });
  } catch (error) {
    const configurationError =
      error.message === "THESPORTSDB_API_KEY is not configured";
    return fail(
      configurationError
        ? `${error.message}. Add it to your environment and restart the app.`
        : "World Cup data is currently unavailable",
      configurationError ? 503 : 502,
      configurationError ? undefined : error.message,
    );
  }
}
