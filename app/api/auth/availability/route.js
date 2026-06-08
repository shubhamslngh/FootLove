import { readDb } from "@/lib/server/db";
import { fail, ok } from "@/lib/server/http";
import { isValidIndianPhone, normalizeIndianPhone } from "@/lib/server/phone";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = String(searchParams.get("username") || "")
    .trim()
    .toLowerCase();
  const phone = normalizeIndianPhone(searchParams.get("phone"));

  if (!username && !phone) {
    return fail("Provide a username or mobile number");
  }

  const db = await readDb();
  if (username) {
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return ok({ field: "username", available: false, valid: false });
    }
    const available = !db.users.some(
      (user) => String(user.username || "").toLowerCase() === username,
    );
    return ok({ field: "username", available, valid: true });
  }

  if (!isValidIndianPhone(phone)) {
    return ok({ field: "phone", available: false, valid: false });
  }
  const available = !db.users.some(
    (user) => normalizeIndianPhone(user.phone) === phone,
  );
  return ok({ field: "phone", available, valid: true });
}
