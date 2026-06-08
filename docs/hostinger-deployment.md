# Hostinger Deployment

## Requirements

- A Hostinger plan with Node.js application support.
- Node.js 20 or newer.
- A MySQL or MariaDB database.
- A domain connected to the Node.js application.

## Environment Variables

Copy the values from `.env.example` into Hostinger's environment-variable
panel. Use the database credentials shown in Hostinger's database dashboard.

Required production values:

- `APP_URL`
- `DATABASE_MODE=mysql`
- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_NAME`
- `ADMIN_USERNAME`
- `ADMIN_PHONE`
- `ADMIN_PASSWORD`

The checked-in `.env.example` is configured for a separate local MySQL
database. Do not upload the local `.env`; configure Hostinger's own
`DATABASE_URL` through its environment-variable panel.

Use a database URL in this form:

```text
mysql://USER:PASSWORD@HOST:3306/DATABASE
```

URL-encode special characters in the username or password.

Generate the session secret locally:

```bash
openssl rand -base64 48
```

Keep `DB_BOOTSTRAP_FROM_FILE=false` for a clean production database. The first
database connection creates normalized relational tables for users, payment
methods, venues, matches, slot roles, bookings, match events, and notifications.
If the legacy `app_state` table exists and the new `users` table is empty, its
data is migrated automatically on startup.

## Build And Start

Install command:

```bash
npm ci
```

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

Hostinger supplies the `PORT` environment variable to the Next.js process.

## Verification

After deployment, open:

```text
https://YOUR_DOMAIN/api/health
```

A successful response reports `healthy` and `mysql`. Then log in using the
admin phone and password configured in the environment variables.

## File Uploads

Payment QR images are currently stored as data URLs in `LONGTEXT` columns.
Keep uploaded images small. For larger production usage, move uploads to object
storage and store only their URLs.
