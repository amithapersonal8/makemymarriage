# Make My Marriage — Project Status

Last updated: 28 October 2026

## Current state

The minimal application scaffold, public homepage UI, and account-access slice are implemented. Development continues from this Next.js + TypeScript foundation; the full V1 application is not yet implemented.

The homepage still uses illustrative wedding data. Get started and Log in now open working signup/login forms backed by MongoDB. Users can register, remain signed in across refreshes, visit a protected welcome page, and log out. There is no wedding setup, wedding membership, business-module API, email delivery, vendor integration, or media-storage integration yet.

The user configured `MONGODB_URI` in an ignored `.env.local`. A read-only connection and ping to Atlas succeeded on 28 October 2026, without changing records or indexes. Authentication was verified against isolated temporary MongoDB databases, including the production browser flow; registration/login against Atlas itself has not been exercised. Public pages and builds work without database credentials.

This document records implementation progress. Product scope and architecture remain governed by the design documents, `AGENTS.md`, and the latest explicit user decisions. Future feature work requires approval.

## Milestone overview

| Milestone | Status | Completed | Reference |
| --- | --- | --- | --- |
| Minimal project scaffold | Complete | 21 October 2026 | `3745d7b` |
| Public homepage UI | Complete; navigation follow-up resolved 28 October | 27 October 2026 | `547eba3` |
| Account access: signup, login, sessions, protected welcome, logout | Implemented and validated; Atlas connection verified | 28 October 2026 | Account-access implementation commit |

## Feature history

### 1. Minimal project scaffold

**Completed:** 21 October 2026  
**Commit:** `3745d7b` — `chore: initialize Next.js project scaffold`

Implemented:

- Next.js App Router, React, strict TypeScript, and Tailwind CSS.
- Shared application shell and an initial placeholder homepage, subsequently replaced by the public homepage milestone.
- `@/*` imports and reserved locations for future APIs, domain modules, infrastructure, and reusable UI.
- Node.js 24 / pnpm 10 tooling, pinned dependencies, and the pnpm lockfile.
- ESLint, Prettier, validation scripts, GitHub Actions CI, and local setup documentation.
- A credential-free runtime/build and safe environment-file conventions.

Validation: lint, type checking, formatting, and production build passed. The development server served the homepage successfully with HTTP 200 using Node.js 24 and pnpm 10.34.7.

Limitations: this milestone established the foundation only; business functionality and test frameworks were intentionally deferred.

### 2. Public homepage UI

**Completed:** 27 October 2026  
**Commit:** `547eba3` — `feat: build responsive public homepage from Stitch design`  
**Delivery:** pushed to `origin/dev`.

Implemented:

- Responsive public homepage adapted from the Stitch desktop and mobile design direction.
- Hero, sample wedding dashboard, planning comparison, V1 feature overview, family collaboration preview, sample event itinerary, guest experience, how-it-works section, FAQs, and footer.
- V1-aligned copy, excluding room allocation, transport coordination, real-time updates, vendor contracts, bookings, and payment processing.
- Shared icons, separate homepage content data, and a reusable wedding preview component.
- Section navigation, expandable FAQs, and a mobile menu that closes after selection or Escape.
- Visual-only Get started and Log in header buttons, as explicitly requested.
- Locally bundled DM Sans and EB Garamond fonts with redistribution licenses.
- Updated README describing the homepage and deferred functionality.

Validation:

- Lint, type checking, formatting, production build, and Git whitespace checks passed.
- Homepage returned HTTP 200; desktop and mobile browser checks found no runtime errors.
- Local fonts loaded, homepage anchor targets resolved, and FAQ/mobile-navigation interactions worked.
- Responsive checks covered widths from 320px to 1440px. A subsequent review confirmed the header buttons did not introduce overlap or horizontal overflow at the checked widths.

Limitations:

- Wedding names, dates, tasks, budget figures, memberships, and RSVP counts are sample presentation data, not backend functionality.
- Homepage descriptions introduce planned V1 capabilities; the corresponding business modules are not implemented.
- Signup and login remain unimplemented; their header buttons are intentionally inactive.

