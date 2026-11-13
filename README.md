<div align="center">

# ZiweiHub · 紫微命盘

### The AI-native platform for the world's traditions. Ziwei Doushu is the first.
### 面向世界各大传统的 AI 原生平台。紫微斗数是第一站。

Twelve palaces. One clear chart. Read to you by an AI built not to make things up.<br>
十二宫，一盘看清。由一个被设计成不编造的 AI，一项项讲给你听。

[**Try it live**](https://ziwei-doushu-seven-omega.vercel.app) · [API docs](https://ziwei-doushu-seven-omega.vercel.app/api-docs) · [English](#english) · [中文](#中文)

<img src="docs/screenshots/chart-reading-zh.png" alt="A natal chart with its twelve palaces on the left and a streamed AI reading on the right" width="900">

</div>

---

## English

### The opportunity

Western astrology and faith already have global consumer brands. Chinese metaphysics, practiced for two thousand years, doesn't have one yet.

- **The demand is here.** Both figures below come from the same [Daxue Consulting summary](https://daxueconsulting.com/spiritual-economy/).
  - iiMedia Research put China's AI metaphysics market above RMB 12 billion (about US$1.67 billion), growing 43.7% a year, with more than 70% of users aged 18 to 30.
  - A 2025 survey by the Chinese Academy of Social Sciences found that 68% of people aged 18 to 35 believe in at least one Xuanxue principle.
- **The category scales.** The prayer app Hallow has raised about US$105 million ([Clay](https://www.clay.com/dossier/hallow-funding)), and the astrology app Co–Star about US$21 million ([Dealroom](https://dealroom.co/companies/co-star/)).
- **AI changes the economics.** A reading used to need a master and an appointment; now it takes seconds. That makes trust the scarce thing, in a category long known for fabrication and scams.

### What we're building

One core, many traditions. Every new tradition reuses the same five pieces and brings only its own engine and texts.

| The core | What it does |
|---|---|
| **A grounded AI reader** | Reads from the structure of the chart. It is built not to invent: no made-up quotes, nothing that isn't in the chart. |
| **A privacy vault** | Birth data and conversations are encrypted at rest. Birth details never reach the AI. |
| **An open API** | Any developer can put the engine in their product, with keys, rate limits and OpenAPI docs. |
| **A practitioner network** (in progress) | Members share charts with practitioners, who read them and reply. |
| **Open, auditable code** | The whole stack is open source and tested end to end, so anyone can check what it does with their data. |

### How we're different

| | Charting libraries | Destination sites | **ZiweiHub** |
|---|---|---|---|
| What you get | An engine | One website | **A platform anyone can build on** |
| Backend | None | Closed | **Open source, full stack** |
| Trust | n/a | A privacy policy | **Encryption, no birth data to the AI, code you can read** |
| Developers | A library | Rarely an API | **A public API with keys and docs** |
| Reach | Developers | Usually one market | **Global: Chinese and English, under California law** |
| Growth | One tradition | A few tools | **Every tradition on one core, then devices** |

### What you can do today

Ziwei Doushu is the first app on the platform.

- **Chart in seconds.** Date, hour and birthplace in, twelve palaces out. Charted by Ni Haixia's method, with true solar time, right in your browser.
- **A reading you can talk to.** AI reads from the Life Palace out (character, career, love, wealth, health), streams as it writes, and answers follow-ups.
- **Yours, and private.** Sign in with GitHub and save charts for yourself and the people you know, with each chart's conversation kept beside it.
- **Chinese and English.** One tap to switch, with academic English for the terms.
- **The classics, at hand.** A library of the classical texts and a knowledge base of the stars.
- **Built for developers.** `POST /api/v1/charts` returns a chart as JSON.
- **Run with care.** Member, practitioner and admin roles, daily AI limits, and a note under every reading: for reference only.

<img src="docs/screenshots/home-en.png" alt="The ZiweiHub home page in English" width="720">

### Where it's going

| Stage | Milestone | What it proves |
|---|---|---|
| Now | Ziwei, end to end: compatibility, consultations, a paid tier, practitioner tools | One tradition, fully closed loop |
| Next | A second tradition (Bazi) on the same core in weeks; first API partners | A platform, not an app |
| Then | The first faith app: prayer and scripture companions | Reach across religions |
| After | Devices built with the Greater Bay Area's hardware supply chain | Software and hardware as one practice |

We believe this is a blue ocean worth more than US$5 billion.

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

### 机会在哪里

西方占星和宗教信仰，早已有了全球性的消费品牌。流传两千年的中国术数，还没有。

- **需求已经在这里。** 下面两组数据都出自同一份 [Daxue Consulting 摘要](https://daxueconsulting.com/spiritual-economy/)。
  - 艾媒咨询测算，中国"AI 玄学"市场已超过 120 亿元人民币（约 16.7 亿美元），年增速 43.7%，七成以上用户在 18 到 30 岁之间。
  - 中国社科院 2025 年发布的调查显示，18 到 35 岁的人里，68% 至少相信一种玄学观念。
- **这个品类做得大。** 祈祷 App Hallow 累计融资约 1.05 亿美元（[Clay](https://www.clay.com/dossier/hallow-funding)），占星 App Co–Star 约 2,100 万美元（[Dealroom](https://dealroom.co/companies/co-star/)）。
- **AI 改变了成本结构。** 过去一次解读要找师父、要预约，现在只要几秒。于是在一个长期充斥编造和骗局的品类里，信任成了最稀缺的东西。

### 我们在做什么

一套底座，承载多门传统。每接入一门新传统，都复用同样的五样东西，只需要带来自己的引擎和典籍。

| 底座 | 作用 |
|---|---|
| **有根据的 AI 解读** | 依命盘结构来读。它被设计成不编造：不造引文，不说命盘里没有的东西。 |
| **隐私保险库** | 出生信息和对话加密存储，出生信息从不发给 AI。 |
| **开放 API** | 任何开发者都能把引擎接进自己的产品，配有 key、限流和 OpenAPI 文档。 |
| **命理师网络**（建设中） | 会员把命盘分享给命理师，命理师读盘、回复。 |
| **开放、可审计的代码** | 整个技术栈开源，测试从头到尾覆盖，谁都能查它怎样处理自己的数据。 |

### 我们有什么不同

| | 排盘库 | 单一网站 | **ZiweiHub** |
|---|---|---|---|
| 得到什么 | 一个引擎 | 一个网站 | **一个谁都能在上面搭建的平台** |
| 后端 | 没有 | 闭源 | **开源全栈** |
| 信任 | 不涉及 | 一份隐私政策 | **加密存储，出生信息不给 AI，代码看得见** |
| 开发者 | 一个库 | 很少有 API | **带 key 和文档的公开 API** |
| 市场 | 开发者 | 通常只有一个市场 | **全球：中英双语，加州法律框架** |
| 增长 | 一门传统 | 几个工具 | **一套底座承载每一门传统，再到设备** |

### 今天能做什么

紫微斗数是平台上的第一个应用。

- **几秒排好十二宫。** 填好出生日期、时辰和出生地，按倪海厦体系起盘，用真太阳时校正，全部在浏览器里完成。
- **可以对话的解读。** AI 从命宫读起，性格、事业、感情、财运、健康，一边写一边显示，也能接着追问。
- **只属于你。** 用 GitHub 登录，保存自己和家人朋友的命盘，每张命盘的对话都留在它旁边。
- **中文、英文。** 一键切换，术语采用学界通行的英文译法。
- **古籍随手可查。** 古籍原典库，加上星曜知识库。
- **为开发者开放。** `POST /api/v1/charts` 以 JSON 返回命盘。
- **用得放心。** 会员、命理师、管理员三种角色，AI 每日用量上限，每篇解读下方都注明：仅供参考。

<img src="docs/screenshots/home-zh.png" alt="紫微命盘中文首页" width="720">

### 往哪里去

| 阶段 | 里程碑 | 证明什么 |
|---|---|---|
| 现在 | 紫微做完整：合盘、咨询、付费层、命理师工具 | 一门传统完整闭环 |
| 下一步 | 第二门传统（八字）用同一套底座几周上线；第一批 API 合作方 | 是平台，不是单个 App |
| 再下一步 | 第一个信仰类应用：祈祷与经文陪伴 | 跨越宗教品类 |
| 之后 | 依托粤港澳大湾区的硬件供应链做设备 | 软硬一体 |

我们相信，这是一片超过 50 亿美元的蓝海。

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

Market figures are third-party estimates, linked where they appear. The US$5 billion figure is our belief, not a forecast. Readings are for reference only.<br>
市场数据为第三方估计，出处见文中链接；50 亿美元是我们的判断，不是预测。解读仅供参考。
