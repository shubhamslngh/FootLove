# FootLove System Design

## Stack

- Next.js App Router pages and route handlers.
- Tailwind CSS with Radix UI primitives.
- HTTP-only signed cookie sessions.
- JSON persistence at `data/footlove-db.json` for local development.
- Transactional MySQL/MariaDB document persistence in production when
  `DATABASE_URL` is configured.

## Roles

- `admin`: approves venues, can host matches, manage all bookings, and control the platform.
- `manager`: submits venues for admin approval, hosts matches on approved venues, adds UPI/payment details, and verifies bookings.
- `player`: browses matches, pays via UPI/payment link/QR, and books slots.

## API Surface

- `POST /api/auth/signup`: public player/manager signup.
- `POST /api/auth/login`: phone/password login.
- `POST /api/auth/logout`: clear session.
- `GET /api/auth/me`: current user.
- `GET /api/venues`: list non-rejected venues.
- `POST /api/venues`: admin creates approved venue; manager submits pending venue.
- `POST /api/venues/:id/approve`: admin approves venue.
- `POST /api/venues/:id/reject`: admin rejects venue.
- `GET /api/matches`: list hosted matches.
- `POST /api/matches`: admin/manager creates match on approved venue with UPI, payment link, and QR details.
- `POST /api/matches/:id/book`: player submits paid booking pending verification.
- `POST /api/bookings/:id/confirm`: admin/manager confirms payment and adds player to team.
- `POST /api/bookings/:id/reject`: admin/manager rejects pending booking.

## Local Seed Login

- Admin phone: `9876543210`
- Admin password: `admin12345`
