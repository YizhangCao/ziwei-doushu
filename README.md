<div align="center">

# ZiweiHub

**English** · [简体中文](README.zh-CN.md)

**Two thousand years of Chinese metaphysics, read to you by an AI that sticks to your chart.**

Twelve palaces. One clear chart.

[**Try it live**](https://ziwei-doushu-seven-omega.vercel.app) · [API docs](https://ziwei-doushu-seven-omega.vercel.app/api-docs)

<img src="docs/screenshots/chart-reading-en.png" alt="A natal chart with its twelve palaces on the left and a streamed AI reading on the right" width="900">

</div>

---

## 1. Vision

### 1.1 Why this, and why now

In China, more than two-thirds of people aged 18 to 35 hold at least one Xuanxue belief. AI fortune-telling is already worth more than RMB 12 billion, growing 43.7% a year, and most of its users are under thirty ([Daxue Consulting](https://daxueconsulting.com/spiritual-economy/)). Yet the tools they use forget them the moment the tab closes, and the answers are too often made up.

In the West, prayer and astrology have become real companies: Hallow has raised about US$105 million ([Clay](https://www.clay.com/dossier/hallow-funding)), Co–Star about US$21 million ([Dealroom](https://dealroom.co/companies/co-star/)). Chinese metaphysics, practiced for two thousand years, still has no name the world trusts.

AI has made a reading almost free. When anyone can generate an answer, the scarce thing is an answer you can trust. That is what we're building.

### 1.2 What we're building

A trusted layer for the whole category: one core that any tradition can run on.

- **A reader that sticks to the source.** It reads from the structure of the chart, and it is built not to invent: no made-up quotes, nothing that isn't in the chart.
- **A vault for what's personal.** Birth data and conversations are encrypted at rest, and birth details never reach the AI.
- **An open door for developers.** A public API with keys, rate limits and OpenAPI docs, so anyone can build the engine into their own product.
- **A home for practitioners** (coming soon). Members share a chart with a practitioner, who reads it and replies.
- **A market for skills** (coming soon). What people know becomes something others can use: a practitioner's reading method, a scholar's translation, a developer's engine for a new tradition. Each is packaged as a skill that runs on the core, and its maker is paid when it's used.
- **Code anyone can read.** The whole stack is open source and tested end to end, so you can check exactly what it does with your data.

Ziwei Doushu is the first tradition on it. The next one only brings its own engine and texts; everything else is already here.

### 1.3 How we're different

A charting library gives you an engine. A fortune-telling site gives you one website. ZiweiHub gives you a platform: open from end to end, private by design, open to developers, global from day one in Chinese and English under California law, and with a market where what people know is traded as skills.

### 1.4 Build it with us

A platform for the world's traditions can't be built by two people. It needs the people who practice them, and it pays them for what they bring.

- **Practitioners:** turn your way of reading into a skill others can use, take consultations, and help draw the line between what the AI should say and what it should leave to people.
- **Developers:** build your product on the API, or bring a new tradition to the core as a skill: an engine, its texts, and its tests.
- **Scholars and translators:** the classics library and the English glossary grow with every source you add and every term you translate with care, and your work travels with every reading that uses it.
- **Everyone:** if something reads wrong or breaks, open an issue.

Not sure where to start? Open an issue and tell us what you'd like to build. [AGENTS.md](AGENTS.md) explains how we work: every change starts from an issue, tests come first, and birth data never leaves the vault.

Every skill published makes the platform more useful to every member. Every member who uses a skill pays the person who made it. Every developer brings new people to every practitioner, and every tradition added makes the core worth more to the next one. That loop is the company.

## 2. Product

### 2.1 What you can do today

- **Build a chart in seconds.** Enter the date, hour and place of birth, and your twelve palaces are laid out with true solar time, by Ni Haixia's method, right in your browser.
- **Talk to your reading.** The AI reads from the Life Palace out (character, career, love, wealth, health), writes as you watch, and answers your follow-up questions.
- **Keep it private.** Sign in with GitHub and save charts for yourself and the people you love. Each chart keeps its conversation beside it.
- **Read it in Chinese or English.** One tap to switch, with academic English for every term.
- **Go to the source.** A library of the classical texts, and a knowledge base of the stars.
- **Build with it.** `POST /api/v1/charts` returns a chart as JSON.
- **Trust how it's run.** Member, practitioner and admin roles, a daily AI limit, and a note under every reading: for reference only.

<img src="docs/screenshots/home-en.png" alt="The ZiweiHub home page in English" width="720">

### 2.2 Where we're headed

1. **Now:** finish Ziwei end to end, with compatibility, consultations, a paid tier and tools for practitioners.
2. **Next:** bring a second tradition, Bazi, to the same core in weeks; open the API to our first partners; open the skills market to its first creators.
3. **Then:** cross into faith, starting with prayer and scripture companions.
4. **After that:** move the practice off the screen, onto devices built with the Greater Bay Area's hardware supply chain. With smart hardware at your side to amplify the practice, manifestation becomes more direct.

We believe this grows into a market worth more than US$5 billion, and we intend to be the platform it runs on.

## 3. For developers

### 3.1 Run it locally

#### 3.1.1 Set up and start

```bash
git clone https://github.com/YizhangCao/ziwei-doushu.git
cd ziwei-doushu
npm ci
cp .env.example .env.local    # fill it in: see docs/deployment.md
export DATABASE_URL="postgresql://user:password@localhost:5432/ziwei_dev"
npx prisma migrate dev        # creates the tables in your local Postgres
npm run dev                   # http://localhost:3000
```

Saving charts needs PostgreSQL and `DATA_ENCRYPTION_KEY`, signing in needs a GitHub OAuth app, and readings need an Anthropic API key. [docs/deployment.md](docs/deployment.md) walks through each one.

> **Grading:** use the [live site](https://ziwei-doushu-seven-omega.vercel.app) and sign in with GitHub to get AI readings. Running it locally needs your own Anthropic API key.

#### 3.1.2 Run the tests

```bash
npm run typecheck && npm test && npm run test:unit   # types, engine, unit
npm run test:integration                            # needs DATABASE_URL_TEST
npm run test:e2e                                    # Playwright, Chromium
```

### 3.2 Built with

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Prisma + PostgreSQL (Neon) · Auth.js (GitHub) · Claude by Anthropic · next-intl · Redis (Upstash) · Vitest · Playwright · Vercel

### 3.3 Docs

- [Architecture and database](docs/architecture.md): how the pieces fit, and every table
- [Setup and deployment](docs/deployment.md): environment variables, Neon, Vercel, GitHub OAuth
- [API reference](https://ziwei-doushu-seven-omega.vercel.app/api-docs): OpenAPI 3.1, served at `/api-docs`
- [Product requirements](docs/PRD.md): users, stories and release scope
- [AGENTS.md](AGENTS.md): how we build, for people and coding agents alike

---

## 4. Team and credits

Co-built by Yizhang Cao and Yikang Liu at Northeastern University, advised by Professor John Alexis Guerra Gomez.

- **Engine:** the charting engine started from [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) (MIT). Its original README is kept in [docs/upstream/](docs/upstream/README.en.md).
- **Method:** charting follows Ni Haixia's teaching.
- **License:** code is [MIT](LICENSE); the sample datasets are [CC BY 4.0](DATASET-LICENSE). `docs/tianji-ziwei/` is CC BY-NC-SA 4.0 and is kept out of anything commercial.

Market figures are third-party estimates, linked where they appear. The US$5 billion figure is our belief, not a forecast. Readings are for reference only.
