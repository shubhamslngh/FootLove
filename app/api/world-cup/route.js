import { fail, ok } from "@/lib/server/http";
import {
  getWorldCupGames,
  getWorldCupGroups,
  getWorldCupOverview,
  getWorldCupTeams,
} from "@/lib/server/world-cup";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || "overview";

  try {
    if (resource === "overview") {
      return ok(await getWorldCupOverview());
    }
    if (resource === "games") {
      return ok({ games: await getWorldCupGames() });
    }
    if (resource === "teams") {
      return ok({ teams: await getWorldCupTeams() });
    }
    if (resource === "groups") {
      return ok({ groups: await getWorldCupGroups() });
    }

    return fail("Unknown World Cup resource", 400, {
      resources: ["overview", "games", "teams", "groups"],
    });
  } catch (error) {
    return fail(
      "World Cup data is currently unavailable",
      502,
      error.message,
    );
  }
}
