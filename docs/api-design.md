# Make My Marriage — API Design V1.0

*Engineering specification*

Version 1.0 \| Proposed implementation contract for the approved V1 platform

Prepared: 13 October 2026 • Source baselines: System Design Architecture V1 (12 Oct 2026) and Database Design V1 (13 Oct 2026)

Status: Proposed API specification. The REST architecture and feature coverage are established; exact route naming, payload shape and implementation defaults in this document remain recommendations until adopted as the coding contract.

# Executive summary

Make My Marriage V1 exposes one versioned REST API from Next.js Route Handlers running on Node.js. The API serves authenticated wedding members, capability-token guests, and a protected internal email worker. MongoDB Atlas/Mongoose are the transactional source of truth; R2 handles private media, Resend dispatches transactional email, and Google Places provides vendor discovery. No separate backend, guest accounts, real-time channels or payment APIs are added.

| **Contract element** | **V1 baseline**                                                    |
|----------------------|--------------------------------------------------------------------|
| Base path            | /api/v1; JSON via HTTPS                                            |
| Runtime              | Next.js App Router Route Handlers, Node.js                         |
| Member identity      | Custom email/password session in Secure, HttpOnly cookie           |
| Wedding permissions  | OWNER / ADMIN / MANAGER, resolved from wedding_members             |
| Guest authorization  | Hashed, purpose-scoped bearer links: RSVP / UPLOAD / GALLERY       |
| Data conventions     | ObjectId serialized as string; UTC timestamps; INR integer paise   |
| External interfaces  | MongoDB Atlas, Cloudflare R2, Resend, Google Places; YouTube embed |

## Contents

01 Baseline decisions and API conventions

02 Authentication, authorization and privacy

03 Endpoint catalogue (all V1 domains)

04 Request and response contracts

05 Business rules, workflows and atomicity

06 Operational safeguards and integrations

07 Testing, release criteria and open decisions

# 1. Baseline decisions and API conventions

## 1.1 Authority and scope

The System Design Architecture V1 is the product/technology authority for approved functionality; the Database Design V1 supplies collection names, reference patterns and recommended fields. Representative endpoint families already appear in the architecture; this document expands them into an actionable REST proposal. Where the source leaves details unsettled, a recommended default is clearly indicated.

**In scope:** account/session management; weddings and memberships; events/livestreams; tasks; budgets and expenses; households; event invitations and RSVPs; manual email reminders; wedding vendor shortlist and Places discovery; website settings; moderated private media and gallery; dashboard; durable email worker.

**Out of scope:** guest logins, email signup verification, organizer role, vendor login/booking, marketplace payments, payment schedules, automatic campaigns, WhatsApp/SMS, video hosting, real-time collaboration, audit trail, separate backend.

## 1.2 Transport and resource conventions

| **Rule**          | **Proposed contract**                                                                   |
|-------------------|-----------------------------------------------------------------------------------------|
| URLs              | /api/v1/..., plural resource names, kebab-case paths, ObjectId parameters.              |
| Media types       | Content-Type: application/json for JSON mutations; Accept: application/json.            |
| Timestamps        | ISO 8601 with timezone offset in requests; UTC ISO 8601 in responses.                   |
| Identifiers       | 24-character MongoDB ObjectId strings; validate before querying.                        |
| Enums             | Uppercase string literals as defined by database design; reject unknown values.         |
| Money             | amountMinor: nonnegative safe integer in paise; currency: INR for V1 recommended.       |
| Null and absent   | Omitted field means do not update (PATCH); null clears only explicitly nullable fields. |
| Pagination        | cursor + limit for growing collections; default 25, max 100 (recommended).              |
| Ordering          | Stable sort by primary sort key and \_id to avoid duplicate/skipped rows.               |
| Response envelope | Object: { data, meta? }; list: { data: \[...\], page: { nextCursor, hasMore } }.        |
| Errors            | { code, message, details?, requestId } with appropriate HTTP status.                    |
| Idempotency       | Idempotency-Key on sends and other repeat-sensitive operations; uniqueness server-side. |

The specific pagination limits, JSON envelopes and idempotency header are recommended conventions. They are not pre-existing product commitments.

## 1.3 Request processing pipeline

Parse and cap request size → authenticate session or validate capability token → derive verified wedding scope → authorize role/action → validate input with Zod → apply domain invariants → access wedding-scoped repository → emit sanitized response. Never authorize from client-submitted role, weddingId, photo status or computed totals.

