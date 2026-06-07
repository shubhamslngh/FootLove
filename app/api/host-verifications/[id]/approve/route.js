import { updateDb } from "@/lib/server/db";
import { fail, ok, requireUser } from "@/lib/server/http";
import { canManagePlatform, ROLES } from "@/lib/server/roles";

export async function POST(_request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  if (!canManagePlatform(user.role)) {
    return fail("Only admins can approve hosts", 403);
  }

  let result;
  await updateDb((db) => {
    const manager = db.users.find((candidate) => candidate.id === id);
    const isManagerSignup =
      manager?.role === ROLES.MANAGER &&
      manager?.hostVerificationStatus === "pending";
    const isPlayerApplication =
      manager?.role === ROLES.PLAYER &&
      manager?.managerApplicationStatus === "pending";
    if (!manager || (!isManagerSignup && !isPlayerApplication)) {
      result = { error: "Pending manager application not found", status: 404 };
      return db;
    }

    manager.role = ROLES.MANAGER;
    manager.hostVerificationStatus = "approved";
    manager.managerApplicationStatus = "approved";
    manager.hostVerifiedByUserId = user.id;
    manager.hostVerifiedAt = new Date().toISOString();
    delete manager.hostVerificationRejectedAt;
    delete manager.hostVerificationRejectedByUserId;
    delete manager.managerApplicationRejectedAt;
    delete manager.managerApplicationRejectedByUserId;
    result = { manager };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ manager: result.manager });
}
