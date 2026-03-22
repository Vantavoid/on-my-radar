# CLAUDE.md

## What This Is

On My Radar is an autonomous aviation news publication. A daily pipeline researches global aviation news via Brave Search, writes editions with Claude Sonnet, generates article images with Gemini, and publishes to a Next.js site on Vercel.

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server on localhost:3000
npm run build        # production build
npm run start        # serve production build
npx drizzle-kit push # push schema changes to Neon
```

## Architecture

### Tech Stack
- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- AI SDK v6 + AI Gateway (OIDC auth)
- Drizzle ORM + Neon Postgres (pgvector enabled)
- Vercel Blob for AI-generated article images
- Framer Motion 12 for animations
- Space Mono font (ATC aesthetic, not Geist)

### Daily Pipeline
1. Vercel Cron hits `POST /api/trigger` at 04:00 UTC daily
2. `lib/pipeline/newsdesk.ts` researches news via Brave Search + Claude Sonnet
3. `lib/pipeline/visuals.ts` generates article images via Gemini Flash Image Preview -> Vercel Blob
4. `lib/pipeline/embeddings.ts` generates vector embeddings via Gemini Embedding
5. `lib/pipeline/publisher.ts` writes edition + articles + jobs to Neon
6. `lib/notify.ts` sends Telegram notification to Lee on success/failure

### Weekly Audit
- Vercel Cron hits `POST /api/audit` at 06:00 UTC every Sunday
- Claude Sonnet audits recent editions, writes improvement report to `improvement_reports` table

### Database Schema (`lib/db/schema.ts`)
Four tables: `editions`, `articles` (with pgvector embedding), `jobs`, `improvement_reports`.

### Key Directories
```
app/                    # Next.js App Router pages and API routes
  api/trigger/          # Daily publish endpoint (cron)
  api/audit/            # Weekly audit endpoint (cron)
  api/latest/           # GET latest edition metadata
  article/[slug]/       # Article detail page
  [date]/               # Archive page by date
components/
  hero/                 # ParallaxHero, RadarCanvas, N1Spinner, TableMountain, BellyAircraft
  articles/             # ArticleCard, ArticleHero, AltitudeDivider, ScrollAircraft
  jobs/                 # StripBoard (ATC progress strip aesthetic)
lib/
  db/                   # Drizzle schema, client, queries
  pipeline/             # newsdesk, visuals, embeddings, publisher
  types.ts              # Shared TypeScript interfaces
  notify.ts             # Telegram Bot API helper
.claude/prompts/        # AI agent prompts (newsdesk, visual-director, improvement)
```

### Design System
ATC-inspired dark theme. Key tokens in `app/globals.css`:
- `--color-deep-black: #080c10` (page bg)
- `--color-amber: #f5a623` (headlines)
- `--color-radar-green: #00ff88` (live/critical)
- `--color-steel-blue: #4a7fa5` (structure)
- `--color-red-alert: #ff4444` (incidents)

### Cron Jobs (`vercel.json`)
- `/api/trigger` — `0 4 * * *` (daily at 04:00 UTC)
- `/api/audit` — `0 6 * * 0` (Sundays at 06:00 UTC)

Both endpoints require `Authorization: Bearer <CRON_SECRET>` (Vercel injects this automatically for cron invocations).

## Infrastructure

- **GitHub**: github.com/Vantavoid/on-my-radar
- **Vercel**: project `on-my-radar` under letstalktootto-8812s-projects
- **Neon**: endpoint `ep-autumn-salad-anrzaln3` (us-east-1)
- **AI Gateway**: OIDC auth via `VERCEL_OIDC_TOKEN` (auto-provisioned)

## Env Vars

See `.env.local.example` for the full list. Do NOT run `vercel env pull` after adding integrations — it can overwrite existing vars. The active Neon connection is the pooled `DATABASE_URL`.
