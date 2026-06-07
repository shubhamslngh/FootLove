import { updateDb } from "@/lib/server/db";
import { fail, ok, requireUser } from "@/lib/server/http";
import { canManagePlatform, ROLES } from "@/lib/server/roles";

export async function POST(_request, { params }) {
  const { id } = await params;
  const { user, error } = await requireUser();
  if (error) return error;
  if (!canManagePlatform(user.role)) {
    return fail("Only admins can reject hosts", 403);
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
    const isApprovedHost =
      manager?.role === ROLES.MANAGER &&
      manager?.hostVerificationStatus === "approved";
    if (
      !manager ||
      (!isManagerSignup && !isPlayerApplication && !isApprovedHost)
    ) {
      result = { error: "Host request not found", status: 404 };
      return db;
    }

    if (isManagerSignup || isApprovedHost) {
      manager.hostVerificationStatus = "rejected";
    }
    if (isPlayerApplication) manager.managerApplicationStatus = "rejected";
    manager.hostVerificationRejectedByUserId = user.id;
    manager.hostVerificationRejectedAt = new Date().toISOString();
    delete manager.hostVerifiedAt;
    delete manager.hostVerifiedByUserId;
    result = { manager };
    return db;
  });

  if (result?.error) return fail(result.error, result.status);
  return ok({ manager: result.manager });
}
