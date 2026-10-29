# Make My Marriage — Project Status

Last updated: 29 October 2026

## Current state

The application scaffold, public homepage UI, account access, and wedding onboarding are implemented. Development continues from this Next.js + TypeScript foundation; the full V1 application is not yet implemented.

The homepage still uses illustrative wedding data. Get started and Log in open working signup/login forms backed by MongoDB. Signed-in users now land on their wedding list, create a wedding through one form, view the saved overview, edit details as Owner, and log out. Wedding creation atomically persists the wedding and creator's Owner membership. Invitation/member management, events and other planning modules, email delivery, vendor integration, and media storage are not implemented.

The user configured `MONGODB_URI` in an ignored `.env.local`. A read-only connection and ping to Atlas succeeded on 28 October 2026, without changing records or indexes. Authentication was verified against isolated temporary MongoDB databases, including the production browser flow. On 28 October, manual testing in the user's Chrome browser against the running development application at `http://127.0.0.1:3000` also verified registration, login, and logout using a persistent test account. The browser run did not independently inspect which database the running server used. Public pages and builds work without database credentials.

This document records implementation progress. Product scope and architecture remain governed by the design documents, `AGENTS.md`, and the latest explicit user decisions. Future feature work requires approval.

## Milestone overview

| Milestone | Status | Completed | Reference |
| --- | --- | --- | --- |
| Minimal project scaffold | Complete | 21 October 2026 | `3745d7b` |
| Public homepage UI | Complete; navigation follow-up resolved 28 October | 27 October 2026 | `547eba3` |
| Account access: signup, login, sessions, protected welcome, logout | Implemented and validated; Atlas connection verified | 28 October 2026 | Account-access implementation commit |
| Cross-tab logout synchronization | Implemented and validated | 28 October 2026 | Cross-tab logout fix commit |
| Wedding onboarding: list, create, overview, Owner editing | Implemented and validated | 29 October 2026 | Wedding onboarding and draft-recovery implementation commit |

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
- Manual Chrome testing on 28 October against the running development server passed signup and automatic sign-in, refresh persistence, logout after signup, incorrect-password rejection, successful subsequent login, logout after login, and direct `/account` redirection to `/login` while signed out.
- Manual validation checks passed malformed signup email, short signup password, mismatched confirmation, whitespace-only name, duplicate email with uppercase spelling, empty login email, empty login password, and nonexistent-account login. Incorrect passwords and nonexistent accounts displayed the same safe error. Keyboard Tab/Space operated the signup password show/hide control successfully.
- The manual run created `manual.qa.20261028@example.com` (display name `Manual QA October`) and left it signed out. The account was retained; no credentials were saved in repository files. This run did not repeat expiry, throttling, maximum-length boundaries, mobile layouts, or production-cookie/security checks; earlier automated coverage remains separate evidence.
- Cross-tab Chrome follow-up on 28 October: while signed in in tab A, opening `/login` in tab B redirected to `/account`. After logout completed in tab A, tab B still displayed the previous welcome page, email, and logout button when selected. Refreshing tab B redirected to `/login`; explicitly navigating to `/account` afterward also redirected to `/login`. Fresh protected-page requests correctly enforced logout, but already-rendered account UI did not synchronize across tabs. Both tested tabs ended signed out. This test left automatic cross-tab UI invalidation open; it was subsequently resolved by the cross-tab logout fix documented below. No application code was changed during this manual test.
- Chrome displayed a development hydration warning for an extra `cz-shortcut-listen="true"` attribute on `<body>`. Browser-extension injection is suspected but unconfirmed. This did not block the tested account flows; reproduction in a clean browser profile remains follow-up work.

Policies and remaining limitations:

- Configure a dedicated development Atlas database in `.env.local` and use the exact browser `APP_ORIGIN`. Production requires HTTPS, an explicit origin, and `pnpm db:indexes` before registration traffic.
- Only trusted Vercel forwarding metadata supplies client IPs. Local/non-Vercel deployments share a conservative client rate-limit bucket; another deployment needs an explicitly trusted proxy adapter. Numerical limits are documented in README.
- Password recovery/email delivery, logout-all, account editing, wedding creation/membership, social login, and signup verification are not implemented in this slice. Password recovery remains a V1 requirement before public release.
- Accounts are not verified email identities. Membership and ownership must be introduced and authorized separately in a future approved milestone.

### Account-access follow-up: cross-tab logout

**Implemented:** 28 October 2026.

**Commit:** included in `fix: synchronize logout across browser tabs`, the commit containing this status update.

The stale account UI issue recorded in the earlier manual cross-tab test above is now resolved by this implementation:

