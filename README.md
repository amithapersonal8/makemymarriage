# Make My Marriage

An India-first wedding planning application. V1 uses a single Next.js + TypeScript modular monolith.

This initial scaffold contains a responsive application shell and placeholder homepage. Business features, authentication, database access, external integrations, background jobs, and test frameworks are deferred. No external credentials or environment variables are required to run or build it.

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

Copy `.env.example` to `.env.local` when local configuration is needed; this step is optional for the scaffold. Do not put real secrets in `.env.example` or commit local environment files. Only browser-safe values may use `NEXT_PUBLIC_`.

## Commands

| Command             | Purpose                                                       |
| ------------------- | ------------------------------------------------------------- |
| `pnpm dev`          | Start the local development server                            |
| `pnpm lint`         | Run ESLint; warnings fail the check                           |
| `pnpm lint:fix`     | Apply automatic ESLint fixes                                  |
| `pnpm typecheck`    | Generate Next.js route types and run strict TypeScript checks |
| `pnpm format`       | Format project files with Prettier                            |
| `pnpm format:check` | Check formatting without editing files                        |
| `pnpm build`        | Build the production application                              |
| `pnpm start`        | Serve the production application after building               |

Prettier excludes `docs/` to preserve the existing design documents. Generated Next.js files, local environment files, dependencies, and build artifacts are ignored by Git.

## Structure

```text
.github/workflows/ci.yml        Local validation checks in GitHub Actions
docs/                          Existing product and technical designs
public/                        Static assets, reserved
src/
  app/
    api/v1/                    REST API location, reserved; no endpoints yet
    globals.css                Tailwind CSS import and base styles
    layout.tsx                 Root document and application shell
    page.tsx                   Minimal placeholder homepage
  components/
    layout/app-shell.tsx       Shared responsive header, main, and footer
    ui/                        Shared UI primitives, reserved
  lib/                         Infrastructure utilities, reserved
  modules/                     Domain modules, reserved
AGENTS.md                      Development and architecture conventions
```

Empty foundational directories contain only `.gitkeep` so they survive checkout. Domain subfolders, authentication/dashboard route groups, guest routes, `src/integrations`, jobs, database scripts, and test suites will be added when their implementation phase is approved. There are no domain placeholders or fake APIs.

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

GitHub Actions runs on pushes and pull requests. It installs from the frozen pnpm lockfile, then checks lint, types, formatting, and the production build. The workflow needs no external service secrets and does not deploy the application.

## Next development phase

After explicit approval, define authentication/session policies and tenant authorization rules, then implement the first foundation slice: signup/login, wedding creation with Owner membership, and event creation. Add database setup, migrations, and focused authorization tests as part of that phase.
