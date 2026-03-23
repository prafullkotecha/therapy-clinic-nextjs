# Verification Matrix Checklist Template (Approval Draft)

This template is the concrete verification matrix to approve before implementing automated checks.

## Global Readiness Gates (Apply to Every Issue)

- [ ] Branch/commit target identified
- [ ] Required environment variables available in `.env.local`
- [ ] `npm run check:types` passes (or existing baseline failure documented)
- [ ] `npm run lint` passes (or existing baseline failure documented)
- [ ] Relevant tests pass for changed scope
- [ ] App startup verification completed when runtime behavior is in scope
- [ ] Evidence captured (command output, logs, screenshots where UI is changed)

## Priority Order (Fixed)

1. #176
2. #174
3. #56
4. #175
5. #177
6. #101
7. #97
8. #53
9. #77
10. #52

---

## #176 — Remove `.env` from version control and secure env handling

### Scope Checklist
- [ ] `.env` is ignored in `.gitignore`
- [ ] `.env` is not tracked by git
- [ ] `.env.example` exists with placeholders
- [ ] Setup docs instruct using `.env.local` for local secrets
- [ ] Secret rotation task is tracked as an operational follow-up

### Automated Verification Checklist
- [ ] Assert `.env` is ignored and untracked
- [ ] Assert `.env.example` exists
- [ ] Assert docs reference `.env.local` workflow

### Evidence
- [ ] Git status/query output
- [ ] Relevant docs excerpt

### Blockers / Inputs
- [ ] Confirmation of external secret rotation completion

---

## #174 — Fix Keycloak DB URL in docker-compose

### Scope Checklist
- [ ] Keycloak DB host points to the compose service network name
- [ ] Compose networking resolves DB host from Keycloak container
- [ ] Auth stack startup is documented for local verification

### Automated Verification Checklist
- [ ] Compose config resolves without errors
- [ ] Postgres and Keycloak containers report healthy
- [ ] Keycloak logs show successful DB connection

### Evidence
- [ ] `docker compose ps` / logs output
- [ ] Keycloak health check output

### Blockers / Inputs
- [ ] Docker runtime availability in validation environment

---

## #56 — Fix production pre-render error (`/en/dashboard`)

### Scope Checklist
- [ ] Production build no longer fails on dashboard pre-render path
- [ ] Route behavior remains correct with authentication boundaries
- [ ] Dashboard rendering path is covered by regression checks

### Automated Verification Checklist
- [ ] Reproduction case exists for old failure mode
- [ ] Build verification includes dashboard pre-render path
- [ ] Targeted regression tests pass

### Evidence
- [ ] Build logs showing no pre-render crash
- [ ] Test output for dashboard regression checks

### Blockers / Inputs
- [ ] Confirm expected static/dynamic rendering behavior if ambiguous

---

## #175 — Add Redis service to docker-compose + setup

### Scope Checklist
- [ ] Redis service is present in compose configuration
- [ ] `REDIS_URL` is documented in `.env.example`
- [ ] Local setup docs mention Redis dependency

### Automated Verification Checklist
- [ ] Compose starts Redis successfully
- [ ] Redis health/connectivity check passes
- [ ] Env and docs consistency checks pass

### Evidence
- [ ] Compose output and Redis connectivity output
- [ ] Docs/env excerpt

### Blockers / Inputs
- [ ] Clarify whether explicit Redis client dependency changes are required

---

## #177 — Clean boilerplate remnants + branding

### Scope Checklist
- [ ] Remove `src/components/Hello.tsx`
- [ ] Remove `Schema.ts.backup`
- [ ] Remove/replace remaining agreed boilerplate artifacts
- [ ] Validate branding values in app config/content

### Automated Verification Checklist
- [ ] Assert removed files are absent
- [ ] Search-based checks for blocked boilerplate markers
- [ ] Branding string checks for agreed identifiers

### Evidence
- [ ] File tree/search output
- [ ] Config snippet(s)

### Blockers / Inputs
- [ ] Final approved list of boilerplate artifacts and target branding terms

---

## #101 — Complete `appointment.service.ts` modularization

### Scope Checklist
- [ ] Modular structure exists for appointment domains
- [ ] Imports/reference paths are updated
- [ ] Backward compatibility path is explicit (if needed)
- [ ] API consumers continue working

### Automated Verification Checklist
- [ ] Static import checks pass
- [ ] Appointment service unit tests pass
- [ ] Appointment API integration checks pass

### Evidence
- [ ] Test output for appointment modules/routes
- [ ] Search output showing updated imports

### Blockers / Inputs
- [ ] Decision on compatibility approach for legacy import paths

---

## #97 — Seed refactor to factory pattern + comprehensive data

### Scope Checklist
- [ ] Factory modules are present and used by seed script
- [ ] Factories expose expected creation patterns
- [ ] Tenant context and PHI encryption behavior are preserved
- [ ] Seed volume/config controls are documented

### Automated Verification Checklist
- [ ] Factory unit tests pass
- [ ] Seed run succeeds in controlled DB
- [ ] Assertions confirm tenant scoping and encrypted PHI fields

### Evidence
- [ ] Seed command output
- [ ] Test logs for factories/seeding

### Blockers / Inputs
- [ ] Confirm whether phase-2 entities are in current scope

---

## #53 — Dashboard data integration (replace mock data)

> Constraint for this pass: **exclude performance assertions**.

### Scope Checklist
- [ ] Dashboard data is sourced from live backend/data services
- [ ] Activity feed uses real records
- [ ] Role-based visibility is enforced
- [ ] Mock-only code paths are removed or clearly guarded

### Automated Verification Checklist
- [ ] Dashboard service/query integration checks pass
- [ ] RBAC/role-visibility tests pass
- [ ] Endpoint/UI checks validate live data wiring

### Evidence
- [ ] Integration test output
- [ ] Role-based verification output or screenshots

### Blockers / Inputs
- [ ] Final KPI/data field expectations per role

---

## #77 — Credentials provider auth (alongside Keycloak)

### Scope Checklist
- [ ] Provider selection is environment-driven
- [ ] Credentials auth validates DB users securely
- [ ] Session shape stays consistent across providers
- [ ] Failed login protections and audit logging are implemented

### Automated Verification Checklist
- [ ] Provider configuration tests pass
- [ ] Credentials success/failure tests pass
- [ ] Lockout/rate-limit tests pass
- [ ] Audit-log assertion tests pass

### Evidence
- [ ] Auth test logs
- [ ] Redacted session payload examples

### Blockers / Inputs
- [ ] Final lockout/rate-limit/password policy thresholds

---

## #52 — Storybook docs for component library

### Scope Checklist
- [ ] Storybook setup supports current stack
- [ ] Stories exist for approved component inventory
- [ ] Controls/docs are configured
- [ ] Accessibility addon coverage is in place

### Automated Verification Checklist
- [ ] Storybook build succeeds
- [ ] Story coverage check passes for required components
- [ ] Story smoke/a11y checks pass

### Evidence
- [ ] Storybook build output
- [ ] Story coverage + a11y results
- [ ] Screenshots for representative stories

### Blockers / Inputs
- [ ] Final source-of-truth list for required components

---

## Final Approval Checkboxes

- [ ] Priority order above is accepted as-is
- [ ] #53 performance assertions remain excluded for this pass
- [ ] Blockers/inputs are complete enough to start automation
