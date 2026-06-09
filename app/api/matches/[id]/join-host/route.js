import { randomUUID } from "node:crypto";

import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import { canManagePlatform } from "@/lib/server/roles";

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await parseJson(request);
  const slotRole = String(body?.slotRole || "Any role").trim();
  let result;

  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (
      match.hostUserId !== user.id &&
      !canManagePlatform(user.role)
    ) {
      result = {
        error: "Only the match host or an admin can join directly",
        status: 403,
      };
      return db;
    }
    if (match.status !== "open") {
      result = { error: "You can only join an open match", status: 409 };
      return db;
    }
    if (
      db.bookings.some(
        (booking) =>
          booking.matchId === match.id && booking.userId === user.id,
      )
    ) {
      result = { error: "You are already in this match", status: 409 };
      return db;
    }
    const reservedSlots = db.bookings.filter(
      (booking) =>
        booking.matchId === match.id &&
        ["pending", "confirmed"].includes(booking.status),
    ).length;
    if (reservedSlots >= Number(match.capacity || 0)) {
      result = { error: "Match is full", status: 409 };
      return db;
    }

    const booking = {
      id: `bok_${randomUUID()}`,
      matchId: match.id,
      userId: user.id,
      slotRole,
      status: "confirmed",
      paymentStatus: "host_waived",
      confirmedByUserId: user.id,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.bookings.push(booking);
    match.booked = Number(match.booked || 0) + 1;
    result = { booking };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ booking: result.booking }, { status: 201 });
}