# 2. Authentication, authorization and privacy

## 2.1 Session authentication

Signup creates a user immediately without email verification. Login verifies an Argon2id password hash and issues an opaque random session secret in a Secure, HttpOnly, SameSite cookie. Only tokenHash is stored in sessions. Sessions require expiry/revocation checks on every authorized call; password recovery uses a separate one-use email-delivered token. Mutating cookie-authenticated routes must check request Origin/CSRF, with rate limits for sensitive endpoints.

## 2.2 Authorization matrix

| **Action**                                              | **OWNER** | **ADMIN** | **MANAGER** | **Guest**               |
|---------------------------------------------------------|-----------|-----------|-------------|-------------------------|
| Read/manage events, tasks, budgets, expenses, vendors   | Yes       | Yes       | Yes         | No                      |
| Manage households; event invites; send manual reminders | Yes       | Yes       | Yes         | RSVP only               |
| Manage website content, livestreams                     | Yes       | Yes       | Yes         | View by site visibility |
| Invite/add/remove MANAGER                               | Yes       | Yes       | No          | No                      |
| Invite/modify ADMIN or OWNER; owner transfer            | Yes       | No        | No          | No                      |
| Approve/reject gallery uploads                          | Yes       | Yes       | No          | No                      |
| Upload guest photos; view private gallery               | Yes       | Yes       | Yes         | Valid scoped token      |
| Remove final OWNER                                      | Never     | Never     | Never       | Never                   |

Member management and photo moderation exceptions come from the architecture. Member access to general operational modules follows the approved shared-family-member feature rule. Any tighter permission policy must be approved before implementation.

## 2.3 Token boundary and tenant isolation

- Guest RSVP token is bound to weddingId + householdId, optionally eventId; may only inspect or modify that household’s invited events.

- Guest UPLOAD token is bound to weddingId and optionally eventId; it cannot access RSVPs or gallery reads.

- Guest GALLERY token is bound to weddingId; it returns APPROVED media only and never private guest details.

- Member invites are single-use; token consumption and membership insertion occur atomically.

- Use a constant-time hash comparison when relevant; secrets must be omitted from logs, referrers and analytics.

- All wedding-scoped resource reads, writes and referenced IDs must be checked against the verified weddingId.

Returning 404 for unknown or inaccessible wedding resources is the recommended policy to minimize identifier enumeration. Invalid, expired and revoked guest links receive a generic failure rather than disclosing token validity details.

# 3. Endpoint catalogue

All paths below are relative to /api/v1. Auth codes: M = authenticated member of matching wedding; O = OWNER; A = OWNER or ADMIN; G = purpose-scoped guest token; P = public; I = protected internal worker. An endpoint marked M can additionally apply specific action-level restrictions in the contract.

## 3.1 Account and weddings

| **Verb** | **Path**                        | **Auth** | **Function**                          |
|----------|---------------------------------|----------|---------------------------------------|
| POST     | /auth/signup                    | P        | Register user                         |
| POST     | /auth/login                     | P        | Create session cookie                 |
| POST     | /auth/logout                    | M\*      | Revoke current session                |
| POST     | /auth/logout-all                | M\*      | Revoke all user sessions; recommended |
| GET      | /auth/me                        | M\*      | Current identity and memberships      |
| POST     | /auth/password-reset/request    | P        | Request recovery email                |
| POST     | /auth/password-reset/confirm    | P        | Consume one-use recovery token        |
| GET      | /weddings                       | M\*      | List weddings for current user        |
| POST     | /weddings                       | M\*      | Create wedding and OWNER membership   |
| GET      | /weddings/{weddingId}           | M        | Wedding details                       |
| PATCH    | /weddings/{weddingId}           | M        | Update wedding metadata               |
| GET      | /weddings/{weddingId}/dashboard | M        | Aggregate RSVP/task/expense metrics   |

## 3.2 Membership and event setup

