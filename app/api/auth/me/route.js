import { getCurrentUser } from "@/lib/server/auth";
import { ok } from "@/lib/server/http";

export async function GET() {
  const user = await getCurrentUser();
  return ok({ user });
}
