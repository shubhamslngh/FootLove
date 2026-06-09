import { updateDb, withVenue } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import { canManagePlatform, ROLES } from "@/lib/server/roles";

function canManageMatch(user, match) {
  return canManagePlatform(user.role) || match.hostUserId === user.id;
}

function toPositiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function isValidUpiId(value) {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{2,64}$/.test(value);
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const body = await parseJson(request);
  let result;

  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (!canManageMatch(user, match)) {
      result = { error: "Only the match host or an admin can edit this match", status: 403 };
      return db;
    }

    const venueId = String(body?.venueId || "").trim();
    const venue = db.venues.find((candidate) => candidate.id === venueId);
    const format = String(body?.format || match.format || "7v7");
    const playersPerSide = Number(format.split("v")[0]);
    const capacity = Number.isInteger(playersPerSide) && playersPerSide > 0
      ? playersPerSide * 2
      : match.capacity;
    const approvedPaymentMethod =
      user.role === ROLES.MANAGER ? user.paymentMethod : null;
    const upiId = String(
      approvedPaymentMethod?.upiId || body?.upiId || match.upiId || "",
    ).trim();
    const title = String(body?.title || "").trim();
    const homeTeam = String(body?.homeTeam || "").trim();
    const awayTeam = String(body?.awayTeam || "").trim();
    const date = String(body?.date || "").trim();
    const time = String(body?.time || "").trim();
    const price = toPositiveNumber(body?.price);

    if (!title || !homeTeam || !awayTeam || !venue || !date || !time || !price || !upiId) {
      result = { error: "Title, both team names, venue, date, time, price, and UPI ID are required", status: 400 };
      return db;
    }
    if (venue.status && venue.status !== "approved") {
      result = { error: "Selected venue is waiting for admin approval", status: 409 };
      return db;
    }
    if (!isValidUpiId(upiId)) {
      result = { error: "Enter a valid UPI ID, for example manager@upi", status: 400 };
      return db;
    }
    if (capacity < Number(match.booked || 0)) {
      result = { error: "The selected format has fewer slots than the confirmed players", status: 409 };
      return db;
    }

    Object.assign(match, {
      title,
      homeTeam,
      awayTeam,
      venueId,
      date,
      time,
      format,
      level: String(body?.level || "Open"),
      capacity,
      price,
      upiId,
      upiPayeeName: String(
        approvedPaymentMethod?.payeeName || body?.upiPayeeName || match.upiPayeeName || user.name,
      ).trim(),
      paymentLink: String(body?.paymentLink || "").trim(),
      qrCodeDataUrl: String(
        body?.qrCodeDataUrl ||
          approvedPaymentMethod?.qrCodeDataUrl ||
          match.qrCodeDataUrl ||
          "",
      ).trim(),
      slotRoles: String(body?.slotRoles || "Any role")
        .split(",")
        .map((slot) => slot.trim())
        .filter(Boolean),
      notes: String(body?.notes || "").trim(),
      updatedAt: new Date().toISOString(),
    });

    result = { match: withVenue(match, db.venues) };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ match: result.match });
}

export async function DELETE(_request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  let result;

  await updateDb((db) => {
    const match = db.matches.find((candidate) => candidate.id === id);
    if (!match) {
      result = { error: "Match not found", status: 404 };
      return db;
    }
    if (!canManageMatch(user, match)) {
      result = { error: "Only the match host or an admin can delete this match", status: 403 };
      return db;
    }

    db.matches = db.matches.filter((candidate) => candidate.id !== id);
    db.bookings = db.bookings.filter((booking) => booking.matchId !== id);
    result = { deletedId: id };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok(result);
}
