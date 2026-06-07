import { updateDb } from "@/lib/server/db";
import { fail, ok, requireUser } from "@/lib/server/http";

export async function POST(_request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  let notification;
  await updateDb((db) => {
    notification = (db.notifications || []).find(
      (candidate) => candidate.id === id && candidate.userId === user.id,
    );
    if (!notification) return db;

    notification.read = true;
    notification.readAt = new Date().toISOString();
    return db;
  });

  if (!notification) return fail("Notification not found", 404);
  return ok({ notification });
}
