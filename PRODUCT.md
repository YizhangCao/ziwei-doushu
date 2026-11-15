# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** Chinese-speaking people with no knowledge of Ziwei Doushu who want to know how their life will go. That covers their character, career, relationships, wealth and health, and the decade and year they are in. They enter a birth date, hour, place and gender, and they expect plain answers rather than a lesson.
- **Secondary:** people who want to learn to read a chart the way Ni Haixia taught, step by step, and to check the rules and sources behind a reading.
- **Supporting roles** (from `docs/PRD.md` and `AGENTS.md`):
  - members, who save charts and reading conversations;
  - practitioners, who read charts that members share with them and reply in consultation threads;
  - admins, who manage roles, reported readings and daily AI limits;
  - developers, who call the public chart API.
- English-speaking visitors get the same site in English (#59). Chinese is the source language.

## Product Purpose

Ziwei Natal Chart turns a birth date and hour into a Ziwei Doushu chart and a prediction about the person's life. The chart is built and read by Ni Haixia's rules, for someone who knows nothing about the system.

Success means three things for a first-time visitor:
- they build a chart in seconds;
- they understand what the reading says about their life;
- they can see why to believe it: the rule and the source behind it.

## Positioning

Ziwei Natal Chart is a rule-based prediction machine built on Ni Haixia's Ziwei Doushu lectures (Tian Ji). Its main job is to give people with no knowledge of Ziwei Doushu predictions about their lives: character, career, relationships, wealth, health, and the decade and year they are in.

The teaching side carries less weight on the page but stays complete, because it is what makes the predictions credible. It covers:
- the lecture text behind each rule;
- the classics library;
- guided chart reading that reproduces the rules step by step.

What is true today, from the code:
- The chart is computed by fixed rules.
- The readings are written by an AI model from the chart and a fixed prompt. They do not yet retrieve or cite the lecture text.

Open decision: `docs/PRD.md`, the approved P2 proposal, still says readings are "for cultural interest and self-reflection, not predictions". The product owner set the prediction positioning on 2026-11-12. Updating the PRD with Yizhang is pending.

## Operating Context

- **Building a chart:** visitors arrive on the home page and build a chart on `/chart`. The birth form computes the chart in the browser, then the board and the reading panel open. They ask follow-up questions in the reading panel.
- **Time layers:** the board switches between natal (benming), decade (daxian) and year (liunian).
- **Compatibility:** `/heming` compares two people's charts.
- **Learning:**
  - the classics library (`/library`);
  - the knowledge index (`/knowledge`);
  - an About Ni Haixia page (`/ni-haixia`, in review);
  - a lecture curriculum on the home page: Ziwei in November, then Tian Ji, Di Ji and Ren Ji from December to February.
- **Language:** Chinese and English on the same URLs. The `NEXT_LOCALE` cookie decides; without it, a browser that lists Chinese gets Chinese (#67, in review).
- **In open pull requests (as of 2026-11-12):** GitHub sign-in, saved charts, practitioner consultations, the admin area and the documented public API.

## Capabilities and Constraints

What works today:
- **Chart engine:** deterministic and runs in the browser (`iztro`, `lunar-javascript`, `lib/ziwei/`). Chart results change only with a cited source and a regression test.
- **AI reading:** `/api/interpret` streams a reading from Claude, with the model taken from `ANTHROPIC_MODEL`.
  - **What the AI receives:** a serialized chart (the 12 palaces, wuxing ju, ming zhu, shen zhu, current age, and each decade with its sihua). It never receives the birth date, hour, gender or name.
  - **Topics:** overview, love, career, wealth, health and personality, plus readings for a palace or a sihua.
  - **Follow-ups:** up to 30 messages of up to 2,000 characters.

Not built yet, so no copy may claim it:
- Readings don't retrieve or cite the Tian Ji lectures. The topic prompts ask the model to quote Ni Haixia, which risks invented quotes.
- No liunian (annual) data reaches the AI, so a reading can't ground claims about a specific year.
- There is no compatibility AI route (`/api/heming`). The page shows a "not open yet" message.
- Pattern (geju) detection exists in code, but no page shows it.
- The knowledge topic pages have no content yet.

Constraints:
- **Fixed API contract:** the request and response shapes of `/api/interpret` and `/api/heming` are fixed (`AGENTS.md` 2.3).
- **Birth data is personal data:** it is encrypted at rest, never sent to the AI and never logged.
- **Non-commercial use:** the product is non-commercial; payments are out of scope in the PRD. The Tian Ji quotes in `docs/tianji-ziwei/` are CC BY-NC-SA 4.0. They may be used only while the product stays non-commercial, and with attribution. Commercial use needs permission from Ni Haixia's rights holders.
- **Unresolved contradiction:** Ni Haixia says the Four Transformations stay fixed and only the year moves (Tian Ji lecture 3, part 1, from 00:01:17). The board, however, shows decade and annual sihua.

Terminology:
- Domain terms stay in pinyin in code and English copy: sihua, daxian, liunian, heming.
- English renderings follow `lib/i18n/glossary.ts`. The approved substitutes are Decade, Year, Compatibility, and "trine and opposition" as a gloss only.

## Brand Commitments

- **Name:** 紫微命盘 / Ziwei Natal Chart everywhere, including `og:site_name`.
- **One action word for building a chart:** 起盘 / "Build your chart".
- **Mark:** the pole-star mark is the brand's only symbol.
- **Manifesto:** the home page manifesto (命 · 运 · 观) stays word for word, by the product owner's decision on 2026-11-12.
- **Ni Haixia:**
  - The site is based on his lectures. It has no commercial connection with him, his family or his institutions.
  - The Ni Haixia section keeps its original opening line, by the owner's decision on 2026-11-12.
- **Prediction wording is allowed.** Rewrites that soften prediction or medical wording for risk reasons are not adopted for now (2026-11-12).
- **English copy (#59):**
  - Use the academic English term where one exists, with its source; use a substitute only when the owner approved it; otherwise pinyin.
  - Readings use direct English at about a high-school level.
  - Classical quotes show the original, then `which means: "…"`.
  - Parallel couplets become rhyming heroic couplets.

## Evidence on Hand

- **Tian Ji quotes:** `docs/tianji-ziwei/` holds 1,848 short quotes from Ni Haixia's Tian Ji Ziwei lectures, 14 lectures plus two supplements. Each has a timestamped link to the original video. The license is CC BY-NC-SA 4.0. They aren't used in the product yet.
- **Classics:** `lib/classics/` holds three classics, Gusui fu, Ziwei doushu quanji and Ziwei doushu quanshu: 21 chapters and 75 passages. The passages are modern summaries of public-domain Ming editions and are labelled as summaries (#63).
- **Ni Haixia data:** `lib/nihai/` holds a biography and course outlines for Tian Ji, Di Ji and Ren Ji. Nothing uses it yet.
- **Nothing else:** there are no users, testimonials, reviews, press, accuracy data or case studies. Don't invent any.

## Product Principles

1. **Prediction first.** The home page and the reading lead with what the chart says about the visitor's life. Method and sources support it.
2. **Every prediction can be traced.** Name the stars, palaces and rule a conclusion rests on, and cite the lecture once retrieval exists. Never invent a quote or a source.
3. **Teaching stays complete.** The classics, knowledge index, curriculum and reading method may move around the site, but they are never removed.
4. **Birth data stays private.** It is computed in the browser, never sent to the AI and never logged.
5. **Chinese first, English faithful.** Chinese is the source; English follows the glossary and the translation rules.

## Accessibility & Inclusion

From `AGENTS.md`:
- Every input has a visible label, and buttons are real `<button type="button">` elements.
- Everything works by keyboard (Tab, Enter, Esc) with a visible focus outline.
- Streamed reading text sits in an `aria-live="polite"` container.
- Text keeps at least 4.5:1 contrast in both themes, and no text is smaller than 12 px.
- Information isn't shown by color alone: the sihua markers also carry their character label.
- `prefers-reduced-motion` turns motion off.
