<div align="center">

# 紫微命盘 · ZiweiHub

[English](README.md) · **简体中文**

**两千年的中国术数，由一个只按命盘说话的 AI，讲给你听。**

十二宫，一盘看清。

[**在线体验**](https://ziwei-doushu-seven-omega.vercel.app) · [API 文档](https://ziwei-doushu-seven-omega.vercel.app/api-docs)

<img src="docs/screenshots/chart-reading-zh.png" alt="左侧是十二宫命盘，右侧是逐字显示的 AI 解读" width="900">

</div>

---

## 1. 愿景

### 1.1 为什么是这件事，为什么是现在

在中国，18 到 35 岁的人里，超过三分之二至少相信一种玄学观念。"AI 玄学"已经是一个超过 120 亿元的市场，每年增长 43.7%，用户大多不到三十岁（[Daxue Consulting](https://daxueconsulting.com/spiritual-economy/)）。可他们手里的工具，页面一关就什么都不记得，给出的答案也常常是编出来的。

在西方，祈祷和占星已经做成了真正的公司：Hallow 融资约 1.05 亿美元（[Clay](https://www.clay.com/dossier/hallow-funding)），Co–Star 约 2,100 万美元（[Dealroom](https://dealroom.co/companies/co-star/)）。传承两千年的中国术数，却还没有一个让世界信得过的名字。

AI 让一次解读几乎不要钱。当谁都能生成答案，真正稀缺的，是一个信得过的答案。我们要做的，就是这个。

### 1.2 我们在做什么

为整个品类搭一层"信任"：一套底座，任何一门传统都能在上面运行。

- **只按出处说话的解读。** 它依命盘结构来读，从设计上就不编造：不造引文，不说命盘里没有的东西。
- **守得住的隐私。** 出生信息和对话加密存储，出生信息从不发给 AI。
- **向开发者敞开的门。** 公开 API，配有 API 密钥、限流和 OpenAPI 文档，谁都能把引擎接进自己的产品。
- **命理师的家**（即将上线）。会员把命盘分享给命理师，命理师读盘、回复。
- **技能市场**（即将上线）。把会的东西，变成别人用得上的技能：命理师的读盘方法，学者的译注，开发者为一门新传统写的引擎。它们都打包成能在底座上运行的技能，有人用，做的人就有收入。
- **谁都能读的代码。** 整个技术栈开源，测试从头到尾覆盖，它怎样处理你的数据，一看便知。

紫微斗数是第一门。下一门传统只需要带来自己的引擎和典籍，其余的，这里都已备好。

### 1.3 我们有什么不同

排盘库给你一个引擎，算命网站给你一个网站。我们给你一个平台：从头到尾开源，从设计上保护隐私，向开发者开放，从第一天起就面向全球，中英双语，适用加州法律，还有一个让知识以技能的形式流通、交易的市场。

### 1.4 和我们一起建

一个为各大传统而建的平台，靠两个人做不成，需要真正修习这些传统的人，也要让他们的付出有回报。

- **命理师：** 把你的读盘方法做成别人能用的技能，接咨询，也一起划清 AI 该说什么、什么该留给人自己判断。
- **开发者：** 在 API 上做你的产品，或者把一门新传统做成技能带到底座上：它的引擎、典籍和测试。
- **学者和译者：** 古籍库和英文术语表，会随着你补上的每一条出处、每一个用心译出的术语，慢慢长大；用到它们的每一篇解读，都带着你的名字。
- **每一个人：** 哪里读着不对，哪里出了问题，在 GitHub 上提一个议题告诉我们。

不知道从哪里开始？提一个议题，说说你想做什么。我们怎样工作，写在 [AGENTS.md](AGENTS.md) 里：每个改动都从一个议题开始，先写测试，出生信息永远不离开保险库。

每多一个技能，平台对每位会员就更有用一点；每有一位会员用上一个技能，做它的人就有一份收入；每多一位开发者，就给每位命理师带来新的人；每多一门传统，底座对下一门就更有价值。这个循环，就是这家公司。

## 2. 产品

### 2.1 今天能做什么

- **几秒排好命盘。** 填好出生日期、时辰和地点，按倪海厦体系起盘，用真太阳时校正，全在浏览器里完成。
- **马上有解读。** 每张命盘都附一份基础解读，按主星、亮度和四化用固定规则生成，在浏览器里算好，不用登录，也不调用 AI。
- **和解读对话。** 登录后，上方会出现 AI 个性化解读：从命宫读起，性格、事业、感情、财运、健康，边写边显示，也能接着追问。AI 不可用或当天次数用完时，基础解读照常显示。
- **只属于你。** 用 GitHub 登录，保存自己和家人朋友的命盘，每张命盘的对话都留在它旁边。
- **中文、英文都能读。** 一键切换，术语采用学界通行的英文译法。
- **回到原典。** 古籍原典库，加上星曜知识库。
- **拿去开发。** `POST /api/v1/charts` 以 JSON 返回命盘。
- **用得放心。** 会员、命理师、管理员三种角色，AI 每日用量上限，每篇解读下方都注明：仅供参考。

<img src="docs/screenshots/home-zh.png" alt="紫微命盘中文首页" width="720">

### 2.2 往哪里去

1. **现在：** 把紫微做完整：合盘、咨询、付费层，还有给命理师的工具。
2. **下一步：** 第二门传统八字，用同一套底座几周上线；向第一批合作方开放 API；技能市场迎来第一批创作者。
3. **再下一步：** 走进信仰类应用，从祈祷和经文陪伴开始。
4. **之后：** 让修习离开屏幕，走进依托粤港澳大湾区硬件供应链打造的设备。有了智能硬件在你身边加持，显化会变得更直接。

我们相信，这会长成一个超过 50 亿美元的市场，而我们要做它所依托的平台。

## 3. 开发者

### 3.1 本地运行

#### 3.1.1 安装和启动

```bash
git clone https://github.com/YizhangCao/ziwei-doushu.git
cd ziwei-doushu
npm ci
cp .env.example .env.local    # 按 docs/deployment.md 填写
export DATABASE_URL="postgresql://user:password@localhost:5432/ziwei_dev"
npx prisma migrate dev        # 在本地 Postgres 里建表
npm run dev                   # 打开 http://localhost:3000
```

保存命盘需要 PostgreSQL 和 `DATA_ENCRYPTION_KEY`，登录需要一个 GitHub OAuth 应用，AI 解读需要 Anthropic 的 API 密钥。每一项怎么配，见 [docs/deployment.md](docs/deployment.md)。

#### 3.1.2 运行测试

```bash
npm run typecheck && npm test && npm run test:unit   # 类型、排盘引擎、单元测试
npm run test:integration                            # 需要 DATABASE_URL_TEST
npm run test:e2e                                    # Playwright 端到端测试，Chromium
```

### 3.2 技术栈

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Prisma + PostgreSQL（Neon）· Auth.js（GitHub 登录）· Anthropic 的 Claude · next-intl · Redis（Upstash）· Vitest · Playwright · Vercel

### 3.3 文档

- [架构与数据库](docs/architecture.md)：各部分怎样配合，以及每一张表
- [安装与部署](docs/deployment.md)：环境变量、Neon、Vercel、GitHub OAuth
- [API 文档](https://ziwei-doushu-seven-omega.vercel.app/api-docs)：OpenAPI 3.1，线上地址 `/api-docs`
- [产品需求](docs/PRD.md)：用户、用户故事和发布范围
- [AGENTS.md](AGENTS.md)：我们怎样开发，写给人，也写给编程助手

---

## 4. 团队与致谢

由美国东北大学（Northeastern University）的 Yizhang Cao 与 Yikang Liu 共同打造，John Alexis Guerra Gomez 教授指导。

- **引擎：** 排盘引擎源自开源项目 [Renhuai123/ziwei-doushu](https://github.com/Renhuai123/ziwei-doushu)（MIT 许可），原版 README 保留在 [docs/upstream/](docs/upstream/README.zh-CN.md)。
- **方法：** 起盘方法依倪海厦的讲授。
- **许可：** 代码采用 [MIT](LICENSE) 许可，样本数据集采用 [CC BY 4.0](DATASET-LICENSE)；`docs/tianji-ziwei/` 采用 CC BY-NC-SA 4.0，不用于任何商业用途。

市场数据为第三方估计，出处见文中链接；50 亿美元是我们的判断，不是预测。解读仅供参考。
