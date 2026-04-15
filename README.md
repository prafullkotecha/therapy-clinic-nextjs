# Therapy Clinic Next.js

Multi-tenant, HIPAA-aware behavioral therapy clinic management platform built with Next.js, TypeScript, PostgreSQL, and Drizzle ORM.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker and Docker Compose

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.example .env.local
   ```
3. Start local infrastructure:
   ```bash
   docker compose up -d
   ```
4. Run migrations:
   ```bash
   npm run db:migrate
   ```
5. Seed local data:
   ```bash
   npm run db:seed
   ```
6. Start the app:
   ```bash
   npm run dev
   ```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes (if Redis features enabled) | Redis connection string |
| `REDIS_PASSWORD` | No | Optional Redis password used by Docker setup |
| `AUTH_SECRET` | Yes | Auth.js/NextAuth signing secret (v5 naming) |
| `AUTH_URL` | Yes | Public auth callback base URL |
| `NEXTAUTH_SECRET` | Optional | Legacy NextAuth v4 secret compatibility |
| `NEXTAUTH_URL` | Optional | Legacy NextAuth v4 URL compatibility |
| `KEYCLOAK_URL` | Yes for Keycloak auth | Keycloak base URL |
| `KEYCLOAK_REALM` | Yes for Keycloak auth | Keycloak realm name |
| `KEYCLOAK_CLIENT_ID` | Yes for Keycloak auth | Keycloak client ID |
| `KEYCLOAK_CLIENT_SECRET` | Yes for Keycloak auth | Keycloak client secret |
| `PHI_ENCRYPTION_KEY` | Yes | 64-char hex key for PHI encryption |
| `PHI_ENCRYPTION_KEY_ID` | Yes | PHI key identifier for rotation support |
| `AWS_REGION` | Optional | AWS region for KMS integration |
| `AWS_KMS_KEY_ID` | Optional | AWS KMS key identifier |
| `ARCJET_KEY` | Optional | Arcjet security key |
| `SENTRY_DSN` | Optional | Sentry DSN |
| `NEXT_PUBLIC_APP_URL` | Optional | Public app URL |

Refer to `.env.example` for the complete template.

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- PostgreSQL + Drizzle ORM
- Keycloak + NextAuth/Auth.js
- Redis
- Vitest + Playwright
- Tailwind CSS 4

## Common commands

```bash
npm run dev
npm run build
npm run test:unit
npm run lint
npm run db:migrate
npm run db:seed
```

## Contributing

1. Create a feature branch.
2. Keep changes minimal and scoped to the issue.
3. Add or update Vitest tests for all changed behavior.
4. TypeScript rule: never use the `any` type in application or test code.
5. Run targeted tests locally, then run broader checks (`npm run test:unit`, `npm run build`).
6. Open a pull request with a clear summary and linked issue numbers.
