# Partner Standups

At least **3 per sprint from each partner**. Add a row each time (async in Slack is fine; copy it here).
Format: what I did · what I'll do next · blockers.

## Sprint 1 (Nov 8–10)
| Date | Partner | Done | Next | Blockers |
|---|---|---|---|---|
| 11/08 | Yizhang | Kit PR #13 (merged); re-planned backlog (#14–#26); main branch ruleset; Vercel project + Neon database (ziwei-db); opened PR #27 for #4 (closes #2–#5) with reviewer, milestone, and board card | Start #16 test harness | None |
| 11/08 | Yikang | Accepted collaborator invite; reviewed and merged #13 | #14 Prisma schema, then #15 GitHub login | None |
| 11/09 AM | Yizhang | Opened PR #28 (Sprint 1 planning); local env from Vercel + a Neon `test` branch for integration tests; #16 test harness (Vitest + Playwright) with red/green commits, PR #29; added `feature` label to PR #27 | #17 roles and permissions (failing tests written, implementation next), then #18 saved charts | CI integration/E2E jobs need Prisma from #14 |
| 11/09 AM | Yikang | | | |
| 11/09 PM | Yizhang | #17 roles and permissions: red/green commits, 93 unit tests passing (local, waiting on #29); synced app env vars to Vercel; separate prod/preview AUTH_SECRET and DATA_ENCRYPTION_KEY (#31, PR #30); board statuses updated | Open #17 PR once #29 merges, then #18 saved charts | PRs #27–#30 waiting for review; #18 needs #14 (database) |
| 11/09 PM | Yikang | | | |
| 11/10 AM | Yizhang | Status check of PRs, CI, and board: found CI failing on every PR (prisma generate with no schema; critical Next.js advisory) | CI fixes; merge PR queue (#29, #30, #28, #27, #17); take over #14 and #15 | Yikang unresponsive since 11/08 |
| 11/10 PM | Yizhang | Sprint 1 review and retro with Yikang; Sprint 2 planning; moved the repo to D: | #4 browser check; #24 and #18 lib layers | None |
| 11/10 AM | Yikang | | | |

## Sprint 2 (Nov 11–14)
| Date | Partner | Done | Next | Blockers |
|---|---|---|---|---|
| 11/11 | Yizhang | Sprint 2 planning PR | #24 and #18 lib layers (TDD) | #15 and #20 needed before #18 routes and any migration |
| 11/11 | Yikang | | | |
| 11/12 | Yizhang | | | |
| 11/12 | Yikang | | | |
| 11/13 | Yizhang | | | |
| 11/13 | Yikang | | | |
| 11/14 | Yizhang | | | |
| 11/14 | Yikang | | | |
