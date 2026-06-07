import fs from "node:fs/promises";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "footlove-db.json");

const seedData = {
  users: [],
  venues: [],
  matches: [],
  bookings: [],
  notifications: [],
};

async function ensureDb() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(seedData, null, 2));
  }
}

export async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  const data = JSON.parse(raw);
  data.notifications ??= [];
  return data;
}

export async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  return data;
}

export async function updateDb(updater) {
  const data = await readDb();
  const next = await updater(data);
  return writeDb(next ?? data);
}

export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function withVenue(match, venues) {
  return {
    ...match,
    venue: venues.find((venue) => venue.id === match.venueId) ?? null,
  };
}
