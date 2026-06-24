import { randomUUID } from "node:crypto";

import { publicUser, readDb, updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import {
  isValidIndianPhone,
  normalizeIndianPhone,
} from "@/lib/server/phone";
import { canManagePlatform } from "@/lib/server/roles";

function canControlMatch(user, match) {
  return canManagePlatform(user.role) || match.hostUserId === user.id;
}

function createOfflineUsername(name, existingUsernames) {
  const base =
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 12) || "player";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(10 + Math.random() * 90);
    const username = `${base}${suffix}`.slice(0, 20);
    if (!existingUsernames.has(username)) return username;
  }

  return `${base}${randomUUID().replaceAll("-", "").slice(0, 4)}`.slice(0, 20);
}

export async function POST(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await parseJson(request);
  let name = String(body?.name || "").trim().replace(/\s+/g, " ");
  const phone = normalizeIndianPhone(body?.phone);
  const team = body?.team === "away" ? "away" : "home";

  if (!isValidIndianPhone(phone)) {
    return fail("Enter a valid 10-digit mobile number");
  }

  let result;
  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (!canControlMatch(user, match)) {
      result = {
        error: "Only this match host can add offline players",
        status: 403,
      };
      return db;
    }
    if (!["open", "live"].includes(match.status)) {
      result = {
        error: "Players cannot be added to this match now",
        status: 409,
      };
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

    const registeredPlayer = db.users.find(
      (candidate) => normalizeIndianPhone(candidate.phone) === phone,
    );
    if (registeredPlayer) {
      const duplicateUser = db.bookings.some(
        (booking) =>
          booking.matchId === match.id &&
          booking.userId === registeredPlayer.id &&
          ["pending", "confirmed"].includes(booking.status),
      );
      if (duplicateUser) {
        result = {
          error: "This registered player is already added to the match",
          status: 409,
        };
        return db;
      }

      const booking = {
        id: `bok_${randomUUID()}`,
        matchId: match.id,
        userId: registeredPlayer.id,
        team,
        slotRole: "Added by host",
        status: "confirmed",
        paymentStatus: "host_added",
        confirmedByUserId: user.id,
        confirmedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      db.bookings.push(booking);
      match.booked = Number(match.booked || 0) + 1;
      result = { booking, player: publicUser(registeredPlayer) };
      return db;
    }

    const knownGuest = [...db.bookings]
      .reverse()
      .find(
        (booking) =>
          normalizeIndianPhone(booking.guestPhone) === phone &&
          String(booking.guestName || "").trim(),
      );
    name = knownGuest?.guestName || name;
    if (name.length < 2) {
      result = { error: "Enter the offline player's name", status: 400 };
      return db;
    }

    const duplicateOfflinePhone = db.bookings.some(
      (booking) =>
        booking.matchId === match.id &&
        booking.guestPhone === phone &&
        ["pending", "confirmed"].includes(booking.status),
    );
    if (duplicateOfflinePhone) {
      result = {
        error: "An offline player with this mobile number is already added",
        status: 409,
      };
      return db;
    }

    const existingUsernames = new Set([
      ...db.users.map((candidate) => candidate.username).filter(Boolean),
      ...db.bookings
        .map((booking) => booking.guestUsername)
        .filter(Boolean),
    ]);
    const booking = {
      id: `bok_${randomUUID()}`,
      matchId: match.id,
      guestName: name,
      guestPhone: phone,
      guestUsername: createOfflineUsername(name, existingUsernames),
      team,
      slotRole: "Offline player",
      status: "confirmed",
      paymentStatus: "offline_added",
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
  return ok(
    { booking: result.booking, player: result.player || null },
    { status: 201 },
  );
}

export async function GET(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const phone = normalizeIndianPhone(searchParams.get("phone"));
  if (!isValidIndianPhone(phone)) {
    return fail("Enter a valid 10-digit mobile number");
  }

  const db = await readDb();
  const match = db.matches.find((candidate) => candidate.id === id);
  if (!match) return fail("Match not found", 404);
  if (!canControlMatch(user, match)) {
    return fail("Only this match host can look up players", 403);
  }

  const registeredPlayer = db.users.find(
    (candidate) => normalizeIndianPhone(candidate.phone) === phone,
  );
  if (!registeredPlayer) {
    const guestBooking = [...db.bookings]
      .reverse()
      .find(
        (booking) =>
          normalizeIndianPhone(booking.guestPhone) === phone &&
          String(booking.guestName || "").trim(),
      );
    if (!guestBooking) return ok({ found: false });

    const existingBooking = db.bookings.find(
      (booking) =>
        booking.matchId === match.id &&
        normalizeIndianPhone(booking.guestPhone) === phone &&
        ["pending", "confirmed"].includes(booking.status),
    );
    return ok({
      found: true,
      guest: true,
      alreadyAdded: Boolean(existingBooking),
      player: {
        name: guestBooking.guestName,
        username: guestBooking.guestUsername || null,
        phone,
        role: "guest",
      },
    });
  }

  const existingBooking = db.bookings.find(
    (booking) =>
      booking.matchId === match.id &&
      booking.userId === registeredPlayer.id &&
      ["pending", "confirmed"].includes(booking.status),
  );

  return ok({
    found: true,
    alreadyAdded: Boolean(existingBooking),
    player: publicUser(registeredPlayer),
  });
}
