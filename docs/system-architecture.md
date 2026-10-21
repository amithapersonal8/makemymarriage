# System Design Architecture — Make My Marriage V1

Make My Marriage \| Version 1.0 \| Technical Design Baseline

Prepared: 12 October 2026 • Product: India-first responsive wedding-management platform

Status: Proposed implementation architecture based on the approved product scope and subsequently finalized technology choices. Decisions marked “recommended” are design details, not additional product commitments.

# Executive summary

Make My Marriage V1 will use a single Next.js + TypeScript modular monolith deployed to Vercel. REST Route Handlers and application services run on the Node.js runtime, with MongoDB Atlas/Mongoose for primary transactional data, Cloudflare R2 for private images, Resend for transactional email, and Google Places API for business discovery. Guests never need an account; invitation, RSVP, upload and gallery access are controlled by purpose-specific secret links.

V1 does not use an independent Express/NestJS backend, Redis, real-time connections, external observability, or product analytics. Email processing uses persistent MongoDB jobs and small batches. YouTube is embedded rather than hosted. This document covers the full approved PRD scope, with later stack changes explicitly identified.

# 1. Scope, assumptions and decision register

## 1.1 Document authority

- Product baseline: “Make My Marriage — Product Requirements Document, V1.0”, 33 pages, supplied by the product owner.

- Architecture baseline: finalized V1 stack supplied after PRD approval (Next.js, MongoDB Atlas/Mongoose, Zod, Vercel, R2, Resend, Google Places, REST, custom auth).

- Most recent decision wins where it contradicts PRD: no signup/member-invitation email verification; active operational roles are Admin and Manager. Owners remain a distinct protected membership type.

## 1.2 In-scope domain capabilities

Account and wedding setup; wedding membership and permissions; multi-event scheduling; task management; budgets and expenses; guest households; event-specific invitations and RSVP counts; manual email reminders; Google Places vendor discovery, comparisons and manually maintained wedding vendors; themed wedding websites; private moderated photo uploads and gallery; YouTube event livestream links; operational dashboard.

## 1.3 Out of scope

Vendor login, booking, marketplace payments/commissions, payment schedules, SMS/WhatsApp, user activity/audit trails, automatic marketing or reminder campaigns, native mobile applications, custom video streaming, AI assistant, live collaboration, Redis, separate backend service, external monitoring and analytics in V1.

## 1.4 Decision log

| Topic            | V1 choice / design interpretation                                                                        |
|------------------|----------------------------------------------------------------------------------------------------------|
| Architecture     | Modular monolith; one Next.js application and deployable codebase                                        |
| API              | REST Route Handlers under /api/v1; Node.js runtime                                                       |
| Auth             | Custom email/password; signup verification removed; password reset via Resend recommended                |
| Roles            | Owner (bride/groom ownership), Admin, Manager; Organizer removed under latest role decision              |
| Guests           | No authentication; scoped bearer tokens in private links                                                 |
| Database         | MongoDB Atlas; Mongoose; shared collections partitioned logically by weddingId                           |
| Storage          | Private Cloudflare R2 bucket; direct browser uploads with short-lived signed requests                    |
| Email            | Resend; MongoDB-backed durable batches; scheduled worker route                                           |
| Vendor discovery | Google Places API; manual wedding vendors; platform directory from original PRD superseded for discovery |
| Deployment       | Vercel; exact plan and cron frequency deployment configuration                                           |
| Logging          | Basic structured server logs only                                                                        |

# 2. Logical architecture

Browser (organizers / owners / guests)

\| HTTPS

v

Vercel-hosted Next.js App Router (single modular monolith)

\|-- React pages + responsive public/wedding-site views

\|-- REST API Route Handlers (/api/v1/\*)

\|-- AuthN/AuthZ + Zod validation + rate limits

\|-- Application services by business domain

\|-- Mongoose repositories / adapters

\|----\> MongoDB Atlas (business data, tokens, email jobs)

\|----\> Cloudflare R2 (private media objects)

\|----\> Resend (verification-free signup; invitation/reset email)

\|----\> Google Places (vendor discovery only)

\|----\> YouTube (embed URL; no video hosting)

Vercel scheduled HTTP invocation -\> protected email-worker handler

