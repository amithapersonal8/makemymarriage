# Make My Marriage

An India-first wedding planning application. V1 uses a single Next.js + TypeScript modular monolith.

The application contains a responsive public homepage, account access, and wedding onboarding. After signup/login, `/weddings` lists the signed-in user's weddings; `/weddings/new` creates one directly from a single form with atomic Owner membership. Members can view their wedding overview and Owners can edit its details. Accounts, sessions, weddings, and memberships use MongoDB Atlas/Mongoose. Invitation management, planning modules, external integrations, and background jobs remain deferred. Public pages and builds do not connect to the database.

The homepage includes section navigation, a mobile menu, and expandable FAQs. Get started opens `/signup`; Log in opens `/login`. EB Garamond and DM Sans fonts are bundled in `public/fonts` with their open-source licenses, so rendering and builds do not require a remote font service.

## Local setup

Prerequisites: Node.js 24 LTS and pnpm 10.34.7, pinned in `package.json`. `.nvmrc` and CI select Node.js 24. If your machine has an older Node.js release, switch to Node.js 24 before installing dependencies; `engine-strict` enforces the project runtime.

If pnpm is not installed, install the pinned version:

```sh
npm install --global pnpm@10.34.7
```

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://127.0.0.1:3000>. The server binds to loopback by default. Stop it with Ctrl+C. To use another port, run `pnpm dev --port 3001`.

For account access, copy `.env.example` to `.env.local`, set `MONGODB_URI` to a dedicated development Atlas database, and set `APP_ORIGIN` to the exact browser origin (default `http://127.0.0.1:3000`). Update the origin when using another port or `localhost`. Use a least-privilege database user and an appropriate Atlas network access rule. Do not put real secrets in `.env.example` or commit local environment files. Only browser-safe values may use `NEXT_PUBLIC_`.

## Commands

| Command             | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `pnpm dev`          | Start the local development server                               |
| `pnpm lint`         | Run ESLint; warnings fail the check                              |
| `pnpm lint:fix`     | Apply automatic ESLint fixes                                     |
| `pnpm typecheck`    | Generate Next.js route types and run strict TypeScript checks    |
| `pnpm format`       | Format project files with Prettier                               |
| `pnpm format:check` | Check formatting without editing files                           |
| `pnpm build`        | Build the production application                                 |
| `pnpm start`        | Serve the production application after building                  |
| `pnpm test`         | Run auth, session-sync, and wedding tests with temporary MongoDB |
| `pnpm db:indexes`   | Create required auth and wedding indexes in the configured DB    |

Prettier excludes `docs/` to preserve the existing design documents. Generated Next.js files, local environment files, dependencies, and build artifacts are ignored by Git.

## Structure

```text
.github/workflows/ci.yml        Local validation checks in GitHub Actions
docs/                          Existing product and technical designs
public/                        Static assets and locally bundled fonts
scripts/create-auth-indexes.mjs Explicit auth and wedding index migration
src/
  app/
    (auth)/                    Signup, login, legacy account redirect, auth layout
    (workspace)/               Protected wedding list, create, overview, and edit
    api/v1/auth/               Signup, login, logout, and current-user endpoints
    api/v1/weddings/           Wedding list, create, read, and update endpoints
    globals.css                Tailwind CSS import and base styles
    layout.tsx                 Root document
    page.tsx                   Public marketing homepage
  components/
    auth/                      Forms, account shell, and logout control
    home/                      Homepage icons, sample content, and wedding preview
    layout/                    Shared shell and interactive mobile navigation
    weddings/                  Reusable single form, monogram, and wedding card
    ui/                        Shared UI primitives, reserved
  lib/                         Lazy database connection and HTTP error type
  modules/auth/                Validation, hashing, models, services, repository, tests
  modules/weddings/            Validation, DTOs, models, services, repository, tests
tests/server-only.ts           Test-only server-boundary marker replacement
vitest.config.mts              Focused integration test configuration
AGENTS.md                      Development and architecture conventions
```

Other domain modules, the wedding dashboard, guest routes, `src/integrations`, and jobs will be added when their implementation phase is approved. There are no fake business APIs.

Imports use `@/*` to resolve files under `src/`. React components render on the server by default. Tailwind uses its PostCSS plugin and CSS import; a separate Tailwind configuration file is not needed for this setup.

Direct dependencies are pinned, and the lockfile fixes transitive versions. Dependency lifecycle scripts are blocked by default; only the native `unrs-resolver` installer used by the lint tooling is allowed.

ESLint 9.39.5 is deprecated upstream. The React lint plugin currently supplied by `eslint-config-next` declares support only through ESLint 9, so this scaffold retains that compatible combination. Upgrade the lint stack together when that plugin supports ESLint 10. TypeScript 5.9 is within the installed TypeScript lint tooling's supported range.

## Architecture rules

- Keep REST Route Handlers under `src/app/api/v1` thin. Services own business rules and authorization; repositories own persistence.
- Keep future domain code in `src/modules/<domain>` and provider adapters in `src/integrations/<provider>` when needed.
- Keep database models, repositories, secrets, and integration clients on the server.
- Introduce dependencies and abstractions only when working functionality needs them.
- Use the finalized V1 architecture: Next.js, MongoDB Atlas/Mongoose, Zod, private R2 storage, Resend, and Google Places when their phases are approved. No separate backend or Redis.
- Read [AGENTS.md](AGENTS.md) before making changes.

## Design documents

- [Product requirements](docs/prd.md)
- [System architecture](docs/system-architecture.md)
- [Database design](docs/database-design.md)
- [API design](docs/api-design.md)

