# Make My Marriage — Database Design Document

Make My Marriage \| Version 1.0 \| Implementation specification

Prepared: 13 October 2026 • Status: Proposed database design aligned to approved architecture

# Executive summary

A single MongoDB Atlas database supports a multi-tenant wedding-management application. Wedding-owned records carry weddingId and are authorized through wedding_members. References are used for unbounded lists; embedded objects are used for small stable structures. This design expands section 4 of the System Design Architecture V1 and should be reviewed before Mongoose implementation.

# 1. Authority, conventions and decisions

| Topic          | V1 design                                                                              |
|----------------|----------------------------------------------------------------------------------------|
| Primary source | Make My Marriage — System Design Architecture V1, 12 October 2026                      |
| Users          | One global users record per identity; users may join multiple weddings                 |
| Roles          | OWNER, ADMIN, MANAGER; guests do not have accounts                                     |
| Identifiers    | MongoDB ObjectId internally, serialized as string in APIs                              |
| Tenancy        | Every wedding-owned record has required weddingId; verified tenancy on every query     |
| Money          | amountMinor as integer paise; currency INR by default; do not mix currencies in totals |
| Time           | UTC Date fields and IANA timezone on wedding/event                                     |
| Soft deletion  | deletedAt for applicable business records, with partial unique indexes if needed       |
| Timestamps     | createdAt and updatedAt on collections, except append-only records when noted          |
| Security       | Persist token hashes; never persist plaintext invitation/session/link tokens           |

Design status: the collection families, technology and tenant isolation derive from the architecture baseline. Field-level choices, enums, defaults and additional indexes below are implementation recommendations, not new approved product features.

# 2. Relationship model

```text
users 1 ─── * wedding_members * ─── 1 weddings
weddings 1 ─── * events
weddings 1 ─── * households
households 1 ─── * event_invitations * ─── 1 events
event_invitations 1 ─── 0..1 rsvps
weddings 1 ─── * tasks / expenses / wedding_vendors / media
weddings 1 ─── 0..1 website_configs
events 1 ─── 0..1 livestreams
weddings 1 ─── * guest_access_tokens / member_invites / email_jobs
```

Relations are logical, not database-enforced foreign keys. Mongoose service methods must check same-wedding ownership when writing referenced ObjectIds. The RSVP is uniquely paired with one event invitation.

# 3. Collection catalogue

Field notation: ObjectId references another collection; Date is a UTC instant; string enums are illustrated in uppercase. Required/default details are proposed unless explicitly fixed in the architecture.

## 3.1 users

Global account identity; no email verification at initial signup.

| Field                 | Type / meaning                      |
|-----------------------|-------------------------------------|
| \_id                  | ObjectId, PK                        |
| name                  | string, required, trimmed           |
| normalizedEmail       | string, required, lowercase, unique |
| passwordHash          | string, required; Argon2id          |
| disabledAt            | Date \| null                        |
| createdAt / updatedAt | Date                                |

Indexes: { normalizedEmail: 1 } unique

Rules: Never return passwordHash in API responses. Normalize email consistently before uniqueness checks.

## 3.2 sessions

Opaque, revocable authenticated login sessions.

| Field      | Type / meaning             |
|------------|----------------------------|
| \_id       | ObjectId                   |
| userId     | ObjectId → users; required |
| tokenHash  | string, unique, required   |
| expiresAt  | Date, required             |
| revokedAt  | Date \| null               |
| lastUsedAt | Date \| null, recommended  |
| createdAt  | Date                       |

Indexes: { tokenHash: 1 } unique; { userId: 1, revokedAt: 1 }; TTL on expiresAt

Rules: Check expiry and revocation on every authorized request; TTL deletion is only cleanup.

## 3.3 weddings

Top-level tenant and basic wedding details.