Module boundaries are logical code boundaries rather than deployable microservices. Route handlers parse and validate; application services enforce business rules and permissions; repositories access MongoDB; integration adapters talk to R2, Resend and Places.

## 2.1 Suggested source layout

src/

app/(auth)/, app/(dashboard)/, app/w/\[slug\]/, app/invite/\[token\]/,

app/rsvp/\[token\]/, app/upload/\[token\]/, app/gallery/\[token\]/

app/api/v1/ \# REST handlers

modules/

auth/ weddings/ memberships/ events/ tasks/ budgets/

expenses/ households/ invitations/ rsvps/ vendors/

wedding-sites/ media/ livestreams/ dashboard/ emails/

lib/db/ lib/security/ lib/validation/ lib/logging/

integrations/r2/ integrations/resend/ integrations/google-places/

jobs/email-batch.ts

shared/types/ shared/constants/

Avoid importing Mongoose models directly into React Client Components. Use server-side data access; keep secrets and token signing on the server. Route handlers must not trust client-supplied role, weddingId, price summaries or moderation status.

# 3. Identities, tenancy and authorization

## 3.1 User identity and sessions

- Signup inputs: name, email, password. Create account immediately without email verification; normalize email and enforce uniqueness. Use Argon2id or equivalent modern password hashing, never reversible storage.

- Login: compare password hash and create a random opaque session identifier; set a Secure, HttpOnly, SameSite cookie. Store only a hash of the session secret in MongoDB with expiry and optional revocation metadata.

- Protect state-changing requests with Origin/CSRF controls appropriate to cookie-based auth; enforce rate limits for signup, login, password reset and token endpoints.

- Forgot-password: use single-use, expiring recovery token delivered through Resend. No need to verify email during signup, but recovery proves control of that address. Changing account email needs an explicitly designed secure process.

- Session expiry, logout, logout-all, brute-force controls, duplicate email behavior and account deletion should be configuration values documented and tested.

## 3.2 Wedding membership model

| Role    | Access and guardrails                                                                                                     |
|---------|---------------------------------------------------------------------------------------------------------------------------|
| Owner   | Wedding co-owner; full access; protected from Admin removal; manage all roles and ownership                               |
| Admin   | Manage wedding operations, Manager membership and photo moderation; cannot remove owners                                  |
| Manager | General operations (events, guests, tasks, expenses, vendors, invitations); cannot manage owners/Admins or approve photos |
| Guest   | Not a member; isolated link-scoped actions only                                                                           |

Store Owner as a membership role even if the user-facing person is bride or groom. A user may belong to multiple weddings. The authorized weddingId must be derived from authenticated membership and verified on every scoped resource operation.

## 3.3 Member invitation security

1.  Owner/Admin invites person with intended role; generate high-entropy random token, store hash, weddingId, role, expiry, status and invitation email.

2.  Email carries a one-use link. Recipient signs up or signs in without email verification.

3.  Backend validates the unexpired, unused token and authenticated session, then creates membership once (unique weddingId + userId).

4.  Consume token atomically. Do not grant membership simply because the logged-in email string matches an invitation; email has not been verified.

Trade-off: invitation links can be forwarded; the link is the access proof in V1. If strict recipient identity becomes necessary, email possession verification or a second factor must be introduced. No claim of recipient email ownership is made.

# 4. MongoDB data design

Use one Atlas database with separate collections and a weddingId on every wedding-owned document. Put compact, bounded arrays in documents; use referenced documents for expanding lists such as guests, tasks, RSVPs and photos. Enable timestamps; use soft deletion for destructive business records when practical. Monetary values should use integer minor units (paise) or a carefully standardized Decimal128 approach, never unchecked IEEE floating point.

