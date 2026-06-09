import QRCode from "qrcode";

export const DEFAULT_UPI_ID = "footlove@upi";
export const DEFAULT_UPI_PAYEE = "FootLove";

export function createUpiLink({ amount, note, upiId = DEFAULT_UPI_ID, payeeName = DEFAULT_UPI_PAYEE }) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: String(amount || ""),
    cu: "INR",
    tn: note || "FootLove match booking",
  });

  return `upi://pay?${params.toString()}`;
}

export async function createPaymentQr(options) {
  return QRCode.toDataURL(createUpiLink(options), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 360,
  });
}
