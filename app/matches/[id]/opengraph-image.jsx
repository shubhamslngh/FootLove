import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import { readDb } from "@/lib/server/db";
import { formatDisplayDate } from "@/lib/utils";

export const alt = "SoccerSesh match details";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const previewMatch = {
  id: "preview",
  title: "Friday Night Football",
  homeTeam: "SoccerSesh United",
  awayTeam: "City Strikers",
  format: "7v7",
  level: "Open",
  date: "2026-06-12",
  time: "20:00",
  price: 299,
  capacity: 14,
  booked: 8,
  status: "open",
};

async function getAsset(fileName) {
  const file = await fs.readFile(path.join(process.cwd(), "public", fileName));
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export default async function Image({ params }) {
  const { id } = await params;
  const db = await readDb();
  const match =
    db.matches.find((candidate) => candidate.id === id) ||
    (id === "preview" ? previewMatch : null);

  if (!match) {
    return new ImageResponse(
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
        SoccerSesh match
      </div>,
      size,
    );
  }

  const venue =
    db.venues.find((candidate) => candidate.id === match.venueId) ||
    (id === "preview" ? { name: "Kickoff Arena" } : null);
  const pendingCount = db.bookings.filter(
    (booking) => booking.matchId === match.id && booking.status === "pending",
  ).length;
  const remaining = Math.max(0, match.capacity - match.booked - pendingCount);

  const logoUrl = await getAsset("Logo.png");
  const homeInitials = getInitials(match.homeTeam);
  const awayInitials = getInitials(match.awayTeam);

  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(120deg, #000 0%, #26002f 48%, #100018 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        padding: "38px 52px 42px",
        position: "relative",
        width: "100%",
      }}>
      <div
        style={{
          background:
            "linear-gradient(120deg, #000 0%, #26002f 48%, #100018 100%)",
          display: "flex",
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          background:
            "radial-gradient(circle at 12% 70%, rgba(255,38,150,0.5), transparent 33%), radial-gradient(circle at 88% 22%, rgba(0,255,133,0.25), transparent 30%)",
          display: "flex",
          inset: 0,
          position: "absolute",
        }}
      />
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
        }}>
        <div style={{ alignItems: "center", display: "flex" }}>
          <img
            src={logoUrl}
            alt=""
            width="160"
            height="100"
            style={{
              borderRadius: 9,
              height: 100,
              objectFit: "cover ",
              width: 160,
            }}
          />
        </div>
        <div
          style={{
            background: "#00ff85",
            color: "#210028",
            display: "flex",
            fontSize: 17,
            fontWeight: 900,
            padding: "9px 18px",
            textTransform: "uppercase",
            transform: "skew(-8deg)",
          }}>
          {match.status}
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          position: "relative",
          textAlign: "center",
        }}>
        <div
          style={{
            color: "#00ff85",
            display: "flex",
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "3px",
            marginBottom: 22,
            textTransform: "uppercase",
          }}>
          {match.title} · {match.format}
        </div>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            width: "100%",
          }}>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              flexDirection: "column",
            }}>
            <div
              style={{
                alignItems: "center",
                background: "linear-gradient(145deg, #ff2882, #c80068)",
                border: "6px solid rgba(255,255,255,0.15)",
                borderRadius: 999,
                display: "flex",
                fontSize: 45,
                fontWeight: 900,
                height: 132,
                justifyContent: "center",
                width: 132,
              }}>
              {homeInitials}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 14 }}>
              {match.homeTeam}
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flexDirection: "column",
              margin: "0 30px",
              minWidth: 210,
            }}>
            <div style={{ fontSize: 18, fontWeight: 800, opacity: 0.7 }}>
              {formatDisplayDate(match.date)}
            </div>
            <div
              style={{
                fontSize: 54,
                fontWeight: 900,
                letterSpacing: "-2px",
                margin: "5px 0",
              }}>
              {match.time}
            </div>
            <div
              style={{
                background: "white",
                color: "#210028",
                display: "flex",
                fontSize: 18,
                fontWeight: 900,
                padding: "8px 20px",
              }}>
              MATCHDAY
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              flexDirection: "column",
            }}>
            <div
              style={{
                alignItems: "center",
                background: "linear-gradient(145deg, #00ff85, #00b860)",
                border: "6px solid rgba(255,255,255,0.15)",
                borderRadius: 999,
                color: "#210028",
                display: "flex",
                fontSize: 45,
                fontWeight: 900,
                height: 132,
                justifyContent: "center",
                width: 132,
              }}>
              {awayInitials}
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 14 }}>
              {match.awayTeam}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          alignItems: "center",
          backgroundImage: "linear-gradient(135deg, #FFE000 0%, #799F0C 100%)",
          color: "#210028",
          display: "flex",
          justifyContent: "space-between",
          margin: "0 -52px -42px",
          padding: "20px 52px",
          position: "relative",
        }}>
        <div style={{ display: "flex", fontSize: 21, fontWeight: 900 }}>
          {venue?.name || "Venue Arena"}
        </div>
        <div style={{ display: "flex", fontSize: 19, fontWeight: 800 }}>
          {match.level || "Open"} · ₹{match.price}
        </div>
        <div
          style={{
            background: remaining > 0 ? "#fff" : "#ff2882",
            display: "flex",
            fontSize: 19,
            fontWeight: 900,
            padding: "8px 15px",
          }}>
          {remaining > 0 ? `${remaining} SLOTS LEFT` : "MATCH FULL"}
        </div>
      </div>
    </div>,
    size,
  );
}
