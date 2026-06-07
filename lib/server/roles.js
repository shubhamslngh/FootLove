export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  PLAYER: "player",
};

export function canHostMatch(userOrRole) {
  const role =
    typeof userOrRole === "string" ? userOrRole : userOrRole?.role;

  if (role === ROLES.ADMIN) return true;
  if (role !== ROLES.MANAGER) return false;

  return (
    typeof userOrRole === "object" &&
    userOrRole?.hostVerificationStatus === "approved"
  );
}

export function canManagePlatform(role) {
  return role === ROLES.ADMIN;
}

export function canBookMatch(role) {
  return role === ROLES.PLAYER;
}
