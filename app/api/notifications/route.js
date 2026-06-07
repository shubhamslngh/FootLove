import { readDb } from "@/lib/server/db";
import { ok, requireUser } from "@/lib/server/http";

export async function GET() {
  const { user, error } = await requireUser();
  if (error) return error;

  const db = await readDb();
  const notifications = (db.notifications || [])
    .filter(
      (notification) =>
        notification.userId === user.id && !notification.read,
    )
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return ok({ notifications });
}
