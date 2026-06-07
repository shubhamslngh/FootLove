export function normalizeIndianPhone(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

export function isValidIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(normalizeIndianPhone(phone));
}
