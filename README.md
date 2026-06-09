# FAQ Portal (cs33)

A full-stack, production-minded community FAQ portal built with Node.js, Express, MongoDB, React (Vite), and Socket.IO.

## Overview

A crowdsourced knowledge-sharing platform where users submit FAQ entries, vote on answers, comment, follow contributors, and participate in a reputation-driven moderation system.

This README documents the full, implemented feature set, developer commands, environment variables, and production considerations.

## Complete Feature List (implemented)

- Authentication: registration, login, logout, JWT auth, email verification, password reset
- Social: follow/unfollow, follower/following counts, activity feed
- Content: submit FAQs (markdown), edit own pending FAQs, delete FAQs
- Answers & comments: threaded answers, edit/delete, accept answer flow
- Voting: upvote/downvote for FAQs and answers, net vote counts
- Search & discovery: keyword search, category and tag filters, trending lists, related FAQs
- Organization: categories with slug/icon/color, tags, pinned and wiki flags
- Moderation: pending queue, moderator views, admin approval/rejection with reasons
- Reports: user-submitted reports for spam/inappropriate/incorrect content
- Notifications: create/read/delete, Socket.IO real-time events for answers, comments, votes, accepts, badges, follows
- Reputation & badges: reputation calculation, auto-awarded badges, leaderboard
- Uploads: avatar upload with Multer and Cloudinary integration
- Security & hygiene: helmet, express-mongo-sanitize, DOMPurify for markdown, rate limiting, CORS, input validators
- Devops-friendly: seed script, graceful shutdown, weekly digest cron, Cloudinary and email integration
- Testing & tooling: multiple test scripts, Playwright listed as devDependency, ESLint and Tailwind on client

## Architecture

- `server/` — Express API, controllers, middleware, Mongoose models, utilities
- `client/` — React + Vite front-end with context providers (`AuthContext`, `SocketContext`, `ThemeContext`)
- WebSockets — `socket.io` server and client for live notifications
- Database — MongoDB via Mongoose, with pagination helpers

## Notable Implementation Details

- Security: `helmet` for headers, `express-mongo-sanitize` and custom sanitization for Mongo query values, `express-rate-limit` for global and auth-specific throttling.
- Markdown safety: `dompurify` + `jsdom` sanitize rendered HTML from markdown before sending to clients.
- Email: `nodemailer` uses Ethereal in development, and SMTP configuration for production. Preview URLs logged during dev.
- Authentication: supports Google OAuth (passport-google-oauth20) and optional SAML via `@node-saml/passport-saml`.
- File uploads: avatar upload route with Multer and Cloudinary storage integration.
- Background jobs: `weeklyDigest` utility scheduled in `server.js` (interval-based; consider replacing with cron in production).

## Environment Variables

Create a `.env` in `server/` with at least the following values:

- `PORT` (default: 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWTs
- `CLIENT_URL` — frontend origin (default: http://localhost:5173)
- `NODE_ENV` — `development` | `production`

Cloudinary
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

SMTP / Email (production)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` — 'true' or 'false'
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_NAME` (optional)
- `FROM_EMAIL` (optional)

Optional / SSO
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- SAML-related envs if used (provider-specific)

## Run & Development

Backend (server):

```bash
cd server
npm install
# run in development with auto-reload
npm run dev
# seed initial data (admin + categories)
npm run seed
# start production (after build / env configured)
npm start
```

Frontend (client):

```bash
cd client
npm install
# dev server (Vite)
npm run dev
# build for production
npm run build
# preview the production build
npm run preview
```

Root-level quick check (Playwright devDep exists):

```bash
# optional: run Playwright tests if configured
# Playwright is listed in root package.json devDependencies
```

## Scripts & Useful Tools

- `server` scripts: `dev` (nodemon), `start` (node), `seed` (seed DB)
- `client` scripts: `dev`, `build`, `preview`, `lint` (ESLint)
- Utility scripts in repo: PowerShell helpers (`restart-server.ps1`, `full-flow-test.ps1`, `fix_getone.ps1`) and various test scripts under the root for API and integration checks.

## API Endpoints

(Full list present in the codebase; highlights below)

- Auth: `/api/auth/*` (register/login/logout/me/forgot/reset/verify)
- FAQs: `/api/faqs/*` (search, trending, CRUD, answers, votes, comments, reports)
- Users: `/api/users/*` (profile, follow, saved, feed, leaderboard)
- Admin: `/api/admin/*` (dashboard, stats, users, faqs)
- Mods: `/api/mod/*` (queue, stats)
- Notifications: `/api/notifications/*`
- Uploads: `/api/upload/avatar`

Refer to the routes directory for the complete, authoritative list.

## Data Models (summary)

See `server/models` for full schemas. Key models:
- `User` — profile, auth, role, badges, following, notifications
- `FAQ` — question/answer content, answers subdocuments, votes, status, metadata
- `Category` — site taxonomy
- `Notification` — user notifications
- `Report` — content reports

## Testing

- The repo contains several test scripts in the project root (e.g., `test-*.js`, `test-*.ps1`). Backend `server/package.json` currently has a placeholder `test` script; adapt to your chosen test runner (Jest/Mocha) if needed.
- Playwright is included as a devDependency at the root for browser or E2E tests.

## Production Notes & Recommendations

- Use a process manager (PM2/systemd) for the `server` process.
- Replace interval-based `weeklyDigest` with a cron job or scheduled task runner in production.
- Enforce HTTPS and secure cookie/session settings if adding session auth.
- Configure rate limits and IP-based protections on public endpoints behind a load balancer.
- Offload uploads to Cloudinary and enable secure presets.
- Rotate `JWT_SECRET` and SMTP credentials securely in your environment.

## Contributing

- Run `npm run lint` in `client/` to check frontend lint issues.
- Use `server/utils/seed.js` to seed initial admin and categories in development.

## License

This repository includes a `LICENSE` file at the project root.

---

For any missing detail you'd like added to the README, tell me which area (e.g., env vars, CI, tests, deployment) and I'll expand that section and commit the change.
