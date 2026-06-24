import { getCurrentUser } from "@/lib/server/auth";
import { publicUser, updateDb } from "@/lib/server/db";
import { fail, ok, parseJson } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/server/phone";

export async function GET() {
  const user = await getCurrentUser();
  return ok({ user });
}

export async function PUT(request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return fail("Authentication required", 401);

  const body = await parseJson(request);
  const name = String(body?.name || "").trim();
  const username = String(body?.username || "").trim().toLowerCase();
  const phone = normalizeIndianPhone(body?.phone);
  const pin = String(body?.pin || "");
  const profileImageDataUrl = String(body?.profileImageDataUrl || "").trim();

  if (!name || !username || !phone) {
    return fail("Name, username, and mobile number are required");
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return fail("Username must use 3-20 lowercase letters, numbers, or underscores");
  }
  if (!isValidIndianPhone(phone)) {
    return fail("Enter a valid 10-digit Indian mobile number");
  }
  if (pin && !/^\d{6}$/.test(pin)) {
    return fail("New PIN must be exactly 6 digits");
  }
  if (
    profileImageDataUrl &&
    !/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=\s]+$/i.test(
      profileImageDataUrl,
    )
  ) {
    return fail("Profile photo must be a JPEG, PNG, or WebP image");
  }
  if (profileImageDataUrl.length > 1_500_000) {
    return fail("Profile photo is too large");
  }

  let result;
  await updateDb((db) => {
    const user = db.users.find((candidate) => candidate.id === currentUser.id);
    if (!user) {
      result = { error: "Account not found", status: 404 };
      return db;
    }
    if (
      db.users.some(
        (candidate) =>
          candidate.id !== user.id &&
          normalizeIndianPhone(candidate.phone) === phone,
      )
    ) {
      result = { error: "This mobile number is already in use", status: 409 };
      return db;
    }
    if (
      db.users.some(
        (candidate) =>
          candidate.id !== user.id &&
          String(candidate.username || "").toLowerCase() === username,
      )
    ) {
      result = { error: "This username is already taken", status: 409 };
      return db;
    }

    user.name = name;
    user.username = username;
    user.phone = phone;
    user.profileImageDataUrl = profileImageDataUrl || undefined;
    if (pin) user.passwordHash = hashPassword(pin);
    result = { user };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ user: publicUser(result.user) });
}