| **Verb** | **Path**                                          | **Auth** | **Function**                                          |
|----------|---------------------------------------------------|----------|-------------------------------------------------------|
| GET      | /weddings/{weddingId}/members                     | M        | List members + roles                                  |
| DELETE   | /weddings/{weddingId}/members/{userId}            | A        | Remove eligible member; protected owners              |
| PATCH    | /weddings/{weddingId}/members/{userId}            | O        | Change membership role; protect final owner           |
| GET      | /weddings/{weddingId}/member-invites              | A        | List pending invites                                  |
| POST     | /weddings/{weddingId}/member-invites              | A        | Create invite + queue email; Owner for elevated roles |
| DELETE   | /weddings/{weddingId}/member-invites/{inviteId}   | A        | Revoke pending invitation                             |
| POST     | /member-invites/accept                            | M\*      | Consume invite and join wedding                       |
| GET      | /weddings/{weddingId}/events                      | M        | List events                                           |
| POST     | /weddings/{weddingId}/events                      | M        | Create event                                          |
| GET      | /weddings/{weddingId}/events/{eventId}            | M        | View scoped event                                     |
| PATCH    | /weddings/{weddingId}/events/{eventId}            | M        | Edit event                                            |
| DELETE   | /weddings/{weddingId}/events/{eventId}            | M        | Delete only with explicit dependency policy           |
| GET      | /weddings/{weddingId}/events/{eventId}/livestream | M        | View livestream configuration                         |
| PUT      | /weddings/{weddingId}/events/{eventId}/livestream | M        | Upsert YouTube video ID                               |
| DELETE   | /weddings/{weddingId}/events/{eventId}/livestream | M        | Disable/remove configuration                          |

## 3.3 Planning and finance

| **Verb** | **Path**                                      | **Auth** | **Function**                       |
|----------|-----------------------------------------------|----------|------------------------------------|
| GET      | /weddings/{weddingId}/tasks                   | M        | Filter/paginate tasks              |
| POST     | /weddings/{weddingId}/tasks                   | M        | Create task                        |
| GET      | /weddings/{weddingId}/tasks/{taskId}          | M        | Task detail                        |
| PATCH    | /weddings/{weddingId}/tasks/{taskId}          | M        | Edit task/status/assignee          |
| DELETE   | /weddings/{weddingId}/tasks/{taskId}          | M        | Soft-delete task                   |
| GET      | /weddings/{weddingId}/budgets/overall         | M        | Read overall budget                |
| PUT      | /weddings/{weddingId}/budgets/overall         | M        | Upsert overall budget              |
| GET      | /weddings/{weddingId}/events/{eventId}/budget | M        | Read event allocation              |
| PUT      | /weddings/{weddingId}/events/{eventId}/budget | M        | Upsert event allocation            |
| GET      | /weddings/{weddingId}/expenses                | M        | Filter/paginate expenses           |
| POST     | /weddings/{weddingId}/expenses                | M        | Create expense                     |
| GET      | /weddings/{weddingId}/expenses/{expenseId}    | M        | Expense detail                     |
| PATCH    | /weddings/{weddingId}/expenses/{expenseId}    | M        | Edit expense                       |
| DELETE   | /weddings/{weddingId}/expenses/{expenseId}    | M        | Soft-delete expense                |
| GET      | /weddings/{weddingId}/finance/summary         | M        | Derived budgets and expense totals |

## 3.4 Guest households and invitations

| **Verb** | **Path**                                         | **Auth** | **Function**                                  |
|----------|--------------------------------------------------|----------|-----------------------------------------------|
| GET      | /weddings/{weddingId}/households                 | M        | List households                               |
| POST     | /weddings/{weddingId}/households                 | M        | Create representative household               |
| GET      | /weddings/{weddingId}/households/{householdId}   | M        | Household detail                              |
| PATCH    | /weddings/{weddingId}/households/{householdId}   | M        | Edit household                                |
| DELETE   | /weddings/{weddingId}/households/{householdId}   | M        | Delete under explicit dependent-invite policy |
| POST     | /weddings/{weddingId}/households/import          | M        | Validated CSV import                          |
| GET      | /weddings/{weddingId}/households/export          | M        | CSV export                                    |
| GET      | /weddings/{weddingId}/invitations                | M        | Event-household invitation list               |
| POST     | /weddings/{weddingId}/invitations                | M        | Attach household(s) to event(s)               |
| PATCH    | /weddings/{weddingId}/invitations/{invitationId} | M        | Cancel or reset draft invitation              |
| POST     | /weddings/{weddingId}/invitations/send           | M        | Manually queue invitation emails              |
| POST     | /weddings/{weddingId}/invitations/remind         | M        | Manually queue email reminders                |
| GET      | /weddings/{weddingId}/rsvps                      | M        | RSVP breakdown/counts                         |
| GET      | /public/rsvp/{token}                             | G        | View household invited events                 |
| PUT      | /public/rsvp/{token}                             | G        | Submit/update one event RSVP                  |

