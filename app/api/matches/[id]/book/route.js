import { randomUUID } from "node:crypto";

import { getCurrentUser } from "@/lib/server/auth";
import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson } from "@/lib/server/http";
import {
  isValidIndianPhone,
  normalizeIndianPhone,
} from "@/lib/server/phone";
import { canBookMatch } from "@/lib/server/roles";
import { canAcceptBookings } from "@/lib/match-state";

export async function POST(request, { params }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (user && !canBookMatch(user.role)) {
    return fail("Only players can book match slots", 403);
  }

  const body = await parseJson(request);
  const slotRole = String(body?.slotRole || "Any role").trim();
  const paymentReference = String(body?.paymentReference || "").trim();
  let guestName = String(body?.guestName || "").trim().replace(/\s+/g, " ");
  const guestPhone = normalizeIndianPhone(body?.guestPhone);
  if (!user && !isValidIndianPhone(guestPhone)) {
    return fail("Enter a valid 10-digit mobile number");
  }
  let booking;

  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      booking = { error: "Match not found" };
      return db;
    }
    if (!canAcceptBookings(match)) {
      booking = {
        error:
          match.status === "completed"
            ? "This match is already completed"
            : "Booking is closed for this match",
      };
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
    } else {
      const registeredUser = db.users.find(
        (candidate) => normalizeIndianPhone(candidate.phone) === guestPhone,
      );
      if (registeredUser) {
        booking = {
          error: "This mobile number has an account. Log in to book this match",
        };
        return db;
      }

      const knownGuest = [...db.bookings]
        .reverse()
        .find(
          (candidate) =>
            normalizeIndianPhone(candidate.guestPhone) === guestPhone &&
            String(candidate.guestName || "").trim(),
        );
      guestName = knownGuest?.guestName || guestName;
      if (guestName.length < 2) {
        booking = { error: "Enter your name to book as a guest" };
        return db;
      }

      const duplicate = db.bookings.some(
        (candidate) =>
          candidate.matchId === match.id &&
          normalizeIndianPhone(candidate.guestPhone) === guestPhone &&
          ["pending", "confirmed"].includes(candidate.status),
      );
      if (duplicate) {
        booking = { error: "This mobile number already booked this match" };
        return db;
      }
    }

    booking = {
      id: `bok_${randomUUID()}`,
      matchId: match.id,
      ...(user ? { userId: user.id } : { guestName, guestPhone }),
      slotRole,
      status: "pending",
      paymentStatus: "payment_claimed",
      ...(paymentReference ? { paymentReference } : {}),
      createdAt: new Date().toISOString(),
    };

    db.bookings.push(booking);
    return db;
  });

  if (booking?.error) return fail(booking.error, booking.error === "Match not found" ? 404 : 409);
  return ok({ booking }, { status: 201 });
}
