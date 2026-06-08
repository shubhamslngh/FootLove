import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

import { hashPassword } from "@/lib/server/password";

const DB_PATH = path.join(process.cwd(), "data", "footlove-db.json");
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const DATABASE_MODE =
  process.env.DATABASE_MODE?.trim() ||
  (process.env.NODE_ENV === "production" ? "mysql" : "file");
const DATABASE_LOCK = "footlove_database_update";

const seedData = {
  users: [],
  venues: [],
  matches: [],
  bookings: [],
  notifications: [],
  clubs: [],
  clubMemberships: [],
  clubChallenges: [],
  communities: [],
  communityMatches: [],
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
    clubs: Array.isArray(data.clubs) ? data.clubs : [],
    clubMemberships: Array.isArray(data.clubMemberships)
      ? data.clubMemberships
      : [],
    clubChallenges: Array.isArray(data.clubChallenges)
      ? data.clubChallenges
      : [],
    communities: Array.isArray(data.communities) ? data.communities : [],
    communityMatches: Array.isArray(data.communityMatches)
      ? data.communityMatches
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
  throw new Error('DATABASE_MODE must be either "file" or "mysql"');
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
    dateStrings: true,
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
    if (!/^\d{6}$/.test(adminPassword)) {
      throw new Error("ADMIN_PASSWORD must be exactly 6 digits");
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

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    username VARCHAR(80) NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('admin', 'manager', 'player') NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    host_verification_status VARCHAR(32) NULL,
    host_verified_by_user_id VARCHAR(64) NULL,
    host_verified_at DATETIME(3) NULL,
    host_verification_rejected_by_user_id VARCHAR(64) NULL,
    host_verification_rejected_at DATETIME(3) NULL,
    manager_application_status VARCHAR(32) NULL,
    manager_application_submitted_at DATETIME(3) NULL,
    manager_application_rejected_by_user_id VARCHAR(64) NULL,
    manager_application_rejected_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL,
    UNIQUE KEY users_phone_unique (phone),
    UNIQUE KEY users_username_unique (username),
    KEY users_role_index (role)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS user_payment_methods (
    user_id VARCHAR(64) NOT NULL PRIMARY KEY,
    upi_id VARCHAR(320) NOT NULL,
    payee_name VARCHAR(160) NOT NULL,
    qr_code_data_url LONGTEXT NOT NULL,
    CONSTRAINT payment_methods_user_fk FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS venues (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    area VARCHAR(160) NOT NULL,
    city VARCHAR(160) NOT NULL,
    address TEXT NULL,
    map_url TEXT NULL,
    status VARCHAR(32) NULL,
    submitted_by_user_id VARCHAR(64) NULL,
    approved_by_user_id VARCHAR(64) NULL,
    approved_at DATETIME(3) NULL,
    rejected_by_user_id VARCHAR(64) NULL,
    rejected_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL,
    KEY venues_status_index (status),
    KEY venues_city_index (city),
    CONSTRAINT venues_submitter_fk FOREIGN KEY (submitted_by_user_id)
      REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT venues_approver_fk FOREIGN KEY (approved_by_user_id)
      REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT venues_rejector_fk FOREIGN KEY (rejected_by_user_id)
      REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS matches (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    home_team VARCHAR(160) NOT NULL,
    away_team VARCHAR(160) NOT NULL,
    format VARCHAR(20) NOT NULL,
    level VARCHAR(40) NOT NULL,
    match_date DATE NOT NULL,
    match_time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    capacity INT UNSIGNED NOT NULL,
    booked INT UNSIGNED NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    venue_id VARCHAR(64) NOT NULL,
    host_user_id VARCHAR(64) NOT NULL,
    upi_id VARCHAR(320) NOT NULL,
    upi_payee_name VARCHAR(160) NOT NULL,
    payment_link TEXT NULL,
    qr_code_data_url LONGTEXT NULL,
    notes TEXT NULL,
    home_score INT NULL,
    away_score INT NULL,
    phase VARCHAR(32) NULL,
    timer_running BOOLEAN NOT NULL DEFAULT FALSE,
    timer_started_at DATETIME(3) NULL,
    elapsed_seconds INT UNSIGNED NOT NULL DEFAULT 0,
    home_timeouts INT UNSIGNED NOT NULL DEFAULT 0,
    away_timeouts INT UNSIGNED NOT NULL DEFAULT 0,
    kicked_off_at DATETIME(3) NULL,
    completed_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL,
    updated_at DATETIME(3) NULL,
    KEY matches_date_index (match_date, match_time),
    KEY matches_status_index (status),
    KEY matches_host_index (host_user_id),
    CONSTRAINT matches_venue_fk FOREIGN KEY (venue_id)
      REFERENCES venues(id),
    CONSTRAINT matches_host_fk FOREIGN KEY (host_user_id)
      REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS match_slot_roles (
    match_id VARCHAR(64) NOT NULL,
    position INT UNSIGNED NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (match_id, position),
    CONSTRAINT slot_roles_match_fk FOREIGN KEY (match_id)
      REFERENCES matches(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    match_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    slot_role VARCHAR(100) NOT NULL,
    status VARCHAR(32) NOT NULL,
    payment_status VARCHAR(32) NULL,
    payment_reference VARCHAR(255) NULL,
    team ENUM('home', 'away') NULL,
    confirmed_by_user_id VARCHAR(64) NULL,
    confirmed_at DATETIME(3) NULL,
    rejected_by_user_id VARCHAR(64) NULL,
    rejected_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL,
    UNIQUE KEY bookings_match_user_unique (match_id, user_id),
    KEY bookings_status_index (status),
    CONSTRAINT bookings_match_fk FOREIGN KEY (match_id)
      REFERENCES matches(id) ON DELETE CASCADE,
    CONSTRAINT bookings_user_fk FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT bookings_confirmer_fk FOREIGN KEY (confirmed_by_user_id)
      REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT bookings_rejector_fk FOREIGN KEY (rejected_by_user_id)
      REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS match_events (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    match_id VARCHAR(64) NOT NULL,
    event_order INT UNSIGNED NOT NULL,
    type VARCHAR(40) NOT NULL,
    team ENUM('home', 'away') NULL,
    score_change SMALLINT NULL,
    goal_type VARCHAR(40) NULL,
    scorer_booking_id VARCHAR(64) NULL,
    scorer_user_id VARCHAR(64) NULL,
    scorer_name VARCHAR(160) NULL,
    assist_booking_id VARCHAR(64) NULL,
    assist_user_id VARCHAR(64) NULL,
    assist_name VARCHAR(160) NULL,
    label VARCHAR(500) NOT NULL,
    elapsed_seconds INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME(3) NOT NULL,
    UNIQUE KEY match_events_order_unique (match_id, event_order),
    CONSTRAINT events_match_fk FOREIGN KEY (match_id)
      REFERENCES matches(id) ON DELETE CASCADE,
    CONSTRAINT events_scorer_booking_fk FOREIGN KEY (scorer_booking_id)
      REFERENCES bookings(id) ON DELETE SET NULL,
    CONSTRAINT events_scorer_user_fk FOREIGN KEY (scorer_user_id)
      REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT events_assist_booking_fk FOREIGN KEY (assist_booking_id)
      REFERENCES bookings(id) ON DELETE SET NULL,
    CONSTRAINT events_assist_user_fk FOREIGN KEY (assist_user_id)
      REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    match_id VARCHAR(64) NULL,
    booking_id VARCHAR(64) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL,
    KEY notifications_user_index (user_id, is_read, created_at),
    CONSTRAINT notifications_user_fk FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_match_fk FOREIGN KEY (match_id)
      REFERENCES matches(id) ON DELETE CASCADE,
    CONSTRAINT notifications_booking_fk FOREIGN KEY (booking_id)
      REFERENCES bookings(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS clubs (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    city VARCHAR(160) NOT NULL,
    description TEXT NULL,
    logo_data_url LONGTEXT NOT NULL,
    captain_user_id VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    UNIQUE KEY clubs_name_unique (name),
    UNIQUE KEY clubs_slug_unique (slug),
    KEY clubs_city_index (city),
    CONSTRAINT clubs_captain_fk FOREIGN KEY (captain_user_id)
      REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS club_memberships (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    club_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    role ENUM('captain', 'player') NOT NULL DEFAULT 'player',
    status ENUM('active', 'pending') NOT NULL DEFAULT 'active',
    joined_at DATETIME(3) NOT NULL,
    UNIQUE KEY club_memberships_unique (club_id, user_id),
    KEY club_memberships_user_index (user_id),
    CONSTRAINT club_memberships_club_fk FOREIGN KEY (club_id)
      REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT club_memberships_user_fk FOREIGN KEY (user_id)
      REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS club_challenges (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    challenger_club_id VARCHAR(64) NOT NULL,
    challenged_club_id VARCHAR(64) NOT NULL,
    created_by_user_id VARCHAR(64) NOT NULL,
    status ENUM('pending', 'accepted', 'declined', 'cancelled') NOT NULL,
    proposed_date DATE NULL,
    proposed_time TIME NULL,
    venue_note VARCHAR(255) NULL,
    message TEXT NULL,
    responded_by_user_id VARCHAR(64) NULL,
    responded_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL,
    KEY club_challenges_recipient_index (challenged_club_id, status),
    CONSTRAINT challenges_challenger_fk FOREIGN KEY (challenger_club_id)
      REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT challenges_challenged_fk FOREIGN KEY (challenged_club_id)
      REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT challenges_creator_fk FOREIGN KEY (created_by_user_id)
      REFERENCES users(id),
    CONSTRAINT challenges_responder_fk FOREIGN KEY (responded_by_user_id)
      REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    whatsapp_url TEXT NOT NULL,
    logo_data_url LONGTEXT NOT NULL,
    created_by_user_id VARCHAR(64) NOT NULL,
    created_at DATETIME(3) NOT NULL,
    UNIQUE KEY communities_name_unique (name),
    CONSTRAINT communities_creator_fk FOREIGN KEY (created_by_user_id)
      REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS community_matches (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    community_id VARCHAR(64) NOT NULL,
    match_id VARCHAR(64) NOT NULL,
    added_by_user_id VARCHAR(64) NOT NULL,
    added_at DATETIME(3) NOT NULL,
    UNIQUE KEY community_matches_unique (community_id, match_id),
    KEY community_matches_match_index (match_id),
    CONSTRAINT community_matches_community_fk FOREIGN KEY (community_id)
      REFERENCES communities(id) ON DELETE CASCADE,
    CONSTRAINT community_matches_match_fk FOREIGN KEY (match_id)
      REFERENCES matches(id) ON DELETE CASCADE,
    CONSTRAINT community_matches_adder_fk FOREIGN KEY (added_by_user_id)
      REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

function toSqlDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 23).replace("T", " ");
}

function toIso(value) {
  if (!value) return undefined;
  const normalized = String(value).replace(" ", "T");
  return normalized.endsWith("Z") ? normalized : `${normalized}Z`;
}

function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  );
}

function placeholders(count) {
  return Array.from({ length: count }, () => "?").join(", ");
}

async function deleteMissing(connection, table, ids) {
  if (!ids.length) {
    await connection.execute(`DELETE FROM ${table}`);
    return;
  }
  await connection.execute(
    `DELETE FROM ${table} WHERE id NOT IN (${placeholders(ids.length)})`,
    ids,
  );
}

async function upsert(connection, table, columns, rows) {
  if (!rows.length) return;
  const updates = columns
    .filter((column) => column !== "id")
    .map((column) => `${column} = VALUES(${column})`)
    .join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(", ")})
    VALUES (${placeholders(columns.length)})
    ON DUPLICATE KEY UPDATE ${updates}`;
  for (const row of rows) {
    await connection.execute(sql, row);
  }
}

async function readNormalizedDb(connection) {
  const [userRows] = await connection.execute("SELECT * FROM users");
  const [paymentRows] = await connection.execute(
    "SELECT * FROM user_payment_methods",
  );
  const [venueRows] = await connection.execute("SELECT * FROM venues");
  const [matchRows] = await connection.execute("SELECT * FROM matches");
  const [slotRows] = await connection.execute(
    "SELECT * FROM match_slot_roles ORDER BY match_id, position",
  );
  const [bookingRows] = await connection.execute("SELECT * FROM bookings");
  const [eventRows] = await connection.execute(
    "SELECT * FROM match_events ORDER BY match_id, event_order",
  );
  const [notificationRows] = await connection.execute(
    "SELECT * FROM notifications",
  );
  const [clubRows] = await connection.execute("SELECT * FROM clubs");
  const [membershipRows] = await connection.execute(
    "SELECT * FROM club_memberships",
  );
  const [challengeRows] = await connection.execute(
    "SELECT * FROM club_challenges",
  );
  const [communityRows] = await connection.execute(
    "SELECT * FROM communities",
  );
  const [communityMatchRows] = await connection.execute(
    "SELECT * FROM community_matches",
  );

  const paymentByUser = new Map(
    paymentRows.map((row) => [
      row.user_id,
      {
        upiId: row.upi_id,
        payeeName: row.payee_name,
        qrCodeDataUrl: row.qr_code_data_url,
      },
    ]),
  );
  const slotsByMatch = new Map();
  for (const row of slotRows) {
    const roles = slotsByMatch.get(row.match_id) || [];
    roles.push(row.role_name);
    slotsByMatch.set(row.match_id, roles);
  }
  const eventsByMatch = new Map();
  for (const row of eventRows) {
    const events = eventsByMatch.get(row.match_id) || [];
    events.push(
      compact({
        id: row.id,
        type: row.type,
        team: row.team || undefined,
        change: row.score_change == null ? undefined : Number(row.score_change),
        goalType: row.goal_type || undefined,
        scorerBookingId: row.scorer_booking_id || undefined,
        scorerUserId: row.scorer_user_id || undefined,
        scorerName: row.scorer_name || undefined,
        assistBookingId: row.assist_booking_id || undefined,
        assistUserId: row.assist_user_id || undefined,
        assistName: row.assist_name || undefined,
        label: row.label,
        elapsedSeconds: Number(row.elapsed_seconds || 0),
        createdAt: toIso(row.created_at),
      }),
    );
    eventsByMatch.set(row.match_id, events);
  }

  return normalizeData({
    users: userRows.map((row) =>
      compact({
        id: row.id,
        name: row.name,
        username: row.username || undefined,
        phone: row.phone,
        role: row.role,
        passwordHash: row.password_hash,
        hostVerificationStatus: row.host_verification_status || undefined,
        hostVerifiedByUserId: row.host_verified_by_user_id || undefined,
        hostVerifiedAt: toIso(row.host_verified_at),
        hostVerificationRejectedByUserId:
          row.host_verification_rejected_by_user_id || undefined,
        hostVerificationRejectedAt: toIso(
          row.host_verification_rejected_at,
        ),
        managerApplicationStatus:
          row.manager_application_status || undefined,
        managerApplicationSubmittedAt: toIso(
          row.manager_application_submitted_at,
        ),
        managerApplicationRejectedByUserId:
          row.manager_application_rejected_by_user_id || undefined,
        managerApplicationRejectedAt: toIso(
          row.manager_application_rejected_at,
        ),
        paymentMethod: paymentByUser.get(row.id),
        createdAt: toIso(row.created_at),
      }),
    ),
    venues: venueRows.map((row) =>
      compact({
        id: row.id,
        name: row.name,
        area: row.area,
        city: row.city,
        address: row.address || undefined,
        mapUrl: row.map_url || undefined,
        status: row.status || undefined,
        submittedByUserId: row.submitted_by_user_id || undefined,
        approvedByUserId: row.approved_by_user_id || undefined,
        approvedAt: toIso(row.approved_at),
        rejectedByUserId: row.rejected_by_user_id || undefined,
        rejectedAt: toIso(row.rejected_at),
        createdAt: toIso(row.created_at),
      }),
    ),
    matches: matchRows.map((row) =>
      compact({
        id: row.id,
        title: row.title,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        format: row.format,
        level: row.level,
        date: row.match_date,
        time: String(row.match_time).slice(0, 5),
        price: Number(row.price),
        capacity: Number(row.capacity),
        booked: Number(row.booked),
        status: row.status,
        venueId: row.venue_id,
        hostUserId: row.host_user_id,
        upiId: row.upi_id,
        upiPayeeName: row.upi_payee_name,
        paymentLink: row.payment_link || "",
        qrCodeDataUrl: row.qr_code_data_url || "",
        slotRoles: slotsByMatch.get(row.id) || [],
        notes: row.notes || "",
        homeScore: row.home_score == null ? undefined : Number(row.home_score),
        awayScore: row.away_score == null ? undefined : Number(row.away_score),
        phase: row.phase || undefined,
        timerRunning: Boolean(row.timer_running),
        timerStartedAt: toIso(row.timer_started_at),
        elapsedSeconds: Number(row.elapsed_seconds || 0),
        homeTimeouts: Number(row.home_timeouts || 0),
        awayTimeouts: Number(row.away_timeouts || 0),
        kickedOffAt: toIso(row.kicked_off_at),
        completedAt: toIso(row.completed_at),
        events: eventsByMatch.get(row.id) || [],
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      }),
    ),
    bookings: bookingRows.map((row) =>
      compact({
        id: row.id,
        matchId: row.match_id,
        userId: row.user_id,
        slotRole: row.slot_role,
        status: row.status,
        paymentStatus: row.payment_status || undefined,
        paymentReference: row.payment_reference || undefined,
        team: row.team || undefined,
        confirmedByUserId: row.confirmed_by_user_id || undefined,
        confirmedAt: toIso(row.confirmed_at),
        rejectedByUserId: row.rejected_by_user_id || undefined,
        rejectedAt: toIso(row.rejected_at),
        createdAt: toIso(row.created_at),
      }),
    ),
    notifications: notificationRows.map((row) =>
      compact({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        message: row.message,
        matchId: row.match_id || undefined,
        bookingId: row.booking_id || undefined,
        read: Boolean(row.is_read),
        readAt: toIso(row.read_at),
        createdAt: toIso(row.created_at),
      }),
    ),
    clubs: clubRows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      city: row.city,
      description: row.description || "",
      logoDataUrl: row.logo_data_url || "",
      captainUserId: row.captain_user_id,
      createdAt: toIso(row.created_at),
    })),
    clubMemberships: membershipRows.map((row) => ({
      id: row.id,
      clubId: row.club_id,
      userId: row.user_id,
      role: row.role,
      status: row.status,
      joinedAt: toIso(row.joined_at),
    })),
    clubChallenges: challengeRows.map((row) =>
      compact({
        id: row.id,
        challengerClubId: row.challenger_club_id,
        challengedClubId: row.challenged_club_id,
        createdByUserId: row.created_by_user_id,
        status: row.status,
        proposedDate: row.proposed_date || undefined,
        proposedTime: row.proposed_time
          ? String(row.proposed_time).slice(0, 5)
          : undefined,
        venueNote: row.venue_note || undefined,
        message: row.message || undefined,
        respondedByUserId: row.responded_by_user_id || undefined,
        respondedAt: toIso(row.responded_at),
        createdAt: toIso(row.created_at),
      }),
    ),
    communities: communityRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      whatsappUrl: row.whatsapp_url,
      logoDataUrl: row.logo_data_url || "",
      createdByUserId: row.created_by_user_id,
      createdAt: toIso(row.created_at),
    })),
    communityMatches: communityMatchRows.map((row) => ({
      id: row.id,
      communityId: row.community_id,
      matchId: row.match_id,
      addedByUserId: row.added_by_user_id,
      addedAt: toIso(row.added_at),
    })),
  });
}

async function writeNormalizedDb(connection, sourceData) {
  const data = normalizeData(sourceData);
  const userIds = data.users.map((item) => item.id);
  const venueIds = data.venues.map((item) => item.id);
  const matchIds = data.matches.map((item) => item.id);
  const bookingIds = data.bookings.map((item) => item.id);
  const notificationIds = data.notifications.map((item) => item.id);
  const clubIds = data.clubs.map((item) => item.id);
  const membershipIds = data.clubMemberships.map((item) => item.id);
  const challengeIds = data.clubChallenges.map((item) => item.id);
  const communityIds = data.communities.map((item) => item.id);
  const communityMatchIds = data.communityMatches.map((item) => item.id);

  await upsert(
    connection,
    "users",
    [
      "id", "name", "username", "phone", "role", "password_hash",
      "host_verification_status", "host_verified_by_user_id",
      "host_verified_at", "host_verification_rejected_by_user_id",
      "host_verification_rejected_at", "manager_application_status",
      "manager_application_submitted_at",
      "manager_application_rejected_by_user_id",
      "manager_application_rejected_at", "created_at",
    ],
    data.users.map((user) => [
      user.id, user.name, user.username || null, user.phone, user.role,
      user.passwordHash, user.hostVerificationStatus || null,
      user.hostVerifiedByUserId || null, toSqlDateTime(user.hostVerifiedAt),
      user.hostVerificationRejectedByUserId || null,
      toSqlDateTime(user.hostVerificationRejectedAt),
      user.managerApplicationStatus || null,
      toSqlDateTime(user.managerApplicationSubmittedAt),
      user.managerApplicationRejectedByUserId || null,
      toSqlDateTime(user.managerApplicationRejectedAt),
      toSqlDateTime(user.createdAt) || toSqlDateTime(new Date()),
    ]),
  );

  await connection.execute("DELETE FROM user_payment_methods");
  for (const user of data.users) {
    if (!user.paymentMethod) continue;
    await connection.execute(
      `INSERT INTO user_payment_methods
        (user_id, upi_id, payee_name, qr_code_data_url)
       VALUES (?, ?, ?, ?)`,
      [
        user.id,
        user.paymentMethod.upiId,
        user.paymentMethod.payeeName,
        user.paymentMethod.qrCodeDataUrl,
      ],
    );
  }

  await upsert(
    connection,
    "venues",
    [
      "id", "name", "area", "city", "address", "map_url", "status",
      "submitted_by_user_id", "approved_by_user_id", "approved_at",
      "rejected_by_user_id", "rejected_at", "created_at",
    ],
    data.venues.map((venue) => [
      venue.id, venue.name, venue.area, venue.city, venue.address || null,
      venue.mapUrl || null, venue.status || null,
      venue.submittedByUserId || null, venue.approvedByUserId || null,
      toSqlDateTime(venue.approvedAt), venue.rejectedByUserId || null,
      toSqlDateTime(venue.rejectedAt),
      toSqlDateTime(venue.createdAt) || toSqlDateTime(new Date()),
    ]),
  );

  await upsert(
    connection,
    "matches",
    [
      "id", "title", "home_team", "away_team", "format", "level",
      "match_date", "match_time", "price", "capacity", "booked", "status",
      "venue_id", "host_user_id", "upi_id", "upi_payee_name",
      "payment_link", "qr_code_data_url", "notes", "home_score",
      "away_score", "phase", "timer_running", "timer_started_at",
      "elapsed_seconds", "home_timeouts", "away_timeouts", "kicked_off_at",
      "completed_at", "created_at", "updated_at",
    ],
    data.matches.map((match) => [
      match.id, match.title, match.homeTeam, match.awayTeam, match.format,
      match.level || "Open", match.date, match.time, Number(match.price),
      Number(match.capacity), Number(match.booked || 0), match.status || "open",
      match.venueId, match.hostUserId, match.upiId, match.upiPayeeName,
      match.paymentLink || null, match.qrCodeDataUrl || null,
      match.notes || null, match.homeScore ?? null, match.awayScore ?? null,
      match.phase || null, Boolean(match.timerRunning),
      toSqlDateTime(match.timerStartedAt), Number(match.elapsedSeconds || 0),
      Number(match.homeTimeouts || 0), Number(match.awayTimeouts || 0),
      toSqlDateTime(match.kickedOffAt), toSqlDateTime(match.completedAt),
      toSqlDateTime(match.createdAt) || toSqlDateTime(new Date()),
      toSqlDateTime(match.updatedAt),
    ]),
  );

  await upsert(
    connection,
    "bookings",
    [
      "id", "match_id", "user_id", "slot_role", "status",
      "payment_status", "payment_reference", "team",
      "confirmed_by_user_id", "confirmed_at", "rejected_by_user_id",
      "rejected_at", "created_at",
    ],
    data.bookings.map((booking) => [
      booking.id, booking.matchId, booking.userId,
      booking.slotRole || "Any role", booking.status,
      booking.paymentStatus || null, booking.paymentReference || null,
      booking.team || null, booking.confirmedByUserId || null,
      toSqlDateTime(booking.confirmedAt), booking.rejectedByUserId || null,
      toSqlDateTime(booking.rejectedAt),
      toSqlDateTime(booking.createdAt) || toSqlDateTime(new Date()),
    ]),
  );

  await connection.execute("DELETE FROM match_events");
  await connection.execute("DELETE FROM match_slot_roles");
  for (const match of data.matches) {
    const roles = Array.isArray(match.slotRoles)
      ? match.slotRoles
      : String(match.slotRoles || "Any role").split(",");
    for (const [position, role] of roles.entries()) {
      await connection.execute(
        `INSERT INTO match_slot_roles (match_id, position, role_name)
         VALUES (?, ?, ?)`,
        [match.id, position, String(role).trim()],
      );
    }
    for (const [eventOrder, event] of (match.events || []).entries()) {
      await connection.execute(
        `INSERT INTO match_events (
          id, match_id, event_order, type, team, score_change, goal_type,
          scorer_booking_id, scorer_user_id, scorer_name, assist_booking_id,
          assist_user_id, assist_name, label, elapsed_seconds, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id, match.id, eventOrder, event.type, event.team || null,
          event.change ?? null, event.goalType || null,
          event.scorerBookingId || null, event.scorerUserId || null,
          event.scorerName || null, event.assistBookingId || null,
          event.assistUserId || null, event.assistName || null,
          event.label || event.type, Number(event.elapsedSeconds || 0),
          toSqlDateTime(event.createdAt) || toSqlDateTime(new Date()),
        ],
      );
    }
  }

  await upsert(
    connection,
    "notifications",
    [
      "id", "user_id", "type", "title", "message", "match_id",
      "booking_id", "is_read", "read_at", "created_at",
    ],
    data.notifications.map((notification) => [
      notification.id, notification.userId, notification.type,
      notification.title, notification.message,
      notification.matchId || null, notification.bookingId || null,
      Boolean(notification.read), toSqlDateTime(notification.readAt),
      toSqlDateTime(notification.createdAt) || toSqlDateTime(new Date()),
    ]),
  );

  await upsert(
    connection,
    "clubs",
    [
      "id", "name", "slug", "city", "description", "logo_data_url",
      "captain_user_id", "created_at",
    ],
    data.clubs.map((club) => [
      club.id, club.name, club.slug, club.city, club.description || null,
      club.logoDataUrl || null, club.captainUserId,
      toSqlDateTime(club.createdAt) || toSqlDateTime(new Date()),
    ]),
  );
  await upsert(
    connection,
    "club_memberships",
    ["id", "club_id", "user_id", "role", "status", "joined_at"],
    data.clubMemberships.map((membership) => [
      membership.id, membership.clubId, membership.userId,
      membership.role || "player", membership.status || "active",
      toSqlDateTime(membership.joinedAt) || toSqlDateTime(new Date()),
    ]),
  );
  await upsert(
    connection,
    "club_challenges",
    [
      "id", "challenger_club_id", "challenged_club_id",
      "created_by_user_id", "status", "proposed_date", "proposed_time",
      "venue_note", "message", "responded_by_user_id", "responded_at",
      "created_at",
    ],
    data.clubChallenges.map((challenge) => [
      challenge.id, challenge.challengerClubId, challenge.challengedClubId,
      challenge.createdByUserId, challenge.status || "pending",
      challenge.proposedDate || null, challenge.proposedTime || null,
      challenge.venueNote || null, challenge.message || null,
      challenge.respondedByUserId || null,
      toSqlDateTime(challenge.respondedAt),
      toSqlDateTime(challenge.createdAt) || toSqlDateTime(new Date()),
    ]),
  );
  await upsert(
    connection,
    "communities",
    [
      "id", "name", "description", "whatsapp_url", "logo_data_url",
      "created_by_user_id", "created_at",
    ],
    data.communities.map((community) => [
      community.id, community.name, community.description,
      community.whatsappUrl, community.logoDataUrl || null,
      community.createdByUserId,
      toSqlDateTime(community.createdAt) || toSqlDateTime(new Date()),
    ]),
  );
  await upsert(
    connection,
    "community_matches",
    ["id", "community_id", "match_id", "added_by_user_id", "added_at"],
    data.communityMatches.map((item) => [
      item.id, item.communityId, item.matchId, item.addedByUserId,
      toSqlDateTime(item.addedAt) || toSqlDateTime(new Date()),
    ]),
  );

  await deleteMissing(connection, "community_matches", communityMatchIds);
  await deleteMissing(connection, "communities", communityIds);
  await deleteMissing(connection, "club_challenges", challengeIds);
  await deleteMissing(connection, "club_memberships", membershipIds);
  await deleteMissing(connection, "clubs", clubIds);
  await deleteMissing(connection, "notifications", notificationIds);
  await deleteMissing(connection, "bookings", bookingIds);
  await deleteMissing(connection, "matches", matchIds);
  await deleteMissing(connection, "venues", venueIds);
  await deleteMissing(connection, "users", userIds);
  return data;
}

async function readLegacyState(connection) {
  const [tables] = await connection.execute("SHOW TABLES LIKE 'app_state'");
  if (!tables.length) return null;
  const [rows] = await connection.execute(
    "SELECT data FROM app_state WHERE id = 'primary'",
  );
  return rows[0]?.data ? parseStoredData(rows[0].data) : null;
}

async function ensureColumn(connection, table, column, definition) {
  const [rows] = await connection.query(
    `SHOW COLUMNS FROM \`${table}\` LIKE ${connection.escape(column)}`,
  );
  if (!rows.length) {
    await connection.execute(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
    );
  }
}

async function ensureMysqlDatabase() {
  if (databaseReady) return databaseReady;

  databaseReady = (async () => {
    const connection = await getPool().getConnection();
    try {
      for (const statement of SCHEMA_STATEMENTS) {
        await connection.execute(statement);
      }
      await ensureColumn(connection, "clubs", "logo_data_url", "LONGTEXT NULL");
      await ensureColumn(
        connection,
        "communities",
        "logo_data_url",
        "LONGTEXT NULL",
      );

      const [[countRow]] = await connection.execute(
        "SELECT COUNT(*) AS count FROM users",
      );
      if (Number(countRow.count) > 0) return;

      const initialData =
        (await readLegacyState(connection)) || (await getInitialData());
      await connection.beginTransaction();
      await writeNormalizedDb(connection, initialData);
      await connection.commit();
    } catch (error) {
      if (connection.connection?._closing !== true) {
        await connection.rollback().catch(() => {});
      }
      databaseReady = null;
      throw error;
    } finally {
      connection.release();
    }
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
  const connection = await getPool().getConnection();
  try {
    return await readNormalizedDb(connection);
  } finally {
    connection.release();
  }
}

async function writeMysqlDb(data) {
  await ensureMysqlDatabase();
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const normalized = await writeNormalizedDb(connection, data);
    await connection.commit();
    return normalized;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
    const [[lock]] = await connection.execute(
      "SELECT GET_LOCK(?, 10) AS acquired",
      [DATABASE_LOCK],
    );
    if (!lock.acquired) {
      throw new Error("Could not acquire the database update lock");
    }

    await connection.beginTransaction();
    const data = await readNormalizedDb(connection);
    const next = normalizeData((await updater(data)) ?? data);
    await writeNormalizedDb(connection, next);
    await connection.commit();
    return next;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection
      .execute("SELECT RELEASE_LOCK(?)", [DATABASE_LOCK])
      .catch(() => {});
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