## 3.5 Vendors and site publishing

| **Verb** | **Path**                                 | **Auth** | **Function**                              |
|----------|------------------------------------------|----------|-------------------------------------------|
| GET      | /vendors/search                          | P        | Google Places query via server-side proxy |
| GET      | /vendors/place/{placeId}                 | P        | Place detail via server-side proxy        |
| GET      | /weddings/{weddingId}/vendors            | M        | View saved shortlist                      |
| POST     | /weddings/{weddingId}/vendors            | M        | Save Place ID or manual vendor            |
| GET      | /weddings/{weddingId}/vendors/{vendorId} | M        | Saved vendor details                      |
| PATCH    | /weddings/{weddingId}/vendors/{vendorId} | M        | Update user-entered fields                |
| DELETE   | /weddings/{weddingId}/vendors/{vendorId} | M        | Remove saved vendor                       |
| GET      | /weddings/{weddingId}/website            | M        | Website configuration                     |
| PATCH    | /weddings/{weddingId}/website            | M        | Update theme, copy and publish settings   |
| GET      | /public/weddings/{slug}                  | P        | Public/unlisted wedding site data         |

## 3.6 Media, gallery and worker

| **Verb** | **Path**                                    | **Auth** | **Function**                           |
|----------|---------------------------------------------|----------|----------------------------------------|
| POST     | /public/uploads/{token}/intent              | G        | Issue short-lived private R2 PUT       |
| POST     | /public/uploads/{token}/complete            | G        | Verify object; register PENDING media  |
| GET      | /weddings/{weddingId}/media                 | M        | List media and moderation status       |
| PATCH    | /weddings/{weddingId}/media/{mediaId}       | A        | Approve/reject media; owner/admin only |
| POST     | /weddings/{weddingId}/media/upload-intent   | M        | Member-upload capability; recommended  |
| POST     | /weddings/{weddingId}/media/upload-complete | M        | Register member media; recommended     |
| GET      | /public/galleries/{token}                   | G        | List APPROVED gallery metadata         |
| GET      | /public/gallery-media/{token}/{mediaId}     | G        | Issue short-lived signed R2 read       |
| POST     | /internal/jobs/email-batch                  | I        | Claim/dispatch due Resend jobs         |

M\* means authenticated account context that does not yet require a weddingId (e.g. create/list wedding or accept a member invite). Public recovery routes require separate rate limits. Where the source proposed a generic /budgets endpoint, the explicit overall/event paths above are a recommended clarification, not a scope change.

# 4. Request and response contracts

## 4.1 Standard success, error and list envelopes

``` text
// Object success (200/201)
{ "data": { "id": "507f1f77bcf86cd799439011", "title": "Wedding" } }

// Paginated result (200)
{ "data": [{ "id": "507f1f77bcf86cd799439012" }],
  "page": { "nextCursor": null, "hasMore": false } }

// Rejected request (4xx / 5xx)
{ "code": "VALIDATION_ERROR", "message": "Invalid request data",
  "details": [{ "field": "attendeeCount", "issue": "Must be zero when declined" }],
  "requestId": "req_sample_001" }
```

| **Status**      | **When**                                             | **Stable code example**               |
|-----------------|------------------------------------------------------|---------------------------------------|
| 200 / 201 / 204 | Read / create / successful no-content mutation       | —                                     |
| 202             | Durable email jobs queued, not necessarily delivered | —                                     |
| 400 / 422       | Malformed body / semantically invalid input          | INVALID_JSON / VALIDATION_ERROR       |
| 401             | No valid member session                              | UNAUTHENTICATED                       |
| 403             | Authenticated but forbidden action                   | FORBIDDEN                             |
| 404             | Resource missing or tenant not visible               | NOT_FOUND                             |
| 409             | Unique, state or dependency conflict                 | CONFLICT / DEPENDENCY_BLOCKED         |
| 410             | Optional explicit expired capability policy          | TOKEN_UNAVAILABLE                     |
| 413 / 415       | Too large / unsupported file type                    | PAYLOAD_TOO_LARGE / UNSUPPORTED_MEDIA |
| 429             | Rate or quota exceeded                               | RATE_LIMITED                          |
| 500 / 502 / 503 | Unexpected / provider / dependency unavailable       | INTERNAL_ERROR / UPSTREAM_ERROR       |

## 4.2 Authentication

**POST /auth/signup** name, email, password → 201 user safe fields. Duplicate normalized email: 409. No verification email in V1.

