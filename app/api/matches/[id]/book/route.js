import { randomUUID } from "node:crypto";

import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import { canBookMatch } from "@/lib/server/roles";

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  if (!canBookMatch(user.role)) return fail("Only players can book match slots", 403);

  const body = await parseJson(request);
  const slotRole = String(body?.slotRole || "Any role").trim();
  const paymentReference = String(body?.paymentReference || "").trim();
  if (!paymentReference) {
    return fail("Enter the UPI transaction reference after payment");
  }
  let booking;

  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      booking = { error: "Match not found" };
      return db;
    }

    const pendingOrConfirmed = db.bookings.filter(
      (candidate) => candidate.matchId === match.id && (candidate.status === "pending" || candidate.status === "confirmed")
    ).length;
    if (pendingOrConfirmed >= match.capacity) {
      booking = { error: "Match is full" };
      return db;
    }

    const duplicate = db.bookings.some(
      (candidate) => candidate.matchId === match.id && candidate.userId === user.id && (candidate.status === "pending" || candidate.status === "confirmed")
    );
    if (duplicate) {
      booking = { error: "You already booked this match" };
      return db;
    }

    booking = {
      id: `bok_${randomUUID()}`,
      matchId: match.id,
      userId: user.id,
      slotRole,
      status: "pending",
      paymentStatus: "paid_pending_verification",
      paymentReference,
      createdAt: new Date().toISOString(),
    };

    db.bookings.push(booking);
    return db;
  });

  if (booking?.error) return fail(booking.error, booking.error === "Match not found" ? 404 : 409);
  return ok({ booking }, { status: 201 });
}
