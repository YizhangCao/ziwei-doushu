# Sprint 1 (Nov 8–10)

## Planning (done together by Yikang and Yizhang)
- **Date / attendees:** 11/08/2026, Yikang Liu and Yizhang Cao (video call)
- **Sprint goal:** Foundation: database, login, roles, saved charts, AI reading, test harness, CI/CD, deployment
- **Committed issues and estimates:** see GitHub milestone "Sprint 1" (estimates are the `points:N` labels)
  - Yizhang: #2 (2), #3 (1), #4 (3), #5 (1), #16 test harness (2), #17 roles (3), #18 saved charts (5)
  - Yikang: #14 Prisma schema (3), #15 GitHub login (3), #19 CI pipeline (3), #20 Vercel deploy (2)
- **Total points committed:** Yizhang 17 · Yikang 11 (#2–#5 were mostly built during HW3, so Yizhang's new work is about 10 points)
- **Risks:**
  - Short sprint (3 days): #14 and #16 block other work, so they go first
  - New tools (Prisma, Auth.js, Playwright): ask the AI to follow AGENTS.md and check the official docs
  - CI test jobs fail until #16 is merged

## Review
- **Completed:** 9 / 28 committed points, plus 2 unplanned points (#31, #32) = **11 points delivered** (as of 11/10 afternoon)
  - #5 Validate /api/interpret request body (1) — PR #27
  - #14 PostgreSQL + Prisma schema (3) — PR #35
  - #16 Vitest and Playwright test harness (2) — PR #29
  - #17 Roles and server-side permission checks (3) — PR #34
  - Unplanned: #31 Separate prod/preview secrets (1) — PR #30; #32 Make CI pass: Next.js RCE patch + Prisma CI gating (1) — PRs #33/#29
  - In review, can still close tonight: #2 (2) and #3 (1) in PR #38; #36 AGENTS.md v3.2 (1, unplanned) in PR #37 → would make **12 / 28 committed, 15 total**
- **Not finished (moved to Sprint 2):**
  - #4 POST /api/interpret (3): route is merged (PR #27); the in-browser check of InsightPanel/ChatPanel streaming is still to do
  - #15 GitHub login (3), #19 CI pipeline (3), #20 Vercel previews with per-preview DBs (2): Yikang
  - #18 Save, list, rename, delete charts (5): blocked on #15 (session) and #20 (no preview DB branches yet)
  - #2, #3, #36 if PRs #38 / #37 aren't merged tonight
- **Demo notes / production URL:** https://ziwei-doushu-seven-omega.vercel.app (`/chart` builds a chart and streams an AI reading; production deploy of `a16b750` ran `prisma migrate deploy` with no pending migrations)

## Retrospective
**What went well**
- TDD history is visible in git: every behavior change has a `test(...)` commit before its `feat(...)`/`fix(...)` (#16, #17, #14, #4 CodeQL fix, #2), and we only merged with `--merge` so it stays visible.
- CI went from red on every PR to green across all jobs (typecheck, engine, unit, integration on Postgres, E2E, security scan, CodeQL), after patching a critical Next.js RCE advisory (#32).
- The CodeQL "system prompt injection" alert on #27 was fixed properly: chart values are allowlisted against what the engine can produce, and chart text moved out of the system prompt.
- Secrets were handled carefully: production/preview have their own AUTH_SECRET and DATA_ENCRYPTION_KEY (#31), and no secret was printed or committed.
- Yikang's post-merge reviews caught real follow-ups (session check on /api/interpret, 429 passthrough, stream errors, ConsultMessage cascade, crypto before #18).

**What didn't go well**
- Yikang had no repo activity from 11/08 evening until 11/10 late morning. With the sprint ending, Yizhang took over #14 and self-merged PRs #27–#30 and #33–#35 with required approvals temporarily set to 0. Yikang reviewed and approved all of them after merge (11:27–12:14 PT on 11/10), but they weren't reviewed *before* merge.
- A preview deploy migrated the production database: PR #35's preview build ran `prisma migrate deploy` against production, because Vercel uses one DATABASE_URL for all environments and Neon had no per-preview branches (#20). It only created empty tables, but any future migration PR would have changed production before review.
- `.env.local` pointed at the production database (from `vercel env pull`), so local development and Prisma commands could have touched production. Fixed by moving local development to a Neon `dev` branch.
- The `ci.yml` Prisma steps and test scripts depended on each other (#29 ↔ #32), so neither PR could go green alone; we had to stack them.
- #2/#3/#4 acceptance criteria didn't match PR #27 (it originally said "Closes #2–#5"); we caught it before merge and only closed #5.
- The Neon `test` branch was deleted on 11/10 (11:11 PT), so local integration tests stopped working until we recreated it the same day; CI kept running them on its own Postgres.
- Sprint scope was too big for 3 days with one partner unavailable: 9 of 28 committed points done.

**AI harness: what worked, and what we changed in AGENTS.md**
- v3.1 → v3.2 (PR #37): the integration-test rule now says `prisma migrate deploy` once plus truncation per test on DATABASE_URL_TEST, because Prisma blocks `migrate reset --force` when an AI agent runs it; added "local development uses the Neon dev branch; never point .env.local at production"; added "preview deployments must never run migrations against the production database (see #20)".
- Earlier in the sprint: "Production and preview use their own AUTH_SECRET and DATA_ENCRYPTION_KEY" (PR #30).
- What worked: concrete, checkable rules (route files export only handlers, validation limits, never send birthInfo, TDD commit order, end-of-task summary) were followed consistently. Asking the agent to report only the *shape* of secrets kept credentials out of logs.
- What we learned: the agent should stop when a tool's safety guard fires (Prisma migrate reset) or a permission is denied (a production read), and ask instead of working around it.

**Partner feedback**
- Yizhang → Yikang:
- Yikang → Yizhang:

**Action items for next sprint**
- Land #20 (per-preview Neon branches) before any PR with a migration, starting with #18; until then, don't open migration PRs. (Yikang)
- Add required status checks to the "Protect main" ruleset so CI must pass before merge (closes #19; needs admin). (Yikang)
- Add the session check to /api/interpret in #15 and decide the stream error format for #6 and 429 passthrough for #12 (from Yikang's #27 review).
- Add `lib/crypto.ts` in #18 before any birth data is saved; decide whether deleting a practitioner should delete the member's consultation messages before #21.
- Agree on a response time for reviews/standups (e.g., within 12 hours) and a handoff rule if one partner is blocked, so self-merging isn't needed again.
- Each partner checks their own `.env.local`: `DATABASE_URL` on the Neon `dev` branch, `DATABASE_URL_TEST` on `test`, and no production database aliases (`POSTGRES_*`, `PG*`, `DATABASE_URL_UNPOOLED`).
