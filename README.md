<div align="center">

# ZiweiHub · 紫微命盘

### Two thousand years of Chinese metaphysics, read to you by an AI that sticks to your chart.
### 两千年的中国术数，由一个只按命盘说话的 AI，讲给你听。

Twelve palaces. One clear chart. · 十二宫，一盘看清。

[**Try it live**](https://ziwei-doushu-seven-omega.vercel.app) · [API docs](https://ziwei-doushu-seven-omega.vercel.app/api-docs) · [English](#english) · [中文](#中文)

<img src="docs/screenshots/chart-reading-zh.png" alt="A natal chart with its twelve palaces on the left and a streamed AI reading on the right" width="900">

</div>

---

## English

### Why this, and why now

In China, more than two-thirds of people aged 18 to 35 hold at least one Xuanxue belief. AI fortune-telling is already worth more than RMB 12 billion, growing 43.7% a year, and most of its users are under thirty ([Daxue Consulting](https://daxueconsulting.com/spiritual-economy/)). Yet the tools they use forget them the moment the tab closes, and the answers are too often made up.

In the West, prayer and astrology have become real companies: Hallow has raised about US$105 million ([Clay](https://www.clay.com/dossier/hallow-funding)), Co–Star about US$21 million ([Dealroom](https://dealroom.co/companies/co-star/)). Chinese metaphysics, practiced for two thousand years, still has no name the world trusts.

AI has made a reading almost free. When anyone can generate an answer, the scarce thing is an answer you can trust. That is what we're building.

### What we're building

A trusted layer for the whole category: one core that any tradition can run on.

- **A reader that sticks to the source.** It reads from the structure of the chart, and it is built not to invent: no made-up quotes, nothing that isn't in the chart.
- **A vault for what's personal.** Birth data and conversations are encrypted at rest, and birth details never reach the AI.
- **An open door for developers.** A public API with keys, rate limits and OpenAPI docs, so anyone can build the engine into their own product.
- **A home for practitioners** (coming soon). Members share a chart with a practitioner, who reads it and replies.
- **A market for skills** (coming soon). What people know becomes something others can use: a practitioner's reading method, a scholar's translation, a developer's engine for a new tradition. Each is packaged as a skill that runs on the core, and its maker is paid when it's used.
- **Code anyone can read.** The whole stack is open source and tested end to end, so you can check exactly what it does with your data.

Ziwei Doushu is the first tradition on it. The next one only brings its own engine and texts; everything else is already here.

A charting library gives you an engine. A fortune-telling site gives you one website. ZiweiHub gives you a platform: open from end to end, private by design, open to developers, global from day one in Chinese and English under California law, and with a market where what people know is traded as skills.

### Build it with us

A platform for the world's traditions can't be built by two people. It needs the people who practice them, and it pays them for what they bring.

- **Practitioners:** turn your way of reading into a skill others can use, take consultations, and help draw the line between what the AI should say and what it should leave to people.
- **Developers:** build your product on the API, or bring a new tradition to the core as a skill: an engine, its texts, and its tests.
- **Scholars and translators:** the classics library and the English glossary grow with every source you add and every term you translate with care, and your work travels with every reading that uses it.
- **Everyone:** if something reads wrong or breaks, open an issue.

Not sure where to start? Open an issue and tell us what you'd like to build. [AGENTS.md](AGENTS.md) explains how we work: every change starts from an issue, tests come first, and birth data never leaves the vault.

Every skill published makes the platform more useful to every member. Every member who uses a skill pays the person who made it. Every developer brings new people to every practitioner, and every tradition added makes the core worth more to the next one. That loop is the company.

### What you can do today

- **Build a chart in seconds.** Enter the date, hour and place of birth, and your twelve palaces are laid out with true solar time, by Ni Haixia's method, right in your browser.
- **Talk to your reading.** The AI reads from the Life Palace out (character, career, love, wealth, health), writes as you watch, and answers your follow-up questions.
- **Keep it private.** Sign in with GitHub and save charts for yourself and the people you love. Each chart keeps its conversation beside it.
- **Read it in Chinese or English.** One tap to switch, with academic English for every term.
- **Go to the source.** A library of the classical texts, and a knowledge base of the stars.
- **Build with it.** `POST /api/v1/charts` returns a chart as JSON.
- **Trust how it's run.** Member, practitioner and admin roles, a daily AI limit, and a note under every reading: for reference only.

<img src="docs/screenshots/home-en.png" alt="The ZiweiHub home page in English" width="720">

### Where we're headed

1. **Now:** finish Ziwei end to end, with compatibility, consultations, a paid tier and tools for practitioners.
2. **Next:** bring a second tradition, Bazi, to the same core in weeks; open the API to our first partners; open the skills market to its first creators.
3. **Then:** cross into faith, starting with prayer and scripture companions.
4. **After that:** move the practice off the screen, onto devices built with the Greater Bay Area's hardware supply chain.

We believe this grows into a market worth more than US$5 billion, and we intend to be the platform it runs on.

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

Saving charts needs PostgreSQL and `DATA_ENCRYPTION_KEY`, signing in needs a GitHub OAuth app, and readings need an Anthropic API key. [docs/deployment.md](docs/deployment.md) walks through each one.

```bash
npm run typecheck && npm test && npm run test:unit   # types, engine, unit
npm run test:integration                            # needs DATABASE_URL_TEST
npm run test:e2e                                    # Playwright, Chromium
```

### Built with

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Prisma + PostgreSQL (Neon) · Auth.js (GitHub) · Claude by Anthropic · next-intl · Redis (Upstash) · Vitest · Playwright · Vercel

### Docs

- [Architecture and database](docs/architecture.md): how the pieces fit, and every table
- [Setup and deployment](docs/deployment.md): environment variables, Neon, Vercel, GitHub OAuth
- [API reference](https://ziwei-doushu-seven-omega.vercel.app/api-docs): OpenAPI 3.1, served at `/api-docs`
- [Product requirements](docs/PRD.md): users, stories and release scope
- [AGENTS.md](AGENTS.md): how we build, for people and coding agents alike

---

## 中文

### 为什么是这件事，为什么是现在

在中国，18 到 35 岁的人里，超过三分之二至少相信一种玄学观念。"AI 玄学"已经是一个超过 120 亿元的市场，每年增长 43.7%，用户大多不到三十岁（[Daxue Consulting](https://daxueconsulting.com/spiritual-economy/)）。可他们手里的工具，页面一关就什么都不记得，给出的答案也常常是编出来的。

在西方，祈祷和占星已经做成了真正的公司：Hallow 融资约 1.05 亿美元（[Clay](https://www.clay.com/dossier/hallow-funding)），Co–Star 约 2,100 万美元（[Dealroom](https://dealroom.co/companies/co-star/)）。传承两千年的中国术数，却还没有一个让世界信得过的名字。

AI 让一次解读几乎不要钱。当谁都能生成答案，真正稀缺的，是一个信得过的答案。我们要做的，就是这个。

### 我们在做什么

为整个品类搭一层"信任"：一套底座，任何一门传统都能在上面运行。

- **只按出处说话的解读。** 它依命盘结构来读，从设计上就不编造：不造引文，不说命盘里没有的东西。
- **守得住的隐私。** 出生信息和对话加密存储，出生信息从不发给 AI。
- **向开发者敞开的门。** 公开 API，配有 key、限流和 OpenAPI 文档，谁都能把引擎接进自己的产品。
- **命理师的家**（即将上线）。会员把命盘分享给命理师，命理师读盘、回复。
- **技能市场**（即将上线）。把会的东西，变成别人用得上的技能：命理师的读盘方法，学者的译注，开发者为一门新传统写的引擎。它们都打包成能在底座上运行的技能，有人用，做的人就有收入。
- **谁都能读的代码。** 整个技术栈开源，测试从头到尾覆盖，它怎样处理你的数据，一看便知。

紫微斗数是第一门。下一门传统只需要带来自己的引擎和典籍，其余的，这里都已备好。

排盘库给你一个引擎，算命网站给你一个网站。我们给你一个平台：从头到尾开源，从设计上保护隐私，向开发者开放，从第一天起就面向全球，中英双语，适用加州法律，还有一个让知识以技能的形式流通、交易的市场。

### 和我们一起建

一个为各大传统而建的平台，靠两个人做不成，需要真正修习这些传统的人，也要让他们的付出有回报。

- **命理师：** 把你的读盘方法做成别人能用的技能，接咨询，也一起划清 AI 该说什么、什么该留给人自己判断。
- **开发者：** 在 API 上做你的产品，或者把一门新传统做成技能带到底座上：它的引擎、典籍和测试。
- **学者和译者：** 古籍库和英文术语表，会随着你补上的每一条出处、每一个用心译出的术语，慢慢长大；用到它们的每一篇解读，都带着你的名字。
- **每一个人：** 哪里读着不对，哪里出了问题，开一个 issue 告诉我们。

不知道从哪里开始？开一个 issue，说说你想做什么。我们怎样工作，写在 [AGENTS.md](AGENTS.md) 里：每个改动都从一个 issue 开始，先写测试，出生信息永远不离开保险库。

每多一个技能，平台对每位会员就更有用一点；每有一位会员用上一个技能，做它的人就有一份收入；每多一位开发者，就给每位命理师带来新的人；每多一门传统，底座对下一门就更有价值。这个循环，就是这家公司。

### 今天能做什么

- **几秒排好命盘。** 填好出生日期、时辰和地点，按倪海厦体系起盘，用真太阳时校正，全在浏览器里完成。
- **和解读对话。** AI 从命宫读起，性格、事业、感情、财运、健康，边写边显示，也能接着追问。
- **只属于你。** 用 GitHub 登录，保存自己和家人朋友的命盘，每张命盘的对话都留在它旁边。
- **中文、英文都能读。** 一键切换，术语采用学界通行的英文译法。
- **回到原典。** 古籍原典库，加上星曜知识库。
- **拿去开发。** `POST /api/v1/charts` 以 JSON 返回命盘。
- **用得放心。** 会员、命理师、管理员三种角色，AI 每日用量上限，每篇解读下方都注明：仅供参考。

<img src="docs/screenshots/home-zh.png" alt="紫微命盘中文首页" width="720">

### 往哪里去

1. **现在：** 把紫微做完整：合盘、咨询、付费层，还有给命理师的工具。
2. **下一步：** 第二门传统八字，用同一套底座几周上线；向第一批合作方开放 API；技能市场迎来第一批创作者。
3. **再下一步：** 走进信仰类应用，从祈祷和经文陪伴开始。
4. **之后：** 让修习离开屏幕，走进依托粤港澳大湾区硬件供应链打造的设备。

我们相信，这会长成一个超过 50 亿美元的市场，而我们要做它所依托的平台。

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
