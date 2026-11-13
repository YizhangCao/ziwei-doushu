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
| 11/10 | Yikang | • Reviewed and approved the 7 Sprint 1 PRs merged before review (#27–#30, #33–#35)<br>&nbsp;&nbsp;– Flagged follow-ups: session check on /api/interpret, 429 passthrough, stream errors, ConsultMessage cascade, crypto before #18<br>• #15 GitHub login<br>&nbsp;&nbsp;– Auth.js with JWT sessions (test commit first, then the implementation)<br>&nbsp;&nbsp;– Match users by GitHub id and restrict user deletes, as agreed on #35<br>• Sprint 1 retro and Sprint 2 planning call with Yizhang | • Test GitHub login end to end locally<br>• #20 preview databases | • #15 adds a migration, so I can't push it until previews have their own database (#20) |

## Sprint 2 (Nov 11–14)
| Date | Partner | Done | Next | Blockers |
|---|---|---|---|---|
| 11/11 | Yizhang | Sprint 2 planning PR | #24 and #18 lib layers (TDD) | #15 and #20 needed before #18 routes and any migration |
| 11/11 PM | Yizhang | #24 and #18 lib layers with 256-bit encryption (PRs #42, #43); #21 lib layer and the Vercel SSE spike (PR #44); E2E for the public API (#26, PR #45) | Wire #18, #21, #24 routes and pages once #15 merges | #15 (login); eight PRs awaiting review (#37–#39, #41–#45) |
| 11/11 | Yikang | • #20 preview databases<br>&nbsp;&nbsp;– Verified each preview gets its own Neon branch<br>&nbsp;&nbsp;– #48's migration ran only on its preview branch; production is unchanged<br>&nbsp;&nbsp;– PR #47 (also adds the production URL to the README)<br>• #15 GitHub login<br>&nbsp;&nbsp;– Tested login end to end locally<br>&nbsp;&nbsp;– Opened PR #48<br>&nbsp;&nbsp;– Added a role refresh every 5 minutes, so role changes reach active sessions<br>• Reviewed #37–#39 and #41–#45; requested changes on #44 | • Get #48 merged<br>• #19 required CI checks<br>• #25 OpenAPI spec and Swagger UI | • Actions doesn't run on #47 or #48 (asked Yizhang to check the repo settings)<br>• Can't move board cards (no Write access to the Sprint Board) |
| 11/12 | Yizhang | | | |
| 11/12 | Yikang | • Opened #51–#56: rate limit, admin area, OpenAPI, login hardening, build and template fixes<br>• UI: design system (#58), English version (#60), and 15 follow-up PRs stacked on them<br>• Terms: California law with arbitration (#101)<br>• AI reading: empty readings (#104), failed follow-ups (#106)<br>• English for Yizhang's saved-chart and settings pages (#92, #93)<br>• Reviewed 10 of Yizhang's PRs: 8 approved, changes requested on #44<br>• Planned global birthplaces (#102) | • Rate-limit /api/v1 per API key (#54)<br>• Check readings on production after the merges<br>• #22 saved conversations after #76 merges | • Reviews: the #58 stack, #104, #106, #48, #53<br>• Vercel previews fail, likely Neon's branch limit (asked Yizhang)<br>• REDIS_URL needed in Vercel |
| 11/13 | Yizhang | | | |
| 11/13 | Yikang | | | |
| 11/14 | Yizhang | | | |
| 11/14 | Yikang | | | |
