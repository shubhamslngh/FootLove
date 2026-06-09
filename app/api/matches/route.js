import { randomUUID } from "node:crypto";

import { readDb, updateDb, withVenue } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import { canHostMatch, ROLES } from "@/lib/server/roles";

function toPositiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function isValidUpiId(value) {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{2,64}$/.test(value);
}

export async function GET() {
  const db = await readDb();
  const matches = db.matches.map((match) => withVenue(match, db.venues));
  return ok({ matches });
}

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!canHostMatch(user)) return fail("Your manager payment method must be approved before you can host matches", 403);

  const body = await parseJson(request);
  const title = String(body?.title || "").trim();
  const homeTeam = String(body?.homeTeam || "").trim();
  const awayTeam = String(body?.awayTeam || "").trim();
  const venueId = String(body?.venueId || "").trim();
  const date = String(body?.date || "").trim();
  const time = String(body?.time || "").trim();
  const format = String(body?.format || "7v7");
  const playersPerSide = Number(format.split("v")[0]);
  const capacity =
    Number.isInteger(playersPerSide) && playersPerSide > 0
      ? playersPerSide * 2
      : 14;
  const price = toPositiveNumber(body?.price);
  const approvedPaymentMethod =
    user.role === ROLES.MANAGER ? user.paymentMethod : null;
  const upiId = String(
    approvedPaymentMethod?.upiId || body?.upiId || "",
  ).trim();
  const upiPayeeName = String(
    approvedPaymentMethod?.payeeName ||
      body?.upiPayeeName ||
      user.name ||
      "Match manager",
  ).trim();
  const paymentLink = String(body?.paymentLink || "").trim();
  const qrCodeDataUrl = String(
    body?.qrCodeDataUrl || approvedPaymentMethod?.qrCodeDataUrl || "",
  ).trim();

  if (!title || !homeTeam || !awayTeam || !venueId || !date || !time || !capacity || !price || !upiId) {
    return fail("Title, both team names, venue, date, time, price, and UPI ID are required");
  }
  if (!isValidUpiId(upiId)) return fail("Enter a valid UPI ID, for example manager@upi");

  const db = await readDb();
  const selectedVenue = db.venues.find((venue) => venue.id === venueId);
  if (!selectedVenue) return fail("Selected venue does not exist");
  if (selectedVenue.status && selectedVenue.status !== "approved") {
    return fail("Selected venue is waiting for admin approval", 409);
  }

  const match = {
    id: `mat_${randomUUID()}`,
    title,
    homeTeam,
    awayTeam,
    format,
    level: String(body?.level || "Open"),
    date,
    time,
    price,
    capacity,
    booked: 0,
    status: "open",
    venueId,
    upiId,
    upiPayeeName,
    paymentLink,
    qrCodeDataUrl,
    slotRoles: String(body?.slotRoles || "Any role").split(",").map((slot) => slot.trim()).filter(Boolean),
    notes: String(body?.notes || "").trim(),
    hostUserId: user.id,
    createdAt: new Date().toISOString(),
  };

  await updateDb((currentDb) => {
    currentDb.matches.push(match);
    return currentDb;
  });

  return ok({ match: withVenue(match, db.venues) }, { status: 201 });
}
