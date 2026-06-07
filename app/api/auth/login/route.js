import { publicUser, readDb } from "@/lib/server/db";
import { setSessionCookie } from "@/lib/server/auth";
import { fail, ok, parseJson } from "@/lib/server/http";
import { verifyPassword } from "@/lib/server/password";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/server/phone";

export async function POST(request) {
  const body = await parseJson(request);
  if (!body?.phone || !body?.password) return fail("Phone and password are required");
  if (!isValidIndianPhone(body.phone)) return fail("Enter a valid 10-digit Indian mobile number");

  const db = await readDb();
  const user = db.users.find((candidate) => normalizeIndianPhone(candidate.phone) === normalizeIndianPhone(body.phone));

  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return fail("Invalid login credentials", 401);
  }

  await setSessionCookie(user);
  return ok({ user: publicUser(user) });
}
