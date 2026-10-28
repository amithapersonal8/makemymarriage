# Make My Marriage — Project Status

Last updated: 27 October 2026

## Current state

The minimal application scaffold and public homepage UI are complete. Development continues from this existing Next.js + TypeScript foundation; the full V1 application is not yet implemented.

The homepage uses illustrative wedding data. Its Get started and Log in buttons intentionally have no click action. There is no authentication, database persistence, business API, email delivery, vendor integration, or media-storage integration in the application yet.

This document records implementation progress. Product scope and architecture remain governed by the design documents, `AGENTS.md`, and the latest explicit user decisions. Future feature work requires approval.

## Milestone overview

| Milestone | Status | Completed | Reference |
| --- | --- | --- | --- |
| Minimal project scaffold | Complete | 21 October 2026 | `3745d7b` |
| Public homepage UI | Complete, with follow-up noted below | 27 October 2026 | `547eba3` |

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

Follow-up identified in review: shared header/footer links use local anchors such as `#features`. On the existing 404 page, those targets do not exist. Change shared navigation to homepage-qualified links such as `/#features` in a future fix. This issue remained open when the homepage was committed.

## Upcoming work — not yet implemented

The discussed direction is to resolve authentication/session and authorization decisions, then incrementally build authentication, wedding workspaces, events, and family collaboration. Planning, households/RSVPs, communication, vendors, wedding websites/livestreams, and media follow according to their dependencies.

This is a planning direction, not approval to begin those features. Define and approve each milestone's scope and acceptance criteria before implementation.

## Updating this document

For each major feature or significant milestone:

1. Update the current-state summary and milestone overview.
2. Add or revise its feature-history entry with date, status, implemented scope, actual validation results, and remaining limitations or follow-ups.
3. Include a commit reference when one exists; do not invent references or claim checks were run when they were not.
4. Preserve earlier completed milestones and resolve follow-up notes when the corresponding fixes are delivered.
