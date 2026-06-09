import { randomUUID } from "node:crypto";

import { getCurrentUser } from "@/lib/server/auth";
import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson } from "@/lib/server/http";
import { canBookMatch } from "@/lib/server/roles";

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (user && !canBookMatch(user.role)) {
    return fail("Only players can book match slots", 403);
  }

  const body = await parseJson(request);
  const slotRole = String(body?.slotRole || "Any role").trim();
  const paymentReference = String(body?.paymentReference || "").trim();
  const guestName = String(body?.guestName || "").trim();
  if (!user && guestName.length < 2) {
    return fail("Enter your name to book as a guest");
  }
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

    if (user) {
      const duplicate = db.bookings.some(
        (candidate) => candidate.matchId === match.id && candidate.userId === user.id && (candidate.status === "pending" || candidate.status === "confirmed")
      );
      if (duplicate) {
        booking = { error: "You already booked this match" };
        return db;
      }
    }

    booking = {
      id: `bok_${randomUUID()}`,
      matchId: match.id,
      ...(user ? { userId: user.id } : { guestName }),
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
