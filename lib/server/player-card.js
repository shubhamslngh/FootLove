import { canHavePlayerCard, getEmptyPlayerStats } from "@/lib/player-card";
import { readDb } from "@/lib/server/db";
import { buildLeaderboard } from "@/lib/server/stats";

export async function getPublicPlayerCard(username) {
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const db = await readDb();
  const user = db.users.find(
    (candidate) =>
      canHavePlayerCard(candidate) &&
      String(candidate.username || "").toLowerCase() === normalizedUsername,
  );
  if (!user) return null;

  const stats =
    buildLeaderboard({
      matches: db.matches,
      bookings: db.bookings,
      users: db.users,
    }).find((row) => row.userId === user.id) || getEmptyPlayerStats(user);

  return {
    user: {
      name: user.name,
      username: user.username,
      profileImageDataUrl: user.profileImageDataUrl || "",
    },
    stats,
  };
}