**POST /auth/login** email + password → 200 user summary and Set-Cookie. Rate limit credential attempts; never return passwordHash.

**POST /auth/password-reset/request** email → 202 generic response regardless of account existence; queue one-use recovery message.

**POST /auth/password-reset/confirm** token + newPassword → 204 on success; consume token exactly once, optionally revoke sessions (recommendation).

``` text
POST /api/v1/auth/login
{ "email": "member@example.com", "password": "<redacted>" }

200 OK  // plus a Secure, HttpOnly session cookie
{ "data": { "user": { "id": "507f1f77bcf86cd799439011",
    "name": "Family Member", "email": "member@example.com" } } }
```

## 4.3 Create wedding and assign event

``` text
POST /api/v1/weddings
{ "title": "A Wedding Celebration", "brideName": "Bride",
  "groomName": "Groom", "timezone": "Asia/Kolkata" }

201 Created
{ "data": { "id": "507f1f77bcf86cd799439011",
  "title": "A Wedding Celebration", "role": "OWNER" } }

POST /api/v1/weddings/{weddingId}/events
{ "title": "Mehndi", "type": "MEHNDI",
  "startAt": "2027-03-18T12:00:00+05:30",
  "endAt": "2027-03-18T16:00:00+05:30",
  "timezone": "Asia/Kolkata", "visibility": "INVITED_ONLY" }
```

Server must validate startAt \<= endAt, timezone, optional venue coordinates and that coverMediaId belongs to the same wedding. Create wedding + OWNER membership in a MongoDB transaction.

## 4.4 Member invites and join

``` text
POST /api/v1/weddings/{weddingId}/member-invites
{ "email": "relative@example.com", "role": "MANAGER" }

202 Accepted
{ "data": { "inviteId": "507f1f77bcf86cd799439013",
  "status": "PENDING", "emailQueued": true } }

POST /api/v1/member-invites/accept
{ "token": "<one-use-link-secret>" }

200 OK
{ "data": { "weddingId": "507f1f77bcf86cd799439011",
  "role": "MANAGER" } }
```

Authenticated invite acceptance does not prove ownership of the invited email address because signup email is unverified. The one-use token is the bearer proof. Owner invitations and Admin role changes are owner-only; the last Owner cannot be removed.

## 4.5 Tasks and financial records

``` text
POST /api/v1/weddings/{weddingId}/tasks
{ "title": "Confirm photographer", "eventId": null,
  "assigneeUserId": null, "priority": "HIGH", "status": "TODO" }

PUT /api/v1/weddings/{weddingId}/budgets/overall
{ "amountMinor": 150000000, "currency": "INR" }

POST /api/v1/weddings/{weddingId}/expenses
{ "title": "Venue deposit", "category": "VENUE",
  "amountMinor": 2500000, "currency": "INR",
  "incurredAt": "2027-02-01T09:30:00Z", "eventId": null }
```

Example amounts are illustrative paise, not estimates or app defaults. Return budget and expense summaries from MongoDB aggregations; overall budget is a single cap, optional event budgets are allocations and must not be added to the overall cap. Recorded expenses do not establish payment status.

## 4.6 Households, invitations and guest RSVP

``` text
POST /api/v1/weddings/{weddingId}/households
{ "name": "Sharma Family", "representative": {
    "name": "Guest Representative", "email": "guest@example.com" } }

POST /api/v1/weddings/{weddingId}/invitations
{ "householdIds": ["507f1f77bcf86cd799439014"],
  "eventIds": ["507f1f77bcf86cd799439015"] }

POST /api/v1/weddings/{weddingId}/invitations/send
Idempotency-Key: wedding-send-operation-001
{ "invitationIds": ["507f1f77bcf86cd799439016"] }

202 Accepted
{ "data": { "queued": 1, "alreadyQueued": 0 } }
```

``` text
GET /api/v1/public/rsvp/{token}
200 OK
{ "data": { "householdName": "Sharma Family", "events": [
  { "eventId": "507f1f77bcf86cd799439015", "title": "Mehndi",
    "answer": null, "attendeeCount": 0 } ] } }

PUT /api/v1/public/rsvp/{token}
{ "eventId": "507f1f77bcf86cd799439015",
  "answer": "ACCEPTED", "attendeeCount": 4 }

200 OK
{ "data": { "eventId": "507f1f77bcf86cd799439015",
  "answer": "ACCEPTED", "attendeeCount": 4 } }
```