| Field                 | Type / meaning                                      |
|-----------------------|-----------------------------------------------------|
| \_id                  | ObjectId                                            |
| title                 | string, required                                    |
| brideName / groomName | string                                              |
| startDate / endDate   | Date \| null                                        |
| timezone              | IANA timezone string, required                      |
| location              | embedded Venue/Address object, optional             |
| coverMediaId          | ObjectId → media \| null                            |
| status                | DRAFT \| ACTIVE \| COMPLETED \| ARCHIVED (proposed) |
| createdAt / updatedAt | Date                                                |

Indexes: { status: 1, createdAt: -1 } optional

Rules: Create wedding and initial OWNER membership atomically.

## 3.4 wedding_members

Membership and authorization join between users and weddings.

| Field                 | Type / meaning                |
|-----------------------|-------------------------------|
| \_id                  | ObjectId                      |
| weddingId             | ObjectId → weddings, required |
| userId                | ObjectId → users, required    |
| role                  | OWNER \| ADMIN \| MANAGER     |
| joinedAt              | Date                          |
| createdAt / updatedAt | Date                          |

Indexes: { weddingId: 1, userId: 1 } unique; { userId: 1, weddingId: 1 }

Rules: Prevent deletion/demotion of last OWNER; ADMIN cannot manage OWNER membership.

## 3.5 member_invites

Single-use staff invitation records.

| Field                 | Type / meaning                                                |
|-----------------------|---------------------------------------------------------------|
| \_id                  | ObjectId                                                      |
| weddingId             | ObjectId → weddings                                           |
| email                 | normalized destination email                                  |
| role                  | OWNER \| ADMIN \| MANAGER, constrained by inviter permissions |
| tokenHash             | string, high entropy, unique                                  |
| status                | PENDING \| ACCEPTED \| REVOKED \| EXPIRED                     |
| expiresAt             | Date                                                          |
| acceptedAt            | Date \| null                                                  |
| invitedByUserId       | ObjectId → users (recommended)                                |
| createdAt / updatedAt | Date                                                          |

Indexes: { tokenHash: 1 } unique; { weddingId: 1, status: 1 }; TTL optional

Rules: Consume invite and create/upsert membership in a transaction; token possession grants invite authority, not verified email ownership.

## 3.6 events

Wedding ceremonies or activities, with their own schedules and venues.

| Field           | Type / meaning                                              |
|-----------------|-------------------------------------------------------------|
| \_id            | ObjectId                                                    |
| weddingId       | ObjectId → weddings                                         |
| type            | string, e.g. MEHNDI / SANGEET / WEDDING / OTHER; extensible |
| title           | string, required                                            |
| description     | string \| null                                              |
| startAt / endAt | Date, UTC                                                   |
| timezone        | IANA timezone                                               |
| venue           | embedded Venue object                                       |
| coverMediaId    | ObjectId → media \| null                                    |
| visibility      | PUBLIC \| INVITED_ONLY (recommended)                        |
| deletedAt       | Date \| null                                                |

Indexes: { weddingId: 1, startAt: 1 }; { weddingId: 1, deletedAt: 1 }

Rules: startAt \<= endAt; only show public events on public site. Never silently cascade event deletion.

## 3.7 tasks

Planning work assigned to wedding members.

| Field          | Type / meaning              |
|----------------|-----------------------------|
| \_id           | ObjectId                    |
| weddingId      | ObjectId → weddings         |
| eventId        | ObjectId → events \| null   |
| assigneeUserId | ObjectId → users \| null    |
| title          | string, required            |
| description    | string \| null              |
| dueAt          | Date \| null                |
| status         | TODO \| IN_PROGRESS \| DONE |
| priority       | LOW \| MEDIUM \| HIGH       |
| deletedAt      | Date \| null                |

Indexes: { weddingId: 1, status: 1, dueAt: 1 }; { weddingId: 1, eventId: 1 }

Rules: Assignee must have membership in same wedding; eventId must belong to wedding.

## 3.8 budgets

One wedding-wide or per-event budget entry.

