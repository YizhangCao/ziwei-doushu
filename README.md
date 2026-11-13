<div align="center">

# ZiweiHub · 紫微命盘

### Twelve palaces. One clear chart.　十二宫，一盘看清。

Enter the date and hour of your birth. Your twelve palaces are laid out in seconds, and AI reads them to you.<br>
输入出生年月日时，几秒排好十二宫，AI 从命宫读起，一项项讲给你听。

[**Try it live**](https://ziwei-doushu-seven-omega.vercel.app) · [API docs](https://ziwei-doushu-seven-omega.vercel.app/api-docs) · [English](#english) · [中文](#中文)

<img src="docs/screenshots/chart-reading-zh.png" alt="A natal chart with its twelve palaces on the left and a streamed AI reading on the right" width="900">

</div>

---

## English

### Why we built it

Ziwei Doushu maps the moment you were born onto a chart of twelve palaces. Today, the people who care about it use free calculators that forget everything once the tab closes, then paste screenshots into chat apps to ask someone what it means.

ZiweiHub keeps the whole practice in one private place: an accurate chart, a reading you can question, and a record you can come back to.

### What you can do

- **Chart in seconds.** Date, hour and birthplace in, twelve palaces out. Charted by Ni Haixia's method, with true solar time, right in your browser.
- **A reading you can talk to.** AI reads from the Life Palace out (character, career, love, wealth, health), streams as it writes, and answers your follow-up questions. It sees the structure of the chart, never your birth details.
- **Yours, and private.** Sign in with GitHub and save charts for yourself and the people you know. Birth data and conversations are encrypted at rest.
- **Chinese and English.** Switch with one tap. Terms use their academic English renderings.
- **The classics, at hand.** A library of the classical texts and a knowledge base of the stars.
- **Built for developers.** `POST /api/v1/charts` returns a chart as JSON, with API keys, per-key rate limits and OpenAPI docs.
- **Run with care.** Member, practitioner and admin roles, daily AI limits, and a note under every reading: for reference only.

<img src="docs/screenshots/home-en.png" alt="The ZiweiHub home page in English" width="720">

### Where it's going

Ziwei is our first tradition, not our last. The core we built here carries over to the other traditions people live by: other schools of Chinese metaphysics, and faith apps across religions. That core is a precise engine that runs on the device, an AI reader that stays inside its sources, private records, and an open API.

After software comes hardware. With the Greater Bay Area's supply chain behind us, the practice can move onto devices people keep at home and carry with them. We believe this is a blue ocean worth more than US$5 billion.

### Run it locally

```bash
git clone https://github.com/YizhangCao/ziwei-doushu.git
cd ziwei-doushu
npm ci
cp .env.example .env.local    # fill it in: see docs/deployment.md
export DATABASE_URL="postgresql://user:password@localhost:5432/ziwei_dev"
npx prisma migrate dev        # creates the tables in your local Postgres
npm run dev                   # http://localhost:3000
```

Saving charts needs PostgreSQL and `DATA_ENCRYPTION_KEY`, signing in needs a GitHub OAuth app, and readings need an Anthropic API key. [docs/deployment.md](docs/deployment.md) explains each one.

```bash
npm run typecheck && npm test && npm run test:unit   # types, engine, unit
npm run test:integration                            # needs DATABASE_URL_TEST
npm run test:e2e                                    # Playwright, Chromium
```

### Built with

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Prisma + PostgreSQL (Neon) · Auth.js (GitHub) · Claude by Anthropic · next-intl · Redis (Upstash) · Vitest · Playwright · Vercel

### Docs

| | |
|---|---|
| [Architecture and database](docs/architecture.md) | How the pieces fit, and every table |
| [Setup and deployment](docs/deployment.md) | Environment variables, Neon, Vercel, GitHub OAuth |
| [API reference](https://ziwei-doushu-seven-omega.vercel.app/api-docs) | OpenAPI 3.1, served at `/api-docs` |
| [Product requirements](docs/PRD.md) | Users, stories and release scope |
| [AGENTS.md](AGENTS.md) | How we build: conventions, TDD, security rules |

---

## 中文

### 为什么做

紫微斗数把出生那一刻，排成一张十二宫的命盘。今天，在意它的人用的是免费排盘工具：页面一关，什么都不留下；看不懂，就截图发到聊天软件里问人。

紫微命盘把这件事放回一个私密的地方：排得准的命盘，可以追问的解读，随时回来接着看的记录。

### 能做什么

- **几秒排好十二宫。** 填好出生日期、时辰和出生地，按倪海厦体系起盘，用真太阳时校正，全部在浏览器里完成。
- **可以对话的解读。** AI 从命宫读起，性格、事业、感情、财运、健康，一边写一边显示，也能接着追问。它只看命盘的结构，看不到你的出生信息。
- **只属于你。** 用 GitHub 登录，保存自己和家人朋友的命盘。出生信息和对话都加密存储。
- **中文、英文。** 一键切换。术语采用学界通行的英文译法。
- **古籍随手可查。** 古籍原典库，加上星曜知识库。
- **为开发者开放。** `POST /api/v1/charts` 以 JSON 返回命盘，配有 API key、按 key 限流和 OpenAPI 文档。
- **用得放心。** 会员、命理师、管理员三种角色，AI 每日用量上限，每篇解读下方都注明：仅供参考。

<img src="docs/screenshots/home-zh.png" alt="紫微命盘中文首页" width="720">

### 往哪里去

紫微是我们的第一门传统，不是最后一门。这里打下的底座，可以延伸到人们安身立命的其他传统：其他门类的中国术数，以及各个宗教的信仰类应用。这个底座包括：在设备上运行的精确引擎，只在出处之内说话的 AI 解读，私密的记录，开放的 API。

软件之后是硬件。背靠粤港澳大湾区的硬件供应链，这些实践可以走进人们放在家里、带在身上的设备。我们相信，这是一片超过 50 亿美元的蓝海。

### 本地运行

命令见上方英文部分的 [Run it locally](#run-it-locally)。保存命盘需要 PostgreSQL 和 `DATA_ENCRYPTION_KEY`，登录需要 GitHub OAuth 应用，AI 解读需要 Anthropic API key，逐项说明见 [docs/deployment.md](docs/deployment.md)。

### 文档

架构与数据库见 [docs/architecture.md](docs/architecture.md)，部署见 [docs/deployment.md](docs/deployment.md)，API 文档在线上的 [`/api-docs`](https://ziwei-doushu-seven-omega.vercel.app/api-docs)，产品需求见 [docs/PRD.md](docs/PRD.md)。

---

## Team and credits · 团队与致谢

Built by Yikang Liu and Yizhang Cao. · 由 Yikang Liu 与 Yizhang Cao 开发。

- **Engine:** the charting engine started from [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu) (MIT). Its original README is kept in [docs/upstream/](docs/upstream/README.zh-CN.md). · 排盘引擎源自上述开源项目，原版 README 保留在 `docs/upstream/`。
- **Method:** charting follows Ni Haixia's teaching. · 起盘方法依倪海厦的讲授。
- **License:** code is [MIT](LICENSE); the sample datasets are [CC BY 4.0](DATASET-LICENSE). `docs/tianji-ziwei/` is CC BY-NC-SA 4.0 and is kept out of anything commercial. · 代码采用 MIT，样本数据集采用 CC BY 4.0；`docs/tianji-ziwei/` 采用 CC BY-NC-SA 4.0，不用于任何商业用途。

Readings are for reference only. · 解读仅供参考。