| Collection          | Core fields / relationships                                                                             |
|---------------------|---------------------------------------------------------------------------------------------------------|
| users               | \_id, name, normalizedEmail, passwordHash, timestamps, disabledAt?                                      |
| sessions            | userId, tokenHash, expiresAt, revokedAt                                                                 |
| weddings            | title, brideName, groomName, dates, timezone, address/location, coverMediaId, status                    |
| wedding_members     | weddingId, userId, role OWNER\|ADMIN\|MANAGER, joinedAt                                                 |
| member_invites      | weddingId, email, role, tokenHash, expiresAt, acceptedAt                                                |
| events              | weddingId, type, title, startAt, endAt, timezone, venue, geoPoint, coverMediaId                         |
| tasks               | weddingId, eventId?, assigneeUserId?, title, dueAt, status, priority                                    |
| budgets             | weddingId, eventId? null for overall, amountMinor, currency                                             |
| expenses            | weddingId, eventId?, weddingVendorId?, amountMinor, category, incurredAt                                |
| households          | weddingId, representative, email, phone?, name, notes                                                   |
| event_invitations   | weddingId, eventId, householdId, status, invitedAt                                                      |
| rsvps               | weddingId, eventId, householdId, answer, attendeeCount, respondedAt                                     |
| guest_access_tokens | weddingId, householdId?, purpose, tokenHash, expiresAt?, revokedAt?                                     |
| wedding_vendors     | weddingId, source MANUAL\|GOOGLE, placeId?, userEnteredContact, estimate, notes, eventIds               |
| website_configs     | weddingId, enabled, visibility, slug, theme, intro, mediaIds                                            |
| media               | weddingId, eventId?, r2Key, type, mime, bytes, status PENDING\|APPROVED\|REJECTED, createdAt            |
| livestreams         | weddingId, eventId, youtubeVideoId, enabled                                                             |
| email_jobs          | weddingId?, type, recipient, payloadRef, status, attempts, nextAttemptAt, leaseUntil, providerMessageId |

## 4.1 Critical indexes and constraints

- users.normalizedEmail unique; wedding_members (weddingId, userId) unique.

- event_invitations (weddingId, eventId, householdId) unique; rsvps same triple unique to prevent duplicate count records.

- events (weddingId, startAt); tasks (weddingId, status, dueAt); households (weddingId, representative.email); expenses (weddingId, eventId, incurredAt).

- media (weddingId, status, createdAt); email_jobs (status, nextAttemptAt, leaseUntil); tokenHash unique when needed.

- Use TTL for expired sessions/tokens where safe, but always check expiresAt in application code; TTL deletion is not instantaneous.

- Vendor geo search can use a GeoJSON Point with coordinates \[longitude, latitude\] and a 2dsphere index if implemented later.

## 4.2 Data integrity rules

RSVP attendeeCount must be \>=1 only when accepted; decline implies zero. A household can RSVP only to an event on its invitation. Deleting an event must require explicit handling of associated tasks, invitations, media and costs (no silent cascade). Prevent last-owner removal. Use MongoDB transactions where multiple writes must commit atomically, especially membership acceptance and invite consumption.

## 4.3 Location shape

{

"venueName": "Example Venue",

"address": {"line1":"...", "line2":"...", "city":"...",

"state":"...", "postalCode":"...", "country":"India"},

"point": {"type":"Point", "coordinates":\[77.60,12.97\]},

"mapsUrl":"https://...", "placeId": "optional"

}

Coordinates and external place ID remain optional in V1. Client-provided coordinates are validated for numeric ranges. Timezone belongs on the wedding/event time representation rather than being inferred from geocoordinates.

# 5. API design and conventions

Prefix all endpoints /api/v1. Use JSON request/response, standard HTTP status codes, stable error shape {code, message, details?, requestId}, server-side Zod validation, cursor/page pagination for large lists, and strict resource authorization. Do not expose password hashes, raw bearer secrets or R2 object keys to unauthorized clients.