| Field                 | Type / meaning            |
|-----------------------|---------------------------|
| \_id                  | ObjectId                  |
| weddingId             | ObjectId → weddings       |
| eventId               | ObjectId → events \| null |
| amountMinor           | integer \>= 0; paise      |
| currency              | ISO 4217, INR default     |
| createdAt / updatedAt | Date                      |

Indexes: { weddingId: 1, eventId: 1 } unique (including explicit null for overall budget)

Rules: Use consistent null convention for overall budget. Event budget totals must not be double-counted with overall budget.

## 3.9 expenses

Recorded expense amounts, not proof of payment.

| Field           | Type / meaning                     |
|-----------------|------------------------------------|
| \_id            | ObjectId                           |
| weddingId       | ObjectId → weddings                |
| eventId         | ObjectId → events \| null          |
| weddingVendorId | ObjectId → wedding_vendors \| null |
| title           | string, required (recommended)     |
| category        | string, required                   |
| amountMinor     | integer \>= 0; paise               |
| currency        | ISO 4217, default INR              |
| incurredAt      | Date                               |
| notes           | string \| null                     |
| deletedAt       | Date \| null                       |

Indexes: { weddingId: 1, eventId: 1, incurredAt: -1 }; { weddingId: 1, category: 1 }

Rules: Enforce same-wedding event/vendor references; do not model payment schedules in V1.

## 3.10 households

One representative for a group of invited family members.

| Field                 | Type / meaning                   |
|-----------------------|----------------------------------|
| \_id                  | ObjectId                         |
| weddingId             | ObjectId → weddings              |
| name                  | string, household label          |
| representative        | embedded { name, email, phone? } |
| notes                 | string \| null                   |
| deletedAt             | Date \| null                     |
| createdAt / updatedAt | Date                             |

Indexes: { weddingId: 1, representative.email: 1 } nonunique; { weddingId: 1, name: 1 } optional

Rules: Do not make email unique: shared addresses and duplicate contacts are legitimate. Import should offer explicit deduplication rather than silently merging households.

## 3.11 event_invitations

Links one household to each invited wedding event.

| Field                 | Type / meaning                |
|-----------------------|-------------------------------|
| \_id                  | ObjectId                      |
| weddingId             | ObjectId → weddings           |
| eventId               | ObjectId → events             |
| householdId           | ObjectId → households         |
| status                | DRAFT \| INVITED \| CANCELLED |
| invitedAt             | Date \| null                  |
| createdAt / updatedAt | Date                          |

Indexes: { weddingId: 1, eventId: 1, householdId: 1 } unique; { weddingId: 1, householdId: 1 }

Rules: Validate event and household belong to same wedding. Re-sends should not create duplicate invitation relationships.

## 3.12 rsvps

One current RSVP per household and event.

| Field                 | Type / meaning                             |
|-----------------------|--------------------------------------------|
| \_id                  | ObjectId                                   |
| weddingId             | ObjectId → weddings                        |
| eventId               | ObjectId → events                          |
| householdId           | ObjectId → households                      |
| eventInvitationId     | ObjectId → event_invitations (recommended) |
| answer                | ACCEPTED \| DECLINED                       |
| attendeeCount         | integer \>= 0                              |
| respondedAt           | Date                                       |
| createdAt / updatedAt | Date                                       |

Indexes: { weddingId: 1, eventId: 1, householdId: 1 } unique

Rules: ACCEPTED requires attendeeCount \>= 1; DECLINED requires 0; update via idempotent upsert after valid event-scoped invitation check.

## 3.13 guest_access_tokens

Purpose-scoped secret links for guest RSVP, uploads and galleries.

| Field       | Type / meaning                                |
|-------------|-----------------------------------------------|
| \_id        | ObjectId                                      |
| weddingId   | ObjectId → weddings                           |
| householdId | ObjectId → households \| null                 |
| eventId     | ObjectId → events \| null (recommended scope) |
| purpose     | RSVP \| UPLOAD \| GALLERY                     |
| tokenHash   | string, unique                                |
| expiresAt   | Date \| null                                  |
| revokedAt   | Date \| null                                  |
| createdAt   | Date                                          |

