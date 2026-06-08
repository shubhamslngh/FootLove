import { publicUser, readDb } from "@/lib/server/db";
import { setSessionCookie } from "@/lib/server/auth";
import { fail, ok, parseJson } from "@/lib/server/http";
import { verifyPassword } from "@/lib/server/password";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/server/phone";

export async function POST(request) {
  const body = await parseJson(request);
  const pin = String(body?.pin || body?.password || "");
  if (!body?.phone || !pin) return fail("Phone and PIN are required");
  if (!isValidIndianPhone(body.phone)) return fail("Enter a valid 10-digit Indian mobile number");
  if (!/^\d{6}$/.test(pin)) return fail("PIN must be exactly 6 digits");

  const db = await readDb();
  const user = db.users.find((candidate) => normalizeIndianPhone(candidate.phone) === normalizeIndianPhone(body.phone));

  if (!user || !verifyPassword(pin, user.passwordHash)) {
    return fail("Incorrect mobile number or PIN", 401);
  }

  await setSessionCookie(user);
  return ok({ user: publicUser(user) });
}