| Domain       | Representative REST endpoints                                                                                                |
|--------------|------------------------------------------------------------------------------------------------------------------------------|
| Auth         | POST /auth/signup; POST /auth/login; POST /auth/logout; POST /auth/password-reset/request; POST /auth/password-reset/confirm |
| Weddings     | GET/POST /weddings; GET/PATCH /weddings/:weddingId                                                                           |
| Members      | GET /weddings/:id/members; POST /weddings/:id/member-invites; POST /member-invites/accept                                    |
| Events       | GET/POST /weddings/:id/events; GET/PATCH/DELETE /weddings/:id/events/:eventId                                                |
| Tasks        | GET/POST /weddings/:id/tasks; PATCH/DELETE /weddings/:id/tasks/:taskId                                                       |
| Finance      | GET/PUT /weddings/:id/budgets; GET/POST /weddings/:id/expenses                                                               |
| Guests       | GET/POST /weddings/:id/households; POST /weddings/:id/households/import; GET /.../export                                     |
| Invites/RSVP | POST /weddings/:id/invitations/send; GET/PUT /public/rsvp/:token                                                             |
| Vendors      | GET /vendors/search; GET /vendors/place/:placeId; GET/POST /weddings/:id/vendors                                             |
| Website      | GET/PATCH /weddings/:id/website; GET /public/weddings/:slug                                                                  |
| Media        | POST /public/uploads/:token/intent; POST /public/uploads/:token/complete; GET/PATCH /weddings/:id/media                      |
| Gallery      | GET /public/galleries/:token; GET /public/gallery-media/:token/:mediaId                                                      |
| Ops          | POST /internal/jobs/email-batch (schedule-secret protected)                                                                  |

Endpoint names are design proposals, not an existing API contract. Consistent identifiers, filters and the precise semantics of invitation URLs should be fixed during implementation.

# 6. Major business flows

## 6.1 Create or join wedding

Signup/login -\> authenticated session -\> Create Wedding or Open Member Invite -\> Create Wedding establishes Owner membership; Join validates single-use invite token -\> membership upsert and token consumption -\> redirect to scoped wedding dashboard. Additional owners are added by an owner-only invitation path.

## 6.2 Event-specific household invitation and RSVP

Organizer creates household -\> selects one or more events -\> backend creates event-invitation relationships -\> unique household invitation token/link -\> invitation email job -\> representative sees only invited events -\> accept/decline and total attending per event -\> idempotent RSVP upsert -\> dashboard reads calculated event totals. Updating an RSVP is permitted via the valid household token; no guest account is needed.

## 6.3 Expense and dashboard calculations

Budget/expense changes are validated server-side; totals should come from aggregation queries grouped by weddingId/eventId/category. The remaining budget is budget minus recorded expenses, not proof of payment. Use targeted queries and modest caching only after profiling; avoid long-lived stale RSVP or budget totals.

## 6.4 Wedding-site publishing

One website configuration per wedding controls enabled status, unique slug/link, theme (Traditional, Minimal, Royal), cover image and livestream sections. Theme switching only changes presentation. Separate public wedding-site visibility from household-private invitation events; never leak private guest data or restricted events on public routes.

# 7. External integrations

## 7.1 Cloudflare R2: media security

5.  Validate the upload capability token and applicable wedding quota/rate limit; issue short-lived presigned PUT URL for a server-generated temporary object key.

6.  Browser uploads directly to a private bucket. Completion API verifies object existence, size/type and ownership context; never trust filename or browser MIME alone.

7.  Insert PENDING media metadata. Validate file signatures/content and reject disallowed content. Consider image re-encoding and malware screening as deployment-hardening items.

8.  Authorized Owner/Admin sets APPROVED or REJECTED. Approved gallery reads check the private gallery token and issue time-limited retrieval URLs or controlled proxy access.

9.  Use generated variants/thumbnails later if performance dictates; apply per-file limits and retention/deletion controls immediately.

## 7.2 Resend + lightweight batch processing

When invitations/reminders are requested, persist one durable email_jobs record per intended recipient/message. A protected scheduled Route Handler claims eligible records with atomic state transitions/lease expiry, sends a bounded number through Resend, records provider IDs and updates status. On transient failures retry with exponential backoff and a maximum attempt cap. Use a unique operation/send key to guard against double creation; duplicates can still occur around network failures, so provider-supported idempotency should be used where available.

Initial batch size: 20–25 messages per invocation, configurable to provider limits. The schedule depends on the chosen Vercel plan; do not use an in-memory setInterval in serverless functions. Store states PENDING / PROCESSING / SUBMITTED / FAILED, where SUBMITTED means provider accepted, not delivered. Manual invitation and reminder sending is in scope; recurring automatic campaigns are not.

## 7.3 Google Places discovery

