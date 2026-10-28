# Development conventions

## Scope and source of truth

- This repository is Make My Marriage V1, a single Next.js + TypeScript modular monolith.
- Preserve the existing files in `docs/`. Use the latest explicit product decisions and finalized architecture when older PRD details conflict.
- The approved scope includes the scaffold, public homepage, and account-access slice (signup/login/logout, expiring sessions, MongoDB-backed accounts, and a protected welcome page). Wedding setup, memberships, business modules, password-recovery email, integrations, and jobs require explicit approval for a later phase. Read the project status document for actual completion and validation.
- Do not commit or push unless explicitly instructed.

## Project progress tracking

- Read `docs/project-status.md` when establishing the current project state before major feature work.
- Update `docs/project-status.md` as part of every major feature implementation or significant milestone. Keep its current-state summary and feature history accurate; update existing entries when a feature progresses rather than duplicating them.
- Record the date, status, implemented scope, validation performed, and material limitations or follow-up work. Preserve completed milestone history and include commit references when available.
- Distinguish implemented functionality from sample UI, placeholders, proposed work, and deferred features. Mark a milestone complete only when its agreed scope is implemented and required validation has passed; report partial or blocked work honestly.
- The status document tracks progress; it does not replace the PRD or architecture documents or authorize additional feature scope. Preserve existing design documents when updating progress.

## Architecture

- Use the App Router in `src/app` and REST Route Handlers under `src/app/api/v1`.
- Put domain code in `src/modules/<domain>`, reusable UI in `src/components`, and infrastructure in `src/lib`.
- Introduce `src/integrations/<provider>` only when that integration is implemented. Add other folders as they become necessary; avoid speculative files and abstractions.
- Keep route handlers thin: parse and validate input, delegate to services, and serialize safe responses.
- Services own business rules and authorization; repositories own database access. Pages rendered on the server can call authorized services directly.
- Keep models inside their domain modules. Do not import models, repositories, secrets, or integration clients into Client Components.
- Prefer Server Components; use `"use client"` only when browser interaction requires it.
- Use the Node.js runtime for future database and integration handlers. Do not introduce a separate backend, Redis, or microservices for V1.

## Code conventions

- Use strict TypeScript. Avoid `any`, unexplained type assertions, disabled checks, and unnecessary dependencies.
- Use `@/*` for imports from `src/`.
- Use kebab-case for folders and ordinary files, PascalCase for components and types, and camelCase for functions and variables. Follow Next.js reserved filenames.
- When implemented, use `<domain>.schema.ts` for Zod input schemas, `<domain>.model.ts` for Mongoose models, `<domain>.service.ts` for business logic, `<domain>.repository.ts` for persistence, and `<domain>.dto.ts` for response projections. Create only files needed by working code.
- Keep components readable, responsive, semantic, and keyboard accessible. Use Tailwind CSS and shared components when actual reuse exists.
- Use pnpm and retain `pnpm-lock.yaml`. Do not create npm or Yarn lockfiles.
- Format with Prettier and lint with the ESLint CLI; do not rely on the build to run ESLint.

## Security and future domain rules

- Never commit secrets or real credentials. Keep `.env.example` safe and update it when configuration is introduced.
- Only browser-safe values may use the `NEXT_PUBLIC_` prefix. Keep sensitive configuration on the server.
- The initial scaffold must run and build without external service credentials or remote font downloads.
- When business features are approved, enforce wedding membership and resource scope inside services on every operation. Never trust client-supplied roles or resource ownership.
- Finalized member roles are Owner, Admin, and Manager; signup email verification is removed. Guests use purpose-scoped links without accounts.
- Store money in integer minor units and represent wedding/event timezones explicitly when those domains are added.
- Never log passwords, bearer tokens, secret invitation URLs, or guest personal data.

## Validation

- Run `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, and `pnpm build` for scaffold/configuration changes. Confirm `pnpm dev` serves the homepage after startup changes.
- Add focused tests with future business behavior, especially authorization, cross-wedding isolation, and token lifecycle. Do not add empty test suites for this scaffold.
- CI installs with `pnpm install --frozen-lockfile`, then checks lint, types, formatting, and production build without service secrets.
- Report validation failures and material configuration limitations honestly.
