import { readDb } from "@/lib/server/db";
import { fail, ok } from "@/lib/server/http";

export async function GET() {
  try {
    const db = await readDb();
    return ok({
      status: "healthy",
      database:
        process.env.DATABASE_MODE === "file" || !process.env.DATABASE_URL
          ? "file"
          : "mysql",
      counts: {
        users: db.users.length,
        venues: db.venues.length,
        matches: db.matches.length,
      },
    });
  } catch (error) {
    console.error("Health check failed", error);
    return fail("Database connection failed", 503);
  }
}