Latest explicit product and architecture decisions take precedence over older PRD details. Unresolved policy decisions in these documents remain deferred until the relevant phase.

## Continuous integration

GitHub Actions runs on pushes and pull requests. It installs from the frozen pnpm lockfile, then checks lint, types, formatting, authentication tests, and the production build. Tests start an isolated MongoDB process using `mongodb-memory-server`; its official MongoDB binary is downloaded on the first test run, not through dependency lifecycle scripts. Tests never connect to Atlas and need no external service secrets. CI does not deploy the application.

## Account access policies

- Signup accepts name, email, and a 15–128-character password. Names are trimmed; emails are trimmed/lowercased and have a database unique index. Passwords are never trimmed or truncated. Signup creates an account immediately and signs it in; no email verification is required.
- Passwords use Node.js asynchronous scrypt with a unique 128-bit salt, `N=131072`, `r=8`, `p=1`, and a 64-byte key. This follows a documented memory-hard configuration without requiring a native addon. See the [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- Sessions use random 256-bit opaque secrets, with only SHA-256 hashes stored in MongoDB. Sessions expire after seven days without sliding renewal. Expiry/revocation are checked on every protected read, independently of MongoDB TTL cleanup.
- Cookies are HttpOnly, SameSite=Lax, and Path=/. Production uses a Secure `__Host-mmm_session` cookie with no Domain attribute. Local HTTP development uses `mmm_session`. Deploy production over HTTPS.
- POST routes require the configured exact Origin; cross-site fetch metadata is rejected. JSON account payloads are capped at 16 KiB. Safe response projections omit password/session hashes, and account API responses are not cached.
- MongoDB-backed fixed-window limits apply across application instances: signup 5/client/hour and 100 total/hour; login 20/client/15 minutes, 10/email/15 minutes, and 200 total/15 minutes. Failed/duplicate attempts count too. The limits are defined in the auth service and currently use fixed conservative defaults.
- Only Vercel's `x-vercel-forwarded-for` header is accepted as a client IP when `VERCEL=1`. Other deployments/local development share a conservative client bucket; configure a trusted proxy adapter before deploying elsewhere. Arbitrary client `X-Forwarded-For` is ignored.
- Logout revokes the current session before clearing the cookie. Separate devices may keep their own sessions. Logout-all, password recovery, account/email editing, and ownership/membership functionality are not part of this slice. A database outage fails closed and presents a retry message.
- The signed-in workspace session guard synchronizes logout across same-origin browser tabs with a notification-only local-storage marker (no credentials or user data). It also revalidates on mount, tab focus/visibility, and history restoration, hiding details while checking. If storage is blocked, focus checks still detect logout; failed checks hide details and offer retry. Server-side session checks remain authoritative.

## Database indexes and production setup

Development creates the required auth and wedding indexes lazily. Production disables automatic index creation: run `pnpm db:indexes` against the intended deployment database before accepting traffic. It creates the unique user-email and session-token indexes, session-user lookup index, TTL indexes, wedding collections, unique wedding/user membership index, and user/wedding lookup index. It does not drop existing collections/indexes or modify account data; existing duplicates must be resolved before it can succeed.

## Wedding onboarding

The approved Stitch designs are implemented as reusable forms/cards and a protected signed-in shell. Required fields are bride name, groom name, and an editable suggested title. Dates, city/location, and description are optional; timezone defaults to `Asia/Kolkata` and is editable. Dates are calendar-date strings (`YYYY-MM-DD`), not UTC instants. Same-day celebrations are valid; an end date requires a start date and cannot precede it. Choosing undecided clears both dates. Text limits are 100 characters per name, 160 for title, 200 for location, and 2,000 for description. Date inputs support 1900–2199.

`GET/POST /api/v1/weddings` list/create; `GET/PATCH /api/v1/weddings/:weddingId` read/update. PATCH currently accepts the full editable form, not a partial field patch. Every request authenticates the session; services enforce membership and Owner-only editing. Unknown/nonmember IDs return 404. Client-supplied roles and unknown fields are rejected. APIs return safe projections with `private, no-store`, origin checks for mutations, and capped JSON bodies. `/account` redirects to the wedding list for existing bookmarks.

Creation uses a MongoDB transaction for the wedding and initial Owner membership. **Use Atlas or a local replica set; standalone MongoDB does not support this operation.** Tests use an isolated temporary replica set. There are no event, guest, invitation, photo-upload, deletion, or ownership-transfer controls in this milestone.

Unsaved create/edit drafts stay only in the current tab's memory. Session checks keep the form mounted while hiding private content and disabling inputs when verification fails. Visible tabs recheck every 30 seconds and mutations recheck immediately before saving. After expiry or cookie loss, the same account can log in through the provided link and return to its unsaved form. Another account clears the previous account's drafts. Successful save or the form's Cancel/Back action clears that draft. Drafts are never written to localStorage, sessionStorage, or the database. The form/login flow explains that refresh/close discards them, and a native unload warning is requested while unsaved data exists; browser policies control whether that dialog appears.

Set `MONGODB_URI` and an HTTPS `APP_ORIGIN` in each deployment environment. Database connections are lazy and reused; no database connection occurs during `pnpm build`. No session-signing secret is required because sessions are random opaque tokens resolved from the database.

## Next development phase

After explicit approval, proceed to event management and family collaboration in separate milestones. Password recovery requires a secure email-delivery milestone before public release. See [project status](docs/project-status.md) for completed work and limitations.