- After successful server logout, other same-origin tabs receive a notification-only local-storage marker. It contains no account details or session secrets.
- The protected welcome page hides its contents while validating the current session on mount, focus, visibility changes, and browser-history restoration. Logout notifications immediately invalidate the rendered account view and redirect to login.
- Storage restrictions do not prevent logout; returning to a tab rechecks the server session. If the session check fails because the server/network is unavailable, account details stay hidden and the page offers retry.
- Pending requests cannot restore stale account details after logout. An unsuccessful logout does not invalidate other tabs.

Validation: all 21 tests passed (the existing 12 auth integration tests and 9 session-synchronization regression tests). Lint, type checking, production build, formatting, and whitespace checks passed. An isolated production Chrome check with two tabs verified automatic cross-tab logout, no stale email/logout controls, blocked-storage focus fallback, failed logout preserving the session, history navigation after logout, and retry after a failed session check. No page errors were reported, and these checks did not access the user's Atlas database.

Manual retest on 28 October in the in-app browser against the running `http://127.0.0.1:3000` application passed: both tabs displayed the test account welcome page; logout in tab A automatically redirected tab B to `/login` without refreshing or navigating tab B. The stale welcome message, account email, and logout button were absent. Refresh remained on login, and direct `/account` navigation redirected to login. Opening `/login` in tab B while signed in had also redirected to `/account`. Both in-app tabs ended signed out. This confirms the earlier stale-page issue is resolved in this tested browser; the native Chrome retest was interrupted by the automation tool and is not claimed as completed.

### 4. Wedding onboarding

**Implemented:** 29 October 2026.

**Status:** implemented and validated locally; included in `feat: implement wedding onboarding and draft recovery`.

Design source: the user approved the cleaned desktop/mobile onboarding suite in Stitch project `18103177024525053930`. The implementation follows its forest-green palette, local EB Garamond/DM Sans fonts, white cards, monograms, minimal signed-in navigation, and responsive single form. Existing PRD/API/database documents remain preserved; this entry records the approved implementation contract where older field proposals differ.

Implemented:

- Protected `/weddings`, `/weddings/new`, `/weddings/[weddingId]`, and `/weddings/[weddingId]/edit`, covering empty/populated lists, direct creation, saved overview, and Owner editing. Signup/login now lead to the wedding list; `/account` redirects there for existing bookmarks.
- Required bride/groom names and editable automatically suggested title. Optional start/end dates, city/location, and description; editable IANA timezone defaults to `Asia/Kolkata`. Sample names appear only as placeholders, never pre-saved wedding data.
- Dates stored as calendar-date strings (`YYYY-MM-DD`, empty when undecided), independently of the explicit wedding timezone. This implements the approved date-only form instead of the earlier proposed UTC Date wedding fields. Event timestamps remain a future UTC-instant concern. Same-day weddings are accepted; end dates require a start date and cannot precede it. Date bounds are 1900–2199. Location is plain text in this slice rather than the earlier proposed structured venue object.
- Shared reusable wedding form, cards/monograms, responsive shell, account menu/logout, linked error summaries and inline errors, pending submission lock, safe failure/retry messaging retaining entered values, and success notices. No wizard or review step.
- Thin Node.js REST handlers for GET/POST `/api/v1/weddings` and GET/PATCH `/api/v1/weddings/:weddingId`. PATCH accepts the complete editable form. Strict Zod inputs reject roles/unknown properties. Existing exact-origin checks and capped JSON parsing protect mutations; all API projections are private/no-store.
- Dedicated wedding models/repository/services, separate `wedding_members`, unique wedding/user membership and user/wedding lookup indexes, atomic transaction creation with automatic Owner membership, membership-scoped reads/lists, and Owner-only metadata updates. Nonmember/malformed/missing IDs return 404 without exposing wedding details. No role assignment is accepted from clients.
- The existing explicit `pnpm db:indexes` migration now prepares wedding collections and indexes too. Development prepares them lazily. Production requires the migration before traffic. MongoDB transactions require Atlas or another replica-set deployment.
- Reused the existing session guard across the signed-in workspace, including cross-tab logout invalidation.

Validation:

