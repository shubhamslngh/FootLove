# SoccerSesh System Design

## Stack

- Next.js App Router pages and route handlers.
- Tailwind CSS with Radix UI primitives.
- HTTP-only signed cookie sessions.
- Local development uses a separate local MySQL database. File persistence
  remains available only with `DATABASE_MODE=file`.
- Normalized transactional MySQL/MariaDB tables in production for users,
  payment methods, venues, matches, slot roles, bookings, match events, and
  notifications.
- Club competition tables for clubs, club memberships, and inter-club
  challenges.
- Community tables for community details, WhatsApp groups, and completed match
  history.

## Roles

- `admin`: approves venues, can host matches, manage all bookings, and control the platform.
- `manager`: submits venues for admin approval, hosts matches on approved venues, adds UPI/payment details, and verifies bookings.
- `player`: browses matches, pays via UPI/payment link/QR, and books slots.

## API Surface

- `POST /api/auth/signup`: public player/manager signup.
- `POST /api/auth/login`: mobile number and 6-digit PIN login.
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
- `POST /api/clubs`: create a club and become its captain.
- `POST /api/clubs/:id/join`: join an existing club.
- `POST /api/clubs/challenges`: club captain challenges another club.
- `POST /api/clubs/challenges/:id`: challenged captain accepts or declines.
- `POST /api/communities`: create a football community.
- `POST /api/communities/:id/matches`: add an eligible completed match to
  community history.

## Local Seed Login

- Admin phone: `9876543210`
- Admin password: `admin12345`
