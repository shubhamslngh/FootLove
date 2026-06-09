import { updateDb } from "@/lib/server/db";
import { fail, ok, requireUser } from "@/lib/server/http";
import { canHostMatch } from "@/lib/server/roles";
import { randomUUID } from "node:crypto";

export async function POST(_request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  if (!canHostMatch(user)) return fail("Only verified hosts and admins can reject bookings", 403);

  let result;
  await updateDb((db) => {
    const booking = db.bookings.find((candidate) => candidate.id === id);
    if (!booking) {
      result = { error: "Booking not found", status: 404 };
      return db;
    }
    if (booking.status !== "pending") {
      result = { error: "Only pending bookings can be rejected", status: 409 };
      return db;
    }
    booking.status = "rejected";
    booking.rejectedByUserId = user.id;
    booking.rejectedAt = new Date().toISOString();
    const match = db.matches.find(
      (candidate) => candidate.id === booking.matchId,
    );
    if (booking.userId) {
      db.notifications ??= [];
      db.notifications.push({
        id: `not_${randomUUID()}`,
        userId: booking.userId,
        type: "booking_rejected",
        title: "Booking not confirmed",
        message: `Your request for ${match?.title || "the match"} was declined.`,
        matchId: booking.matchId,
        bookingId: booking.id,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
    result = { booking };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ booking: result.booking });
}
