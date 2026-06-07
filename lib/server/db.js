import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

import { hashPassword } from "@/lib/server/password";

const DB_PATH = path.join(process.cwd(), "data", "footlove-db.json");
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const DATABASE_MODE = process.env.DATABASE_MODE?.trim() || "auto";
const DOCUMENT_ID = "primary";

const seedData = {
  users: [],
  venues: [],
  matches: [],
  bookings: [],
  notifications: [],
};

let pool;
let databaseReady;

function normalizeData(data = {}) {
  return {
    users: Array.isArray(data.users) ? data.users : [],
    venues: Array.isArray(data.venues) ? data.venues : [],
    matches: Array.isArray(data.matches) ? data.matches : [],
    bookings: Array.isArray(data.bookings) ? data.bookings : [],
    notifications: Array.isArray(data.notifications)
      ? data.notifications
      : [],
  };
}

function parseStoredData(value) {
  if (!value) return normalizeData(seedData);
  if (typeof value === "string") return normalizeData(JSON.parse(value));
  return normalizeData(value);
}

function useMysql() {
  if (DATABASE_MODE === "file") return false;
  if (DATABASE_MODE === "mysql") return true;
  return Boolean(DATABASE_URL);
}

function getPool() {
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required when DATABASE_MODE is set to mysql",
    );
  }

  const url = new URL(DATABASE_URL);
  if (!["mysql:", "mariadb:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use the mysql:// scheme");
  }

  pool ??= mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl:
      process.env.DB_SSL === "true"
        ? {
            rejectUnauthorized:
              process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          }
        : undefined,
  });
  return pool;
}

async function readSeedData() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return normalizeData(JSON.parse(raw));
  } catch {
    return normalizeData(seedData);
  }
}

async function getInitialData() {
  const shouldImportFile =
    process.env.DB_BOOTSTRAP_FROM_FILE === "true" ||
    process.env.NODE_ENV !== "production";
  const data = shouldImportFile
    ? await readSeedData()
    : normalizeData(seedData);
  const adminPhone = process.env.ADMIN_PHONE?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!data.users.length && adminPhone && adminPassword) {
    if (!/^[6-9]\d{9}$/.test(adminPhone)) {
      throw new Error("ADMIN_PHONE must be a valid 10-digit Indian number");
    }
    if (adminPassword.length < 12) {
      throw new Error("ADMIN_PASSWORD must be at least 12 characters");
    }

    data.users.push({
      id: "usr_admin",
      name: process.env.ADMIN_NAME?.trim() || "Admin",
      username: process.env.ADMIN_USERNAME?.trim().toLowerCase() || "admin",
      phone: adminPhone,
      role: "admin",
      passwordHash: hashPassword(adminPassword),
      createdAt: new Date().toISOString(),
    });
  }

  return data;
}

async function ensureMysqlDatabase() {
  if (databaseReady) return databaseReady;

  databaseReady = (async () => {
    const database = getPool();
    await database.execute(`
      CREATE TABLE IF NOT EXISTS app_state (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        data LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL
          DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const seed = await getInitialData();
    await database.execute(
      `
        INSERT IGNORE INTO app_state (id, data)
        VALUES (?, ?)
      `,
      [DOCUMENT_ID, JSON.stringify(seed)],
    );
  })();

  return databaseReady;
}

async function ensureFileDatabase() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(seedData, null, 2));
  }
}

async function readMysqlDb() {
  await ensureMysqlDatabase();
  const [rows] = await getPool().execute(
    "SELECT data FROM app_state WHERE id = ?",
    [DOCUMENT_ID],
  );
  return parseStoredData(rows[0]?.data);
}

async function writeMysqlDb(data) {
  await ensureMysqlDatabase();
  const normalized = normalizeData(data);
  await getPool().execute(
    "UPDATE app_state SET data = ? WHERE id = ?",
    [JSON.stringify(normalized), DOCUMENT_ID],
  );
  return normalized;
}

export async function readDb() {
  if (useMysql()) return readMysqlDb();

  await ensureFileDatabase();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return normalizeData(JSON.parse(raw));
}

export async function writeDb(data) {
  if (useMysql()) return writeMysqlDb(data);

  await ensureFileDatabase();
  const normalized = normalizeData(data);
  await fs.writeFile(DB_PATH, JSON.stringify(normalized, null, 2));
  return normalized;
}

export async function updateDb(updater) {
  if (!useMysql()) {
    const data = await readDb();
    const next = await updater(data);
    return writeDb(next ?? data);
  }

  await ensureMysqlDatabase();
  const connection = await getPool().getConnection();

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT data FROM app_state WHERE id = ? FOR UPDATE",
      [DOCUMENT_ID],
    );
    const data = parseStoredData(rows[0]?.data);
    const next = normalizeData((await updater(data)) ?? data);
    await connection.execute(
      "UPDATE app_state SET data = ? WHERE id = ?",
      [JSON.stringify(next), DOCUMENT_ID],
    );
    await connection.commit();
    return next;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