The guest token must identify the household and wedding; the target event must have an INVITED event_invitations row for the household. ACCEPTED requires attendeeCount \>= 1; DECLINED requires 0. Use an upsert on unique (weddingId, eventId, householdId). Repeating the same PUT must not increase counts or produce a second row.

## 4.7 Vendor lookup and saved shortlist

``` text
GET /api/v1/vendors/search?query=photographer&lat=12.97&lng=77.60
GET /api/v1/vendors/place/{placeId}

POST /api/v1/weddings/{weddingId}/vendors
{ "source": "GOOGLE", "placeId": "sample_place_id",
  "name": "Saved Photographer", "category": "PHOTOGRAPHY",
  "notes": "Ask about availability" }
```

Public vendor search and place details are proxied from Google Places with server-side API key, abuse controls, quota controls and required attribution. Persist the Place ID and independently entered wedding information only as allowed by current provider terms. Comparison is composed from place details and manually entered fields; no vendor booking or payment endpoint exists.

## 4.8 Private photo upload and gallery

``` text
POST /api/v1/public/uploads/{uploadToken}/intent
{ "eventId": "507f1f77bcf86cd799439015",
  "filename": "photo.jpg", "contentType": "image/jpeg",
  "sizeBytes": 1850000 }

200 OK
{ "data": { "uploadUrl": "<short-lived-presigned-R2-URL>",
  "method": "PUT", "headers": { "Content-Type": "image/jpeg" },
  "uploadTicket": "<signed-upload-receipt>",
  "expiresAt": "2027-03-18T15:00:00Z" } }

// Browser uploads directly to R2, then confirms:
POST /api/v1/public/uploads/{uploadToken}/complete
{ "uploadTicket": "<signed-upload-receipt>" }

201 Created
{ "data": { "mediaId": "507f1f77bcf86cd799439017",
  "status": "PENDING" } }
```

Completion verifies R2 object existence, ownership context, content signature, file size and allowed type before inserting PENDING metadata. The uploadTicket is a recommended tamper-proof receipt that avoids exposing internal R2 keys in the public API. An admin approval route may change status to APPROVED or REJECTED; guests never choose status.

``` text
PATCH /api/v1/weddings/{weddingId}/media/{mediaId}
{ "status": "APPROVED" }   // OWNER or ADMIN only

GET /api/v1/public/galleries/{galleryToken}
// Returns metadata only for APPROVED media

GET /api/v1/public/gallery-media/{galleryToken}/{mediaId}
// Authenticated by gallery capability: 302 to expiring signed URL,
// or 200 with expiring URL metadata (final response choice).
```

## 4.9 Site and livestream contracts

``` text
PATCH /api/v1/weddings/{weddingId}/website
{ "enabled": true, "slug": "celebration-2027",
  "visibility": "UNLISTED", "theme": "TRADITIONAL",
  "intro": "Welcome to our celebration" }

PUT /api/v1/weddings/{weddingId}/events/{eventId}/livestream
{ "youtubeVideoId": "sampleYouTubeId", "enabled": true }
```

UNLISTED means a hard-to-discover URL, not authentication; it cannot be used to protect invited-only schedules or guest data. Public site views include only appropriately visible event/website information, and YouTube embeds respect those boundaries.

# 5. Business rules, workflows and atomicity

## 5.1 Multi-step flows

| **Flow**              | **Required order / atomicity**                                                                                                                             |
|-----------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Account to wedding    | Signup/login → POST wedding → transaction inserts wedding + initial OWNER membership → dashboard.                                                          |
| Accept member invite  | Resolve authenticated user → validate role and tokenHash → transaction creates membership and consumes invite → reject concurrent double acceptance.       |
| Send household invite | Create/update event_invitations for chosen household(s) and event(s) → persist deduped email_jobs → worker dispatches → invited guest responds via link.   |
| Guest RSVP update     | Validate RSVP token + household + INVITED event → validate answer/count → unique keyed upsert → recalculate aggregates.                                    |
| Media upload          | Verify UPLOAD token → issue presigned R2 PUT → client PUT → verify object + content → insert PENDING media → Owner/Admin moderation → scoped gallery read. |
| Delete wedding event  | Check dependent RSVPs, invitations, tasks, budgets, expenses, media and livestream → require explicit resolution; no silent cascade.                       |
| Financial rollup      | Aggregate scoped expenses and budget entries; do not double count overall and event allocations; no paid/unpaid inference.                                 |

## 5.2 Integrity rules enforced at service boundary

