# Sprint 2 (Nov 10–12)

## Planning (done together by Yikang and Yizhang)
- **Date / attendees:** 11/10/2026, Yikang Liu and Yizhang Cao (video call)
- **Sprint dates:** 11/11–11/14 (we're submitting Saturday 11/14, one day before the 11/15 deadline)
- **Sprint goal:** Login, saved charts, real-time consultations, admin area, and the documented public API, all tested and deployed
- **Committed issues and estimates** (milestone "Sprint 2"; estimates are the `points:N` labels):
  - Yikang (24): #20 preview databases (2), #15 GitHub login + session check on /api/interpret (3), #40 postinstall (1), #19 required CI checks (3), #23 admin area (5), #25 OpenAPI docs (2), #7 README + architecture and DB diagrams (3); should: #22 saved conversations (3), #9 rate limit (2)
  - Yizhang (21): #4 browser check (3), #18 saved charts with encryption (5), #24 public API (5), #21 sharing + real-time consultations (5), #26 E2E in CI (3)
  - Optional: #6, #11, #8, #10, #12
- **Order and dependencies:** #20 first (no migration PR before it), then #15; #18 and #24 build their lib layer first and wire routes after #15; #21 after #18
- **Schedule:** Wed #20/#15 and #24/#18 lib; Thu #15/#19/#25 and #18/#24 routes + SSE spike; Fri #23/#9/#22 and #21, feature freeze 10 pm; Sat README, E2E, production walkthrough, demo video, retro, reflections, submit
- **Risks:**
  - SSE on Vercel serverless has a time limit: the server polls every 2 s and closes after ~55 s, and the client reconnects. Spike on Thursday.
  - #15 is on the critical path for #18, #21, #23, #24: review it first.
  - Cut order if late: #22, then #9.
- **Working agreement (from the Sprint 1 retro):** one standup each per day, reviews within 12 hours, and tell the other person early if blocked.

## Review
- **Completed:** ___ / ___ points
- **Not finished (moved to next sprint or backlog):**
- **Demo notes / production URL:**

## Retrospective
**What went well**
-

**What didn't go well**
-

**AI harness: what worked, and what we changed in AGENTS.md**
-

**Partner feedback**
- Yizhang → Yikang:
- Yikang → Yizhang:

**Action items for next sprint**
-