Indexes: { tokenHash: 1 } unique; { weddingId: 1, purpose: 1 }

Rules: Validate purpose and wedding on every request. Gallery and upload tokens must not authorize RSVP. Guest links must never be logged.

## 3.14 wedding_vendors

Wedding-specific shortlist or manually maintained vendor information.

| Field              | Type / meaning                                                 |
|--------------------|----------------------------------------------------------------|
| \_id               | ObjectId                                                       |
| weddingId          | ObjectId → weddings                                            |
| source             | MANUAL \| GOOGLE                                               |
| placeId            | string \| null; Google Place ID                                |
| name               | string, required                                               |
| category           | string                                                         |
| userEnteredContact | embedded contact, optional                                     |
| estimateMinor      | integer \| null, proposed                                      |
| currency           | INR by default                                                 |
| notes              | string \| null                                                 |
| eventIds           | ObjectId\[\] → events, bounded; or relation if growth warrants |
| deletedAt          | Date \| null                                                   |

Indexes: { weddingId: 1, category: 1 }; { weddingId: 1, placeId: 1 } partial unique where placeId is string (optional)

Rules: Store Google Place ID and independently entered data; respect current Google Maps Platform storage restrictions. No vendor account or booking in V1.

## 3.15 website_configs

One website presentation configuration per wedding.

| Field                 | Type / meaning                                       |
|-----------------------|------------------------------------------------------|
| \_id                  | ObjectId                                             |
| weddingId             | ObjectId → weddings, unique                          |
| enabled               | boolean                                              |
| visibility            | PUBLIC \| UNLISTED (proposed)                        |
| slug                  | string, unique when set                              |
| theme                 | TRADITIONAL \| MINIMAL \| ROYAL                      |
| intro                 | string \| null                                       |
| mediaIds              | ObjectId\[\] → media, bounded presentation selection |
| createdAt / updatedAt | Date                                                 |

Indexes: { weddingId: 1 } unique; { slug: 1 } unique partial

Rules: Do not expose invitation-only events or guest PII on wedding-site endpoints; switching theme changes presentation, not access rights.

## 3.16 media

Metadata for R2 objects and administrative moderation.

| Field                 | Type / meaning                  |
|-----------------------|---------------------------------|
| \_id                  | ObjectId                        |
| weddingId             | ObjectId → weddings             |
| eventId               | ObjectId → events \| null       |
| r2Key                 | string, unique private key      |
| type                  | PHOTO / COVER (proposed)        |
| mime                  | validated MIME type             |
| bytes                 | integer \>= 0                   |
| status                | PENDING \| APPROVED \| REJECTED |
| uploadedByUserId      | ObjectId → users \| null        |
| createdAt / updatedAt | Date                            |

Indexes: { r2Key: 1 } unique; { weddingId: 1, status: 1, createdAt: -1 }

Rules: Upload completion must confirm the R2 object. Only OWNER/ADMIN may approve. PENDING and REJECTED objects must not be served in galleries.

## 3.17 livestreams

Configured YouTube embeds linked to a wedding event.

| Field                 | Type / meaning      |
|-----------------------|---------------------|
| \_id                  | ObjectId            |
| weddingId             | ObjectId → weddings |
| eventId               | ObjectId → events   |
| youtubeVideoId        | string, validated   |
| enabled               | boolean             |
| createdAt / updatedAt | Date                |

Indexes: { weddingId: 1, eventId: 1 } unique

Rules: Embed only, no video hosting; apply event/site visibility.

## 3.18 email_jobs

Durable, restart-safe queue for Resend invitations and reminders.