- Only OWNER may grant OWNER/ADMIN; OWNER or ADMIN may invite/remove MANAGER; last OWNER is immutable.

- Every eventId, householdId, weddingVendorId, assigneeUserId and mediaId reference must be verified within the same wedding.

- Every event/household combination has at most one event_invitations row and one rsvps row; unique indexes back application checks.

- An invitation can be resent without creating duplicate relationship rows; sending a new message is a separate idempotent operation.

- Soft-deleted records are omitted by default from lists and aggregation totals; delete dependencies explicitly.

- All public RSVP, upload and gallery routes reject tokens of the wrong purpose or scope.

- Media remains invisible to gallery visitors until approved; rejection never makes a public URL available.

- Client-supplied finance totals, role labels and moderation status are not trusted.

# 6. Operational safeguards and integrations

## 6.1 Email delivery and worker

Invitation sends and reminders return 202 only after durable email_jobs records exist. The internal POST /internal/jobs/email-batch route authenticates with the cron secret and atomically leases due jobs in small batches. Recommended initial batch size: 20–25, subject to provider plan; retries use bounded exponential backoff. SUBMITTED means the email provider accepted a message, not that a guest received or opened it.

**Important unresolved security detail:** MongoDB stores only token hashes, but the email worker still needs the raw one-use URL to send. The implementation must define encrypted, short-lived delivery payload storage (for example, an encryptedPayload field in email_jobs, cleared after provider submission) or an equally secure durable handoff. A hash alone cannot reconstruct a link. This is a required pre-coding decision, not an existing solved behavior.

## 6.2 Rate limiting, quotas and caching

Apply member/login/password recovery limits, guest token submission limits, upload intent and completion limits, email send quotas, and Google Places query quotas. Without Redis, a MongoDB-backed counter approach is consistent with the V1 architecture. Numerical thresholds, R2 file limits, cron frequency and media retention are not yet fixed and must be configuration values.

## 6.3 Public visibility, response projection and logging

- Never return session token hashes, user password hashes, member/guest raw tokens, R2 object keys or email encrypted payloads.

- Guest link response projections contain only required display data for that household/event or approved gallery, not other guest PII.

- Log requestId, method, route template, status, duration and safe error code; do not log complete link URLs containing capabilities.

- External API failures must not bypass authorization: Places unavailable → appropriate upstream error; R2 incomplete → no approved media; Resend unavailable → retained PENDING email job.

- Use stable Zod validation before service methods; enforce idempotency and cross-wedding authorization in dedicated integration tests.

## 6.4 Structured modules and API ownership

| **Route group**                      | **Service module**             | **Collections / integration**                             |
|--------------------------------------|--------------------------------|-----------------------------------------------------------|
| /auth                                | auth                           | users, sessions, recovery token mechanism; Resend         |
| /weddings, /members, /member-invites | weddings, memberships          | weddings, wedding_members, member_invites                 |
| /events, /livestream                 | events, livestreams            | events, livestreams; YouTube embed ID                     |
| /tasks, /budgets, /expenses          | tasks, budgets, expenses       | tasks, budgets, expenses                                  |
| /households, /invitations, /rsvp     | households, invitations, rsvps | households, event_invitations, rsvps, guest_access_tokens |
| /vendors                             | vendors                        | wedding_vendors; Google Places adapter                    |
| /website, /public/weddings           | wedding-sites                  | website_configs, events, livestreams                      |
| /uploads, /media, /galleries         | media                          | media, guest_access_tokens; Cloudflare R2                 |
| /internal/jobs/email-batch           | emails                         | email_jobs; Resend adapter                                |

# 7. Testing, release gates and open decisions

## 7.1 Acceptance test matrix

| **Scenario**                                      | **Required observable result**                                              |
|---------------------------------------------------|-----------------------------------------------------------------------------|
| Unauthorized cross-wedding ID                     | No access or mutation; 404/403 consistently according to policy.            |
| Invite role escalation                            | Admin cannot grant ADMIN/OWNER; Manager cannot create member invites.       |
| Last owner removal                                | Rejected even under concurrent modification.                                |
| Concurrent invitation accept                      | Exactly one membership and one consumed invite.                             |
| Duplicate guest RSVP PUT                          | Single record; attendee counts correct after repeated or changed responses. |
| Uninvited event or wrong household token          | No RSVP details leaked; change rejected.                                    |
| Manager photo approval attempt                    | 403; PENDING remains private.                                               |
| Tampered R2 upload receipt                        | Completion rejected; no APPROVED media inserted.                            |
| Leaked/revoked gallery token                      | No approved image metadata or signed URL accessible.                        |
| Repeat invitation sends with same idempotency key | No duplicate email_jobs records for the same send operation.                |
| Email provider failure + worker restart           | Job retries safely after lease/backoff, provider submission state recorded. |
| Invalid money/time/timezone                       | Validation errors; no partial business record.                              |
| Places API unavailable                            | Search fails safely; saved manual vendor list still loads.                  |
| Public site with private events                   | Private event/household/RSVP information not returned.                      |