The backend proxies narrowly scoped searches, place-detail lookups and filters, with API key restricted server-side and quota/cost controls. Display required attributions and obey current Google Maps Platform terms, including caching and storage restrictions. Persist Place IDs where allowed and independently entered wedding-vendor data; do not assume Google-returned contact, price or portfolio details may be permanently copied into the application database.

A wedding vendor can be manually created with no Google Place ID. Comparison includes actual available fields; Google Places is not a booking system and may lack wedding-specific pricing. The original PRD platform-maintained directory is replaced by this discovery integration unless the product owner separately reintroduces editorial listings.

## 7.4 YouTube embed

Store an approved video/live URL or extracted YouTube video ID per event and embed using the supported player. No video storage, relay or stream processing. Public visibility must follow wedding-site/event visibility rules.

# 8. Security and privacy controls

- Tenant isolation: every wedding resource query must be scoped by verified membership or by a narrowly scoped guest bearer token; never trust a client-supplied weddingId alone.

- Guest invitation, upload and gallery tokens: generate cryptographically secure random values, store a hash, support expiration/revocation, isolate purposes, avoid exposure in logs and referrer headers where practical.

- Authorization matrix enforced in application services, including ownership protection and photo moderation permissions; a hidden UI button is not a security control.

- Set Content Security Policy, HTTPS, protected cookies, CSRF/origin safeguards, and input/file validation; treat external Places/YouTube content as untrusted.

- Apply route-level rate limiting and abuse controls. Without Redis, MongoDB counters can provide a simple first implementation; enforce hard quotas on token generation, guest uploads, email sends and API usage.

- Maintain data retention/deletion policies for wedding data and photos, backups, recovery tests and encryption at rest/in transit in managed infrastructure.

- Unverified email limitation: do not mistake signup email for verified identity. Email/password recovery and forwarded invite links require documented abuse handling.

# 9. Reliability, deployment and operations

## 9.1 Vercel deployment

Deploy Next.js App Router using Node.js runtime for all Mongoose-dependent Route Handlers; avoid Edge runtime for database code. Use development, preview and production environments with separate secrets and preferably separate non-production database and R2 resources. Configure MongoDB connection reuse and control concurrency to avoid excess Atlas connections.

## 9.2 Configuration and secrets

MONGODB_URI, SESSION_SECRET, RESEND_API_KEY, EMAIL_FROM,

R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,

R2_BUCKET, GOOGLE_PLACES_API_KEY, CRON_SECRET,

NEXT_PUBLIC_APP_URL

Use Vercel environment variables. Never put server secrets behind NEXT_PUBLIC\_ prefix. Verify domain ownership and sender-domain settings for Resend before production email sending.

## 9.3 Observability and backups

Use Vercel/server structured JSON logs with requestId, route, module, outcome and safe error metadata. Log auth failures, email batch failures, R2 problems and database failures but no passwords, secret tokens, private RSVP links or detailed guest data. This is operational logging, not a user-activity audit trail. Use Atlas automated backups appropriate to tier and periodically test restoration; object-storage backup/retention must be separately planned.

## 9.4 Failure scenarios

| Failure                   | Expected response                                                      |
|---------------------------|------------------------------------------------------------------------|
| MongoDB unavailable       | Fail closed on auth/permissions; 503 to clients; retry safe reads only |
| Resend throttled          | Persist pending jobs; back off and retry after lease release           |
| Duplicate cron invocation | Atomic claim with lease and unique email-job identity                  |
| R2 upload incomplete      | Do not create approved media; expire/remove orphan objects             |
| Google API unavailable    | Display clear vendor search error; existing manual vendors still work  |
| Invite link leaked        | Support token revocation; token scoped to one purpose and wedding      |
| Photo moderation backlog  | Uploads remain PENDING and invisible to viewers                        |

# 10. Performance and scaling path

Use indexes on wedding-scoped queries, pagination for households/vendors/media, lazy-loaded image thumbnails, and server-side aggregation for counts. V1 scaling strategy is to scale the managed Next.js deployment and Atlas tier rather than split services. Evaluate queue/worker infrastructure only if email throughput, retry latency or photo processing actually demands it. Assess Places API and R2 usage costs before public launch.

# 11. Testing and release gates