Follow-up identified in review: shared header/footer links used local anchors such as `#features`, which did not exist on the 404 page. This remained open in the homepage commit and was resolved in the account-access implementation on 28 October: shared links now use homepage-qualified URLs such as `/#features`, with a styled 404 page and a working home link. The historical inactive signup/login buttons were also connected as part of account access.

### 3. Account access

**Implemented:** 28 October 2026

**Status:** implementation validated locally; Atlas connection and ping verified.

**Commit:** included in `feat: implement secure account access`, the commit containing this milestone update.

Implemented:

- Responsive `/signup` and `/login` pages adapted from the Stitch login direction, with shared auth layout, accessible forms, password visibility control, confirmation validation, pending states, and safe errors.
- MongoDB/Mongoose user and session persistence, Zod input validation, and thin Node.js REST handlers for `/api/v1/auth/signup`, `/login`, `/logout`, and `/me`.
- Immediate signup without email verification and automatic sign-in. Names are trimmed; emails are normalized and unique; passwords require 15–128 characters and use salted, memory-hard scrypt hashes.
- Random opaque session tokens stored only as hashes in MongoDB. Seven-day absolute expiry, no sliding renewal, HttpOnly/SameSite cookies, Secure host-only cookies in production, and revocation on logout.
- A protected `/account` welcome page that validates the session and user status on every request. It contains no sample wedding dashboard or premature wedding setup functionality.
- Exact-origin CSRF controls, capped JSON requests, safe response projections, no-store auth API responses, and persistent client/email/global rate limits.
- Server-only boundaries, lazy/reused database connection, an explicit auth index migration, and a secret-free build.
- Fixed shared homepage navigation from non-home routes and updated README, `.env.example`, and CI.
- Focused Vitest integration tests using isolated temporary MongoDB instances, without Atlas credentials or external email services.

Validation:

- Twelve integration tests passed, covering duplicate-email races, password/session hashing, login failures, expiry/revocation/disabled accounts, idempotent logout, origin checks, malicious/invalid payloads, cookie flags, safe errors, and persistent throttling.
- Lint, TypeScript checking, formatting, frozen-lockfile installation, whitespace checks, and production build passed. The production build did not require a database connection.
- Headless Chrome verified signup and automatic sign-in, session persistence after reload, invalid-password errors, successful login, logout, protected-page denial, production cookie flags, no-store identity responses, and cross-origin rejection.
- Browser layout checks passed at 320, 390, 768, 1024, and 1440 pixels with no horizontal overflow or page errors. The reviewed 404-to-home navigation fix was verified.
- The user-supplied Atlas URI passed a read-only connection and ping check. No Atlas records or indexes were created by that check.

Policies and remaining limitations:

- Configure a dedicated development Atlas database in `.env.local` and use the exact browser `APP_ORIGIN`. Production requires HTTPS, an explicit origin, and `pnpm db:indexes` before registration traffic.
- Only trusted Vercel forwarding metadata supplies client IPs. Local/non-Vercel deployments share a conservative client rate-limit bucket; another deployment needs an explicitly trusted proxy adapter. Numerical limits are documented in README.
- Password recovery/email delivery, logout-all, account editing, wedding creation/membership, social login, and signup verification are not implemented in this slice. Password recovery remains a V1 requirement before public release.
- Accounts are not verified email identities. Membership and ownership must be introduced and authorized separately in a future approved milestone.

## Upcoming work — not yet implemented

Next, exercise account registration/login against the configured development Atlas database. The next proposed business milestone is wedding creation with atomic Owner membership and tenant-isolation tests, followed by events and family collaboration. Password recovery requires a secure email-delivery milestone before public release. Planning, households/RSVPs, communication, vendors, wedding websites/livestreams, and media follow according to their dependencies.

This is a planning direction, not approval to begin those features. Define and approve each milestone's scope and acceptance criteria before implementation.

## Updating this document

For each major feature or significant milestone:

1. Update the current-state summary and milestone overview.
2. Add or revise its feature-history entry with date, status, implemented scope, actual validation results, and remaining limitations or follow-ups.
3. Include a commit reference when one exists; do not invent references or claim checks were run when they were not.
4. Preserve earlier completed milestones and resolve follow-up notes when the corresponding fixes are delivered.