## 7.2 Decision register before coding

| **Open decision**             | **Recommended resolution / consequence**                                                                                                          |
|-------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| Public site visibility        | Approve PUBLIC versus UNLISTED; UNLISTED is not secret access control. Invitation-only events always private.                                     |
| Token lifetimes               | Set member invite expiration (72 hours proposed), guest RSVP/gallery/upload expiry, renewal and revoke rules.                                     |
| Password and session policy   | Set minimum password rules, session lifetime, logout-all semantics, reset-token expiry and abusive attempt thresholds.                            |
| Budget semantics              | Approve single overall budget plus optional event allocations and how event allocation totals relate to the overall ceiling.                      |
| Currencies                    | INR-only V1 recommended, while storing currency per record.                                                                                       |
| Photo upload limits           | Set max size, allowed image MIME/signatures, storage quota, orphan cleanup and retention.                                                         |
| Member-upload handling        | Approve whether same R2 flow is exposed to signed-in members for cover photos; proposed routes included.                                          |
| Website publication actions   | Confirm whether Manager can publish or only edit; this proposal grants Manager standard operations.                                               |
| Guest links                   | Define household-scoped versus event-scoped RSVP token and post-wedding expiration; proposal supports one household with multiple invited events. |
| Email worker link security    | Specify durable encrypted delivery payload/handoff; hashes cannot be emailed by reconstruction.                                                   |
| Public signed media retrieval | Choose redirect vs JSON signed URL and exact short TTL; both require approved media checks.                                                       |
| Cron deployment               | Vercel plan, schedule cadence, retry/lease durations and provider idempotency behavior.                                                           |

## 7.3 Suggested delivery milestones

Foundation: auth + memberships + weddings + events. Planning: tasks, budgets, expenses and dashboard. Guests: households, event invitations and RSVP. Communication: email jobs + cron worker. Vendors and experience: Places, shortlists, site themes and YouTube. Media: R2 uploads, moderation and gallery. Hardening: rate limits, CSRF, key management, backups, concurrency and tenant-isolation tests.

# Appendix A. Stable field/enumeration reference

| **Domain**          | **Approved or recommended values**           |
|---------------------|----------------------------------------------|
| Membership roles    | OWNER \| ADMIN \| MANAGER                    |
| Task status         | TODO \| IN_PROGRESS \| DONE (recommended)    |
| Task priority       | LOW \| MEDIUM \| HIGH (recommended)          |
| Invitation status   | DRAFT \| INVITED \| CANCELLED (recommended)  |
| RSVP answer         | ACCEPTED \| DECLINED; attendeeCount integer  |
| Guest token purpose | RSVP \| UPLOAD \| GALLERY                    |
| Media moderation    | PENDING \| APPROVED \| REJECTED              |
| Website theme       | TRADITIONAL \| MINIMAL \| ROYAL              |
| Website visibility  | PUBLIC \| UNLISTED (recommended)             |
| Email job status    | PENDING \| PROCESSING \| SUBMITTED \| FAILED |
| Vendor source       | MANUAL \| GOOGLE                             |

# Appendix B. Traceability and precedence

1. Make My Marriage — System Design Architecture, V1.0, 12 October 2026: §1 scope and role decisions; §2 modular monolith; §3 sessions and memberships; §4 collection/index baseline; §5 representative REST paths; §6 main flows; §7 R2/Resend/Places/YouTube; §8–14 security, reliability and tests.

2. Make My Marriage — Database Design Document, V1.0, 13 October 2026: eighteen collection schemas, logical relationships, data constraints, index recommendations, and open data decisions.

3. Precedence: approved product/stack decisions prevail; added endpoint names, limits, detailed payloads and implementation defaults here are recommendations for the V1 coding contract. They must be reviewed as a set, not mistaken for already implemented or approved APIs.

END OF API DESIGN V1