| Field                 | Type / meaning                                              |
|-----------------------|-------------------------------------------------------------|
| \_id                  | ObjectId                                                    |
| weddingId             | ObjectId → weddings \| null                                 |
| type                  | MEMBER_INVITE \| GUEST_INVITE \| REMINDER \| PASSWORD_RESET |
| recipient             | email string                                                |
| payloadRef            | safe reference or sanitized template data                   |
| status                | PENDING \| PROCESSING \| SUBMITTED \| FAILED                |
| attempts              | integer, default 0                                          |
| nextAttemptAt         | Date                                                        |
| leaseUntil            | Date \| null                                                |
| providerMessageId     | string \| null                                              |
| dedupeKey             | string, unique                                              |
| lastErrorCode         | string \| null                                              |
| createdAt / updatedAt | Date                                                        |

Indexes: { dedupeKey: 1 } unique; { status: 1, nextAttemptAt: 1, leaseUntil: 1 }

Rules: Worker claims jobs atomically. SUBMITTED means accepted by provider, not delivered. Avoid putting raw secret tokens in persisted email payloads.

# 4. Standard embedded objects

| Object          | Fields / guidance                                                                                                                                     |
|-----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| Venue           | venueName, address {line1, line2?, city, state?, postalCode?, country}, point? {type:"Point", coordinates:\[longitude,latitude\]}, mapsUrl?, placeId? |
| Representative  | name, email, phone?; email normalized where present                                                                                                   |
| Currency amount | amountMinor integer plus currency code; display conversion must not mutate stored values                                                              |
| Timestamps      | createdAt, updatedAt added with timestamps:true; optional deletedAt on selected records                                                               |

# 5. Recommended indexes and guardrails

- All list queries begin with weddingId when data is wedding-owned; compound indexes should align with actual sort and filter patterns.

- Enforce unique (weddingId,userId), (weddingId,eventId,householdId) on invitations and RSVPs, and one website_configs per wedding.

- Unique tokenHash and session tokenHash indexes; use expiresAt checks irrespective of TTL cleanup lag.

- Partial unique slug index avoids duplicate published slugs while allowing multiple unset slugs.

- Avoid indiscriminate indexes: each index has write/storage cost; verify with explain() and actual request patterns.

- MongoDB references do not enforce foreign keys: check weddingId and existence of every referenced resource before saving.

# 6. Core workflows and transaction boundaries

| Workflow             | Atomicity / authorization rule                                                                                                    |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Create wedding       | Transaction: insert weddings + OWNER membership; recover cleanly on failure.                                                      |
| Accept member invite | Transaction: validate and consume single-use invite + insert membership; handle duplicate concurrent accept.                      |
| Send guest invites   | Create missing event_invitations and deterministic email_jobs; jobs deduped per intended send operation.                          |
| RSVP change          | Validate token + matching household and event invitation; upsert one RSVP by unique triple.                                       |
| Photo upload         | R2 upload is external to Mongo transaction; completion verifies object before inserting PENDING media, orphan cleanup separately. |
| Approve photo        | Server authorization OWNER/ADMIN; update media status; gallery retrieval filters APPROVED.                                        |
| Event deletion       | Explicitly reject or orchestrate dependent tasks, invites, RSVPs, budgets, expenses, streams, media; no silent cascade.           |
| Dashboard            | Aggregate budgets/expenses/RSVPs from authoritative rows, scoped to wedding; avoid stale counters.                                |

# 7. Example document shapes

```javascript
// event_invitations
{ _id: ObjectId('...'), weddingId: ObjectId('...'),
eventId: ObjectId('...'), householdId: ObjectId('...'),
status: 'INVITED', invitedAt: ISODate('2026-10-13T12:00:00Z') }

// rsvps
{ _id: ObjectId('...'), weddingId: ObjectId('...'),
eventId: ObjectId('...'), householdId: ObjectId('...'),
answer: 'ACCEPTED', attendeeCount: 4,
respondedAt: ISODate('2026-10-13T13:00:00Z') }

// expenses
{ _id: ObjectId('...'), weddingId: ObjectId('...'),
eventId: ObjectId('...'), category: 'CATERING',
title: 'Catering deposit', amountMinor: 2500000,
currency: 'INR', incurredAt: ISODate('2026-10-13T00:00:00Z') }
```

