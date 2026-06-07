import { updateDb } from "@/lib/server/db";
import { fail, ok, requireUser } from "@/lib/server/http";
import { canManagePlatform } from "@/lib/server/roles";

export async function POST(_request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  if (!canManagePlatform(user.role)) return fail("Only admins can reject venues", 403);

  let result;
  await updateDb((db) => {
    const venue = db.venues.find((candidate) => candidate.id === id);
    if (!venue) {
      result = { error: "Venue not found", status: 404 };
      return db;
    }
    const now = new Date().toISOString();
    if (venue.status === "approved" || !venue.status) {
      venue.status = "inactive";
      venue.inactivatedByUserId = user.id;
      venue.inactivatedAt = now;
    } else {
      venue.status = "rejected";
      venue.rejectedByUserId = user.id;
      venue.rejectedAt = now;
    }
    result = { venue };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ venue: result.venue });
}
