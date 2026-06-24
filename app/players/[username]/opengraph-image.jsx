import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import {
  formatPoints,
  getPlayerCardTheme,
  getInitials,
  getPlayerPosition,
  getPlayerRating,
} from "@/lib/player-card";
import { getPublicPlayerCard } from "@/lib/server/player-card";

export const alt = "SoccerSesh player card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getLogo() {
  const file = await fs.readFile(path.join(process.cwd(), "public", "Logo.png"));
  return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
}

export default async function Image({ params }) {
  const { username } = await params;
  const card = await getPublicPlayerCard(username);
  if (!card) {
    return new ImageResponse(
      <div
        style={{
          alignItems: "center",
          background: "#171517",
          color: "white",
          display: "flex",
          fontSize: 64,
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}>
        SoccerSesh player
      </div>,
      size,
    );
  }

  const { user, stats } = card;
  const logo = await getLogo();
  const rating = getPlayerRating(stats);
  const position = getPlayerPosition(stats);
  const theme = getPlayerCardTheme(position, rating);

  return new ImageResponse(
    <div
      style={{
        background: "#171517",
        color: "white",
        display: "flex",
        height: "100%",
        overflow: "hidden",
        padding: "38px 54px",
        position: "relative",
        width: "100%",
      }}>
      <div
        style={{
          background: `radial-gradient(circle at 20% 20%, ${theme.glow}, transparent 32%), radial-gradient(circle at 85% 80%, ${theme.colors[1]}40, transparent 30%)`,
          display: "flex",
          inset: 0,
          position: "absolute",
        }}
      />
      {Array.from({ length: 18 }, (_, index) => (
        <div
          key={index}
          style={{
            background: theme.colors[index % theme.colors.length],
            display: "flex",
            height: index % 5 === 0 ? 5 : 2,
            left: -120 + index * 68,
            opacity: 0.18 + (index % 3) * 0.08,
            position: "absolute",
            top: -40 + index * 34,
            transform: "rotate(42deg)",
            width: 650,
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: "100%",
        }}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
          }}>
          <img
            src={logo}
            alt=""
            width="170"
            height="52"
            style={{ height: 52, objectFit: "contain", width: 170 }}
          />
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 999,
              display: "flex",
              fontSize: 20,
              fontWeight: 800,
              padding: "10px 20px",
            }}>
            Rank {stats.rank ? `#${stats.rank}` : "-"}
          </div>
        </div>

        <div
          style={{
            alignItems: "center",
            display: "flex",
            flex: 1,
            gap: 52,
          }}>
          <div
            style={{
              alignItems: "center",
              background: theme.baseColor,
              border: "2px solid rgba(255,255,255,0.13)",
              borderRadius: 30,
              boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              height: 450,
              justifyContent: "center",
              padding: 28,
              width: 330,
            }}>
            <div
              style={{
                alignItems: "flex-start",
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 64, fontWeight: 900 }}>
                  {rating}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    fontWeight: 900,
                    letterSpacing: 3,
                  }}>
                  {position}
                </div>
              </div>
            </div>
            <div
              style={{
                alignItems: "center",
                background: "#454247",
                border: "4px solid rgba(255,255,255,0.28)",
                borderRadius: 999,
                display: "flex",
                fontSize: 54,
                fontWeight: 900,
                height: 170,
                justifyContent: "center",
                marginTop: -22,
                overflow: "hidden",
                width: 170,
              }}>
              {user.profileImageDataUrl ? (
                <img
                  src={user.profileImageDataUrl}
                  alt=""
                  width="170"
                  height="170"
                  style={{ height: 170, objectFit: "cover", width: 170 }}
                />
              ) : (
                getInitials(user.name)
              )}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 25,
                fontWeight: 900,
                marginTop: 16,
                textTransform: "uppercase",
              }}>
              {user.name}
            </div>
            <div style={{ display: "flex", fontSize: 16, opacity: 0.65 }}>
              @{user.username}
            </div>
          </div>

          <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 900,
                lineHeight: 1.05,
              }}>
              {user.name}&apos;s
              <br />
              player card
            </div>
            <div
              style={{
                color: "#9aa9ba",
                display: "flex",
                fontSize: 23,
                marginTop: 14,
              }}>
              Performance from completed SoccerSesh matches
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 34,
              }}>
              {[
                ["PTS", formatPoints(stats.points)],
                ["PLAYED", stats.played],
                ["WINS", stats.wins],
                ["GOALS", stats.goals],
                ["ASSISTS", stats.assists],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 142,
                    padding: "14px 18px",
                  }}>
                  <div style={{ display: "flex", fontSize: 30, fontWeight: 900 }}>
                    {value}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 13,
                      fontWeight: 800,
                      opacity: 0.58,
                    }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