# 8. Security, retention and privacy

- Server derives authenticated membership; client-supplied weddingId never alone establishes permission.

- No direct R2 URLs stored as publicly readable photo fields. Signed retrieval URLs are short-lived and permission checked.

- Use hashed, purpose-isolated capability tokens. Consider HMAC-SHA-256 for high-entropy random tokens, with a server-held key and consistent rotation strategy.

- Minimize exposure of guest names, phone numbers, email and RSVP data. Limit access to wedding members; public wedding website cannot query guest collections.

- Rate-limit auth, token uses, guest uploads, invitation sends and Places searches. Use Mongo-backed counters if needed under V1 constraints.

- Define document and R2 object retention, account deletion, wedding deletion, backup duration and recovery before production.

# 9. Suggested TypeScript/Mongoose implementation rules

- Keep schema definitions in domain modules; connect with shared cached Node.js Mongoose connection.

- Use strict schema mode, validated enums, trim/lowercase setters where appropriate, timestamps and explicit index declarations.

- Do not rely on Mongoose validation for authorization. Validate REST inputs with Zod, then authorize in services, then persist.

- Disable automatic index building in production deployment; create and verify indexes through deliberate migrations.

- Use ObjectId strings at API boundaries; validate and convert only on server. Project output fields and exclude secrets by default.

- Use session-aware transactions for multi-document changes; Atlas must support transactions.

# 10. Open decisions to approve before coding

| Decision               | Recommended default / reason                                                                                           |
|------------------------|------------------------------------------------------------------------------------------------------------------------|
| Website visibility     | PUBLIC or UNLISTED; decide whether public event metadata is exposed by default.                                        |
| Guest token lifespan   | Configurable with revocation; define post-event/wedding expiration.                                                    |
| Member invite expiry   | 72 hours (recommendation); one use only.                                                                               |
| Media quotas           | Per-file cap, per-wedding storage cap, cleanup deadline for orphaned uploads.                                          |
| Expense currency       | INR-only V1 simplifies aggregation, though store currency explicitly.                                                  |
| Budget semantics       | One overall target plus optional event allocations; avoid adding both as if independent budgets.                       |
| Soft-delete policy     | For business records where recoverability matters; retention/deletion timeline still to be defined.                    |
| Email payload security | Store template IDs/reference data rather than raw tokens where possible; generate tokenized URLs securely for sending. |

# 11. Implementation sequence and acceptance tests

Sequence: (1) users/sessions/weddings/memberships; (2) events/tasks/budgets/expenses; (3) households/event invitations/RSVPs/tokens; (4) email jobs; (5) vendors/website/livestreams; (6) media and gallery moderation. Create indexes with each migration and test cross-wedding attacks.

- Duplicate user email or duplicate wedding membership is rejected at database index level.

- Owner membership is never left missing after wedding creation; the last owner cannot be removed.

- A token from wedding A cannot RSVP, upload or read gallery for wedding B.

- Concurrent RSVP updates produce exactly one row for each household/event and correct total attendees.

- Guests cannot RSVP to events for which their household has no invitation.

- A Manager cannot approve PENDING photos; only APPROVED photos appear in a valid private gallery.

- Currency units are never floating-point and finance queries do not double-count overall vs event budgets.

- Repeated email-worker runs cannot claim a leased job simultaneously; retry state survives restarts.

# Appendix: source alignment

Baseline: “Make My Marriage — System Design Architecture”, Version 1.0, prepared 12 October 2026, sections 1–4, 6–8, 10–14. The source lists 18 core collections and recommends weddingId tenant boundaries, token hashing, scoped guest links, email jobs and unique RSVP relationships. This database document expands that architecture into an implementation-ready proposal. Its new field-level recommendations should not be treated as approved product changes until reviewed.
