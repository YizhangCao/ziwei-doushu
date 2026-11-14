# Architecture

Ziwei Natal Chart is one Next.js 16 app on Vercel. The chart is built in the browser; the server handles
accounts, saved data, AI readings and the public API. The diagrams below are Mermaid, so GitHub
renders them, and they change in the same pull request as the code they describe.

## System

```mermaid
flowchart LR
  subgraph Browser
    Form["BirthForm"] --> Engine["Charting engine<br/>lib/ziwei, iztro"]
    Engine --> Board["ChartBoard"]
    Engine --> Panel["InsightPanel"]
  end

  subgraph App["Next.js 16 on Vercel"]
    Interpret["/api/interpret<br/>chart to text, streamed reading"]
    Charts["/api/charts<br/>/api/charts/[id]<br/>/api/charts/[id]/conversation"]
    Keys["/api/keys"]
    Admin["/api/admin/users<br/>/api/admin/settings"]
    V1["/api/v1/charts<br/>public API"]
    Auth["/api/auth/* (Auth.js)"]
    Docs["/api-docs (OpenAPI 3.1)"]
  end

  Panel -- "chart structure and messages, never birth data" --> Interpret
  Panel -- "save and reload a conversation" --> Charts
  Interpret -- "stream" --> Claude[("Claude, Anthropic API")]
  Interpret --> Redis[("Redis, Upstash<br/>rate limits")]
  V1 --> Redis
  Charts --> DB[("PostgreSQL, Neon")]
  Keys --> DB
  Admin --> DB
  V1 --> DB
  Auth --> DB
  Auth -- "OAuth" --> GitHub["GitHub"]
  Dev["A developer's app"] -- "Bearer API key" --> V1
```

### What happens on the main paths

1. **Chart and reading.** The visitor fills in the birth form, and `generateChart()` builds the chart in the browser. The reading panel posts the chart and the messages to `/api/interpret`.
   - The server turns the chart into text with a serializer in `lib/ai/`. It sends Claude the twelve palaces and the decade ranges, never the birth date, hour or gender.
   - The reading streams back as `data: {"delta":{"text":"…"}}` lines, ending with `data: [DONE]`.
2. **Saved charts.** A signed-in member saves a chart through `/api/charts`; the birth data is encrypted before it is stored. On a saved chart, each finished exchange of the reading is appended to `/api/charts/[id]/conversation`. Reopening the chart at `/chart?id=…` shows that conversation again.
3. **Public API.** A developer creates a key on `/settings` and calls `POST /api/v1/charts` with `Authorization: Bearer <key>`. The chart comes back as JSON.

### Security and limits

| What | How |
|---|---|
| Sign-in | Auth.js v5 with GitHub OAuth and JWT sessions. Every protected route checks the session first, then the role or chart ownership. |
| Roles | `member`, `practitioner` and `admin` (`lib/auth/`). A user only sees their own charts and charts shared with them. |
| Birth data and conversations | Encrypted at rest with AES-256-GCM (`lib/crypto.ts`, key in `DATA_ENCRYPTION_KEY`). |
| API keys | 256-bit random tokens, stored as SHA-256 hashes; the plain key is shown once. |
| AI rate limit | 20 requests an hour per user and 100 per IP on `/api/interpret`, plus a daily limit per user that admins set (default 50). |
| Public API rate limit | 60 requests a minute per API key on `/api/v1/*`. |
| Rate-limit store | Redis when `REDIS_URL` is set, so every serverless instance shares one count; memory otherwise, for local development. If Redis is down, requests go through. |
| Input | Every request body and environment variable is parsed with zod. A 400 means a bad body, 401 no session, 403 not allowed, 404 not yours. |

## Database

PostgreSQL on Neon, through Prisma (`prisma/schema.prisma`). Production uses Neon's `main` branch, each Vercel preview gets its own Neon branch, and migrations run in the build with `prisma migrate deploy`.

```mermaid
erDiagram
  User ||--o{ Chart : owns
  User ||--o{ Conversation : has
  User ||--o{ ApiKey : owns
  User ||--o{ Share : "receives, as practitioner"
  User ||--o{ ConsultMessage : writes
  Chart ||--o{ Share : "is shared through"
  Chart ||--o{ Conversation : has
  Conversation ||--o{ Message : contains
  Share ||--o{ ConsultMessage : contains

  User {
    string id PK
    string githubId UK "GitHub account id, used to sign in"
    string email UK "only if GitHub shares it"
    string name
    string image
    Role role "member, practitioner or admin"
    datetime createdAt
    datetime updatedAt
  }
  Chart {
    string id PK
    string ownerId FK
    string name
    string encryptedBirthInfo "AES-256-GCM"
    datetime createdAt
    datetime updatedAt
  }
  Share {
    string id PK
    string chartId FK
    string practitionerId FK
    datetime createdAt
    datetime revokedAt "a revoked share counts as none"
  }
  Conversation {
    string id PK
    string chartId FK
    string userId FK
    string title
    datetime createdAt
    datetime updatedAt
  }
  Message {
    string id PK
    string conversationId FK
    MessageRole role "user or assistant"
    string content "AES-256-GCM"
    boolean hidden "a topic prompt, not shown as the visitor's words"
    datetime createdAt
  }
  ConsultMessage {
    string id PK
    string shareId FK
    string authorId FK
    string body
    datetime createdAt
  }
  ApiKey {
    string id PK
    string userId FK
    string name
    string keyHash UK "SHA-256 of the key"
    string prefix "first characters, to tell keys apart"
    datetime createdAt
    datetime lastUsedAt
    datetime revokedAt
  }
  Setting {
    string key PK "for example the daily AI limit"
    string value
    datetime updatedAt
  }
```

### What deleting does

- **Deleting a chart** deletes its shares, conversations and messages.
- **Deleting a user** deletes their charts, conversations and API keys. It is refused while the user is a practitioner on a share or the author of a consultation message, so consultation history never disappears quietly. There is no user deletion in this release.

## Code map

```
app/                 Pages and API routes (app/api/<name>/route.ts)
components/          React components, one per file
lib/ziwei/           The charting engine: pure functions, runs in the browser
lib/ai/              Prompt building, chart to text, the Anthropic client (server only)
lib/auth/            Session, role and ownership checks
lib/charts/          Saved charts; lib/conversations/ for their conversations
lib/api/             API keys and the public API
lib/rate-limit/      Fixed-window limits on Redis or memory
lib/crypto.ts        AES-256-GCM for data at rest
lib/i18n/, messages/ Chinese and English (next-intl); Chinese is the source of truth
prisma/              Schema and migrations
tests/, e2e/         Vitest unit and integration tests, Playwright E2E
```