- All 28 tests passed: 21 existing auth/session-sync tests and seven new wedding integration tests. New coverage includes atomic Owner persistence, transaction rollback on membership failure, tenant isolation for reads/lists/updates, Owner-only editing, unauthenticated/revoked-session denial, optional clearing, real date/date-range/timezone validation, role injection rejection, same-origin enforcement, and safe no-store response projections.
- Lint, strict TypeScript checking, formatting, production build, and Git whitespace checks passed.
- Isolated production headless Chrome verified authenticated empty state, required-field and date-order errors, automatic title, direct create-to-overview navigation, exactly one saved wedding/Owner membership under repeated submit clicks, network-failure messaging with retained values and successful retry, prefilled edit/save, clearing optional dates/location, populated wedding list, legacy account redirect, account-menu logout, and unauthenticated redirect. Mobile create/overview and 320/390/768/1024/1440px list overflow checks passed, with no reported page exceptions. Desktop/mobile screenshots were visually reviewed. The existing development homepage also returned HTTP 200 after the changes.
- Integration and browser checks used temporary local MongoDB instances/replica sets; no user Atlas records were created or modified by these checks. Testing against the user's configured Atlas remains a manual acceptance step.

Limitations/follow-up:

- Regression testing on 29 October reran all 28 tests, lint, type checking, formatting, and build successfully. In-app browser testing passed signup, wedding creation/editing/clearing, date validation, second-account isolation, redirects, and cross-tab logout. See [the regression report](qa-regression-2026-10-29.md) for exact coverage and retained QA records.
- The draft-loss issues found in the initial regression run were subsequently addressed by the draft-preserving reauthentication follow-up below. The original regression report preserves the before-fix findings separately from the new validation.
- Invitation/member management, events, guests, media uploads, deletion, and ownership transfer are outside this milestone. Owner is the only role this slice can create; future member-management work must establish additional role permissions explicitly.
- Submissions are locked while pending/navigation. The API does not yet offer durable create idempotency keys, so a connection loss after database commit can require checking the wedding list before retrying. Wedding lists currently load all memberships rather than offering pagination.

### Wedding-onboarding follow-up: draft-preserving reauthentication

**Implemented:** 29 October 2026. Included in `feat: implement wedding onboarding and draft recovery`.

- Root-level, tab-local in-memory drafts preserve incomplete creation/edit fields, custom-title behavior, date-selection state, and the return route across client-side login navigation. No wedding details, account identifiers, or credentials are persisted to browser storage by this feature.
- Session verification hides/inerts protected content without unmounting the form. Visible tabs poll every 30 seconds; submit revalidates immediately. Expired/missing sessions disable controls and show a same-account login action without discarding the draft. A mutation also checks the form's expected account against the authenticated account to prevent account-switch races.
- A successful same-user login returns directly to the draft; another account clears the former account's drafts. Save and explicit form cancellation remove the corresponding draft. Creation and individual wedding edits remain separate drafts.
- Form and login notices explain tab-only retention and refresh/close discard. A beforeunload listener requests the browser's native warning while drafts exist; browsers decide when to display it. Refresh/new tabs intentionally start without drafts.
- All 33 automated tests passed, including four draft lifecycle/isolation tests, foreground expiry polling, the existing session race suite, and expected-account mutation rejection. Type checking, lint, formatting, production build, and whitespace checks passed. Isolated production Chrome passed actual timed expiry without focus/navigation, disabled submission and retained data, same-user creation/edit restoration, lost-cookie submission denial and recovery, clearing on successful save, different-account clearing, unload-warning registration/notices, refresh discard, and absence of browser-storage persistence or page exceptions. See the regression report for the bounded follow-up results. These checks used a temporary replica set and did not touch user Atlas data.
- Independent acceptance retest on 29 October reran all 33 tests and project checks successfully. In-app browser testing against the running development application passed actual expiry of one specifically selected QA session, disabled form/submission with retained draft, same-user restoration and successful save, different-account draft clearing (including returning to the original account), and refresh/close notice wording. This acceptance run shortened only the QA account's latest active session in the configured database and retained one clearly labeled QA wedding. A dirty-form reload attempt did not complete, so completed refresh/native-dialog behavior is not claimed for this run. Details and test record IDs are in the regression report.

## Upcoming work — not yet implemented

Wedding onboarding is ready for manual review against the configured development Atlas database. The next proposed milestones are events and family collaboration, each requiring scope/design approval. Reproducing the earlier extension-related hydration warning in a clean browser profile remains follow-up work. Password recovery requires a secure email-delivery milestone before public release. Planning, households/RSVPs, communication, vendors, wedding websites/livestreams, and media follow according to their dependencies.

This is a planning direction, not approval to begin those features. Define and approve each milestone's scope and acceptance criteria before implementation.

## Updating this document

For each major feature or significant milestone:

1. Update the current-state summary and milestone overview.
2. Add or revise its feature-history entry with date, status, implemented scope, actual validation results, and remaining limitations or follow-ups.
3. Include a commit reference when one exists; do not invent references or claim checks were run when they were not.
4. Preserve earlier completed milestones and resolve follow-up notes when the corresponding fixes are delivered.
