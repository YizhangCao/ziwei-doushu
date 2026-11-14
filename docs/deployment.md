# Setup and deployment

ZiweiHub runs in three environments. Each has its own database, and each takes its settings from environment variables.

| Environment | Runs on | Database | Settings from |
|---|---|---|---|
| Local | your machine, `npm run dev` | your own PostgreSQL, or a Neon `dev` branch | `.env.local` (git-ignored) |
| Preview | Vercel, one deployment per pull request | a Neon branch `preview/<git-branch>`, created for that preview | Vercel, "Preview" |
| Production | Vercel, built from `main` | the Neon `main` branch | Vercel, "Production" |

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. Never commit real values.

| Variable | Used for | Local | Vercel (Production and Preview) |
|---|---|---|---|
| `DATABASE_URL` | Prisma's connection to PostgreSQL | Your local database | Set by the Neon integration |
| `DATABASE_URL_TEST` | Integration tests only | A separate test database. Never the dev or production one. | Not set |
| `AUTH_SECRET` | Auth.js signs and encrypts the session with it | Any random value: `openssl rand -base64 32` | One value shared by Production and Preview (see GitHub OAuth below) |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | GitHub sign-in | From your local GitHub OAuth app | From the production GitHub OAuth app |
| `AUTH_REDIRECT_PROXY_URL` | Lets previews sign in through production | Not set | `https://<production domain>/api/auth` |
| `DATA_ENCRYPTION_KEY` | AES-256-GCM key for birth data and conversations | 64 hex characters: `openssl rand -hex 32` | Set for each environment. Changing it later makes stored data unreadable. |
| `ANTHROPIC_API_KEY` | AI readings | Your key | The project's key |
| `ANTHROPIC_MODEL` | The Claude model for readings, for example `claude-sonnet-5-5` | Required for readings | Required |
| `ANTHROPIC_EFFORT` | Optional: `low` to `max`. `low` starts the reading in about a second. Leave it empty for models that don't accept effort. | Optional | Recommended: `low` |
| `REDIS_URL` | Shared rate-limit counts, as a `redis://` or `rediss://` URL | Leave empty: an in-memory store is used | Upstash Redis from the Vercel Marketplace |
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs and social cards | `http://localhost:3000` | The production URL |

Notes:

- **`DATA_ENCRYPTION_KEY` isn't in `.env.example` yet.** Add it to your `.env.local` by hand. Without it, saving a chart fails.
- **`AI_PROVIDER` and `DEEPSEEK_API_KEY`** in `.env.example` come from the upstream project. ZiweiHub doesn't read them.

## Run it locally

1. **Install.** Use Node 22, then run `npm ci`.
2. **Create a database.** Use PostgreSQL 16, and make two databases: one for development and one for tests, for example `ziwei_dev` and `ziwei_test`.
3. **Fill in `.env.local`** from the table above.
4. **Create the tables:** `npx prisma migrate dev`.
5. **Start:** `npm run dev`, then open http://localhost:3000.
6. **Test:**
   - `npm run typecheck`, `npm test` (engine), `npm run test:unit`
   - `npm run test:integration` (resets `DATABASE_URL_TEST`)
   - `npm run test:e2e`

A Prisma command reads `DATABASE_URL` from the shell environment, not from `.env.local`. Export it first, and check it points at `localhost`:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/ziwei_dev"
npx prisma migrate dev
```

## GitHub OAuth

A GitHub OAuth app accepts one callback URL, so you need two apps.

| App | Homepage URL | Authorization callback URL |
|---|---|---|
| Local | `http://localhost:3000` | `http://localhost:3000/api/auth/callback/github` |
| Production | `https://<production domain>` | `https://<production domain>/api/auth/callback/github` |

Previews have a new URL for every pull request, so they can't be callback URLs.

- **How previews sign in:** they go through production instead. Set `AUTH_REDIRECT_PROXY_URL` to `https://<production domain>/api/auth` in both Production and Preview.
- **One secret:** the redirect proxy only works when Production and Preview use the same `AUTH_SECRET`. This is a requirement of [Auth.js](https://authjs.dev/getting-started/deployment).

## Neon

- **Integration:** the Vercel Neon integration is enabled for Preview only, with Development unchecked.
  - Each preview deployment gets its own branch, `preview/<git-branch>`, with `main` as its parent.
  - A preview's migrations therefore run on its own branch, never on production.
- **Branches:** production uses `main`. Local development and integration tests use separate `dev` and `test` branches, or local databases.
- **Branch limit:** the Free plan allows 10 branches, and preview branches stay after their pull request merges. Delete the branches of merged pull requests (in the Neon console, or with `neonctl branches delete`). A preview fails to deploy when no branch can be created.

## Vercel

- **Git integration:** every pull request gets a preview deployment, and `main` deploys to production.
- **Build:** `npm run build`, which runs `prisma generate && prisma migrate deploy && next build`. Migrations are applied to that environment's database before the app builds.
- **Environment variables:** set them for Production and Preview from the table above. Neon sets `DATABASE_URL` on its own.
- **Redis:** add Upstash Redis from the Vercel Marketplace and expose its URL as `REDIS_URL`. Without it, each serverless instance keeps its own count, so a rate limit only holds within one instance.

## After a deploy

Check these on the production URL:

1. Sign in with GitHub.
2. Build a chart. The reading starts streaming within a few seconds.
3. Save the chart, reopen it from `/charts`, and see the conversation again.
4. Create an API key on `/settings` and call the API:
   ```bash
   curl -X POST https://<production domain>/api/v1/charts \
     -H "Authorization: Bearer <key>" -H "Content-Type: application/json" \
     -d '{"date":"1990-06-15","hour":6,"gender":"female"}'
   ```
5. Open `/api-docs`.
