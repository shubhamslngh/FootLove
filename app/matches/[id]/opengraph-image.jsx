import { ImageResponse } from "next/og";

import { readDb } from "@/lib/server/db";
import { formatDisplayDate } from "@/lib/utils";

export const alt = "FootLove match details";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }) {
  const { id } = await params;
  const db = await readDb();
  const match = db.matches.find((candidate) => candidate.id === id);

  if (!match) {
    return new ImageResponse(
      (
        <div
          style={{
            alignItems: "center",
            background: "#0b1220",
            color: "white",
            display: "flex",
            fontSize: 64,
            height: "100%",
            justifyContent: "center",
            width: "100%",
          }}>
          FootLove match
        </div>
      ),
      size,
    );
  }

  const venue = db.venues.find((candidate) => candidate.id === match.venueId);
  const pendingCount = db.bookings.filter(
    (booking) =>
      booking.matchId === match.id && booking.status === "pending",
  ).length;
  const remaining = Math.max(
    0,
    match.capacity - match.booked - pendingCount,
  );

  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #071711 0%, #10271f 58%, #159669 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          padding: "54px 64px",
          width: "100%",
        }}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
          }}>
          <div style={{ color: "#39e6a5", fontSize: 28, fontWeight: 800 }}>
            FOOTLOVE
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 999,
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              padding: "12px 22px",
              textTransform: "uppercase",
            }}>
            {match.status}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
          }}>
          <div
            style={{
              color: "rgba(255,255,255,0.68)",
              display: "flex",
              fontSize: 24,
              marginBottom: 24,
            }}>
            {match.title} · {match.format} · {match.level || "Open"}
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 62,
              fontWeight: 900,
              justifyContent: "space-between",
              letterSpacing: "-2px",
            }}>
            <div style={{ display: "flex", maxWidth: 430 }}>
              {match.homeTeam}
            </div>
            <div
              style={{
                background: "#39e6a5",
                borderRadius: 24,
                color: "#071711",
                display: "flex",
                fontSize: 30,
                padding: "18px 22px",
              }}>
              VS
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                maxWidth: 430,
                textAlign: "right",
              }}>
              {match.awayTeam}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 28,
            display: "flex",
            fontSize: 23,
            justifyContent: "space-between",
            padding: "24px 28px",
          }}>
          <div style={{ display: "flex" }}>
            {formatDisplayDate(match.date)}, {match.time}
          </div>
          <div style={{ display: "flex" }}>
            {venue?.name || "Venue"}
          </div>
          <div style={{ display: "flex", fontWeight: 800 }}>
            ₹{match.price} · {remaining} slots left
          </div>
        </div>
      </div>
    ),
    size,
  );
}
