import crypto from "node:crypto";

import { publicUser, updateDb } from "@/lib/server/db";
import { setSessionCookie } from "@/lib/server/auth";
import { fail, ok, parseJson } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/server/phone";
import { ROLES } from "@/lib/server/roles";

function createUserId() {
  return `usr_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

export async function POST(request) {
  const body = await parseJson(request);
  const name = String(body?.name || "").trim();
  const username = String(body?.username || "").trim().toLowerCase();
  const phone = normalizeIndianPhone(body?.phone);
  const pin = String(body?.pin || "");
  const requestedRole = String(body?.role || ROLES.PLAYER).trim();
  const upiId = String(body?.upiId || "").trim();
  const upiPayeeName = String(body?.upiPayeeName || "").trim();
  const paymentQrDataUrl = String(body?.paymentQrDataUrl || "").trim();

  if (!name || !username || !phone || !pin) {
    return fail("Name, username, phone, and PIN are required");
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return fail("Username must be 3-20 characters using lowercase letters, numbers, or underscores");
  }
  if (!isValidIndianPhone(phone)) return fail("Enter a valid 10-digit Indian mobile number");
  if (!/^\d{6}$/.test(pin)) return fail("PIN must be exactly 6 digits");
  if (![ROLES.PLAYER, ROLES.MANAGER].includes(requestedRole)) return fail("You can only create a player or manager account from signup");
  if (
    requestedRole === ROLES.MANAGER &&
    (!upiId || !upiPayeeName || !paymentQrDataUrl)
  ) {
    return fail("Managers must provide a UPI ID, payee name, and payment QR code");
  }
  if (
    requestedRole === ROLES.MANAGER &&
    !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{2,64}$/.test(upiId)
  ) {
    return fail("Enter a valid UPI ID, for example manager@upi");
  }
  if (
    requestedRole === ROLES.MANAGER &&
    !paymentQrDataUrl.startsWith("data:image/")
  ) {
    return fail("Upload a valid payment QR image");
  }

  let createdUser = null;
  let conflict = "";

  await updateDb((db) => {
    const phoneTaken = db.users.some((candidate) => normalizeIndianPhone(candidate.phone) === phone);
    if (phoneTaken) {
      conflict = "phone";
      return db;
    }
    const usernameTaken = db.users.some(
      (candidate) =>
        String(candidate.username || "").toLowerCase() === username,
    );
    if (usernameTaken) {
      conflict = "username";
      return db;
    }

    createdUser = {
      id: createUserId(),
      name,
      username,
      phone,
      role: requestedRole,
      passwordHash: hashPassword(pin),
      ...(requestedRole === ROLES.MANAGER
        ? {
            paymentMethod: {
              upiId,
              payeeName: upiPayeeName,
              qrCodeDataUrl: paymentQrDataUrl,
            },
            hostVerificationStatus: "pending",
            hostVerificationSubmittedAt: new Date().toISOString(),
          }
        : {}),
      createdAt: new Date().toISOString(),
    };
    db.users.push(createdUser);
    return db;
  });

  if (!createdUser) {
    return fail(
      conflict === "username"
        ? "This username is already taken"
        : "An account with this phone number already exists",
      409,
    );
  }

  await setSessionCookie(createdUser);
  return ok({ user: publicUser(createdUser) }, { status: 201 });
}