- Unit tests: RSVP validation, permission matrix, financial calculations, token lifecycle, email idempotency and venue coordinate rules.

- Integration tests: Mongoose indexes and transaction behavior; signup/session/logout; membership acceptance; protected media access; R2 completion checks; mock Resend and Places errors.

- End-to-end tests: create wedding, add events, invite family, import households, send guest invite, update event RSVP, moderate photos, view link-private gallery, render theme and YouTube embed.

- Negative tests: cross-wedding IDOR, invalid/forwarded/expired tokens, unauthorized photo approval, mass invitation abuse, malicious uploads, CSV injection on guest exports, race conditions.

- Release checks: no secret leaks in builds, restricted Vercel routes, DNS/email sending configuration, backups/restoration, API quota alerts available from provider dashboards, basic accessibility/responsive checks.

# 12. Implementation phases

| Phase                  | Outcome                                                                                                |
|------------------------|--------------------------------------------------------------------------------------------------------|
| 1\. Foundation         | Project scaffold, MongoDB connection, session auth, Owner/Admin/Manager membership, wedding/event CRUD |
| 2\. Planning           | Tasks, budgets, expenses and dashboard summaries                                                       |
| 3\. Guests             | Households, import/export, event invitation links and RSVP                                             |
| 4\. Communication      | Resend templates, email jobs and protected scheduled batch processor                                   |
| 5\. Vendors            | Google Places search/detail adapter, comparison and manual wedding vendors                             |
| 6\. Wedding experience | Website themes, publication and YouTube embeds                                                         |
| 7\. Media              | R2 uploads, QR tokens, moderation and private gallery                                                  |
| 8\. Hardening          | Security tests, operational backup, abuse/rate limits, rollout checks                                  |

# 13. Open implementation choices (not blockers to the chosen stack)

- Visibility policy for wedding website (fully public, secret-link only, or configurable); default recommendation: configurable, with event-specific invitations always private.

- Token lifetimes; password policy; per-wedding media quotas; per-file limits; account recovery/ownership recovery procedures.

- Vercel plan and therefore available schedule frequency for email batch jobs; precise cron cadence is not committed here.

- Whether Google Places completely replaces the PRD-maintained vendor directory (assumed yes for discovery), and whether any manually curated platform listings remain.

- Default guest invitation token lifetime and whether RSVP links remain valid after the wedding; define clear post-wedding retention.

# 14. Architecture acceptance criteria

10. An authenticated Owner can create a wedding and invite Admin/Manager users; invited members can join through valid links without email verification.

11. A Manager cannot remove an Owner or approve pending photos; cross-wedding API access returns denial.

12. Household representative can RSVP separately for each invited event, with totals accurate after modifications and no guest login.

13. Bulk invitation request persists email jobs immediately; scheduled sending survives function restarts and transient provider failures.

14. A photo uploaded through a QR link stays private and PENDING until Owner/Admin approval; revoked gallery/upload tokens stop access.

15. Public wedding sites render chosen themes, relevant event schedules and configured YouTube streams without leaking restricted guest or RSVP data.

16. Google Places discovery works alongside manually entered wedding vendor information, with licensing/attribution requirements respected.

17. Basic logs, configuration isolation, backup approach and cost-conscious capacity controls are operational before launch.

# Appendix — source alignment and change notes

PRD reference: Make My Marriage Product Requirements Document — Version 1.0, approved V1 scope, supplied by the user. This document preserves V1 feature coverage and explicit exclusions, except where the later finalized stack replaces details.

| PRD versus finalized decisions                  | Treatment in this design                                                                         |
|-------------------------------------------------|--------------------------------------------------------------------------------------------------|
| PRD AUTH-02 and member email verification       | Superseded: immediate registration and token-based member join without email verification        |
| PRD Organizer + Manager labels                  | Superseded: one Manager operational role; Owner retained separately to protect wedding co-owners |
| PRD platform-maintained public vendor directory | Superseded for discovery by Google Places, with manual wedding vendors and usage restrictions    |
| PRD no activity/audit trail                     | Maintained; basic technical/server logs only                                                     |
| PRD private gallery and unregistered uploads    | Maintained with separate capabilities, private R2 media, moderation                              |

End of V1 System Design Architecture Document.
