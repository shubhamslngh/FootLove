import { updateDb } from "@/lib/server/db";
import { fail, ok, parseJson, requireUser } from "@/lib/server/http";
import { ROLES } from "@/lib/server/roles";

const UPI_PATTERN =
  /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{2,64}$/;

export async function POST(request) {
  const { user, error } = await requireUser();
  if (error) return error;
  if (user.role !== ROLES.PLAYER) {
    return fail("Only player accounts can apply to become managers", 403);
  }

  const body = await parseJson(request);
  const upiId = String(body?.upiId || "").trim();
  const payeeName = String(body?.payeeName || "").trim();
  const qrCodeDataUrl = String(body?.paymentQrDataUrl || "").trim();

  if (!upiId || !payeeName || !qrCodeDataUrl) {
    return fail("UPI ID, payee name, and payment QR code are required");
  }
  if (!UPI_PATTERN.test(upiId)) {
    return fail("Enter a valid UPI ID, for example player@upi");
  }
  if (!qrCodeDataUrl.startsWith("data:image/")) {
    return fail("Upload a valid payment QR image");
  }

  let applicant;
  await updateDb((db) => {
    applicant = db.users.find((candidate) => candidate.id === user.id);
    if (!applicant) return db;

    applicant.managerApplicationStatus = "pending";
    applicant.managerApplicationSubmittedAt = new Date().toISOString();
    applicant.paymentMethod = { upiId, payeeName, qrCodeDataUrl };
    delete applicant.managerApplicationRejectedAt;
    delete applicant.managerApplicationRejectedByUserId;
    return db;
  });

  if (!applicant) return fail("Player account not found", 404);
  return ok({ status: applicant.managerApplicationStatus });
}
