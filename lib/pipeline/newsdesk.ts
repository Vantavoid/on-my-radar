/**
 * Newsdesk pipeline — AI news research and brief generation.
 *
 * Pre-fetches all search results (Brave + X) in parallel on the Pi,
 * then calls the Claude CLI (`claude --print`) to generate the brief JSON.
 *
 * Called by scripts/run-pipeline.ts at 0400 UTC via Pi cron (primary).
 * Vercel cron at 0410 UTC is a passive check only — see app/api/trigger/route.ts.
 */

import { spawnSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'
import { z } from 'zod'
import type { Brief } from '@/lib/types'

// ---------------------------------------------------------------------------
// Recent content fetcher — used to avoid duplicate stories and jobs
// ---------------------------------------------------------------------------

async function getRecentContent(days = 7): Promise<{ headlines: string[]; jobs: string[] }> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) return { headlines: [], jobs: [] }
  try {
    const sql = neon(dbUrl)
    const cutoff = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
    const [articles, jobs] = await Promise.all([
      sql`SELECT headline FROM articles WHERE edition_date >= ${cutoff} ORDER BY edition_date DESC`,
      sql`SELECT title, ansp, location FROM jobs WHERE edition_date >= ${cutoff} ORDER BY edition_date DESC`,
    ])
    return {
      headlines: (articles as { headline: string }[]).map((a) => a.headline),
      jobs: (jobs as { title: string; ansp: string; location: string }[]).map(
        (j) => `${j.title} — ${j.ansp}, ${j.location}`
      ),
    }
  } catch {
    return { headlines: [], jobs: [] }
  }
}

// ---------------------------------------------------------------------------
// Brave Search helper
// ---------------------------------------------------------------------------

/** Parse Brave's `page_age` ISO date into hours-old. Returns null if unparseable. */
function ageHours(pageAge?: string): number | null {
  if (!pageAge) return null
  const ts = Date.parse(pageAge)
  if (Number.isNaN(ts)) return null
  return (Date.now() - ts) / 3_600_000
}

/**
 * True for listing/index URLs — tag, category, topic, search, section, author
 * pages, or a bare domain root. These aggregate many stories rather than BE a
 * story; clicking one drops the reader on a feed, not the article. The model
 * sometimes picks them as a sourceUrl (e.g. cbsnews.com/tag/plane-crash), so we
 * drop them from search results before the model ever sees them.
 */
function isListingPageUrl(rawUrl: string): boolean {
  try {
    const path = new URL(rawUrl).pathname.replace(/\/+$/, '')
    if (path === '') return true // bare homepage
    return /(^|\/)(tag|tags|category|categories|topic|topics|search|section|sections|author|authors)(\/|$)/i.test(path)
  } catch {
    return false
  }
}

async function braveSearch(query: string, freshness?: string, maxAgeHours = 48): Promise<string> {
  const key = process.env.BRAVE_API_KEY
  if (!key) {
    console.warn('[newsdesk] No BRAVE_API_KEY — search unavailable')
    return `[Search unavailable — no Brave API key configured for query: ${query}]`
  }

  const params = new URLSearchParams({ q: query, count: '20' })
  if (freshness) params.set('freshness', freshness)

  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': key,
      },
    })

    if (!res.ok) return `[Search failed: HTTP ${res.status} for query: ${query}]`

    const data = await res.json()
    const results: Array<{
      title: string
      url: string
      description?: string
      age?: string
      page_age?: string
    }> = data.web?.results ?? []

    if (!results.length) return `[No results found for: ${query}]`

    // Hard freshness filter: drop anything we can date older than maxAgeHours.
    // Results without a parseable date are kept (we can't prove they're stale)
    // but downranked by being shown last so fresher items take priority.
    // Drop listing/index pages (tag, category, search, homepage) — they are not
    // stories, and the model must never be offered one as a candidate sourceUrl.
    const articleResults = results.filter(r => !isListingPageUrl(r.url))
    const listingDropped = results.length - articleResults.length
    if (listingDropped > 0) {
      console.log(`[newsdesk] Brave "${query}" → dropped ${listingDropped} listing/tag page(s)`)
    }

    const dated: Array<{ result: typeof results[number]; hours: number | null }> = articleResults.map(r => ({
      result: r,
      hours: ageHours(r.page_age),
    }))
    const fresh = dated.filter(d => d.hours === null || d.hours <= maxAgeHours)
    fresh.sort((a, b) => {
      if (a.hours === null && b.hours === null) return 0
      if (a.hours === null) return 1
      if (b.hours === null) return -1
      return a.hours - b.hours
    })
    const dropped = dated.length - fresh.length
    if (dropped > 0) {
      console.log(`[newsdesk] Brave "${query}" → dropped ${dropped} stale (>${maxAgeHours}h) of ${dated.length}`)
    }

    if (!fresh.length) return `[No fresh (≤${maxAgeHours}h) results for: ${query}]`

    return fresh
      .slice(0, 8)
      .map(({ result: r, hours }) => {
        const ageLabel = hours !== null
          ? hours < 1 ? `${Math.round(hours * 60)}m ago`
          : hours < 24 ? `${Math.round(hours)}h ago`
          : `${Math.round(hours / 24)}d ago`
          : (r.age ?? 'date unknown')
        return `Title: ${r.title}\nURL: ${r.url}\nAge: ${ageLabel}\nSnippet: ${r.description ?? '(no snippet)'}\n`
      })
      .join('\n---\n')
  } catch (err) {
    console.error(`[newsdesk] Brave search error for "${query}":`, err)
    return `[Search error for: ${query}]`
  }
}

// ---------------------------------------------------------------------------
// X (Twitter) API v2 search helper
// ---------------------------------------------------------------------------

async function xSearch(query: string, maxResults = 15): Promise<string> {
  const token = process.env.X_BEARER_TOKEN
  if (!token) {
    console.warn('[newsdesk] No X_BEARER_TOKEN — X search unavailable')
    return '[X search unavailable — no bearer token configured]'
  }

  const params = new URLSearchParams({
    query: `(${query}) -is:retweet lang:en`,
    max_results: String(Math.min(maxResults, 100)),
    'tweet.fields': 'created_at,author_id,attachments',
    expansions: 'author_id,attachments.media_keys',
    'user.fields': 'username,name',
    'media.fields': 'type,url,preview_image_url',
  })

  try {
    const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[newsdesk] X search HTTP ${res.status} for "${query}": ${body.slice(0, 200)}`)
      return `[X search failed: HTTP ${res.status} for query: ${query}]`
    }

    const data = await res.json()
    const tweets: Array<{
      id: string
      text: string
      author_id: string
      created_at?: string
      attachments?: { media_keys?: string[] }
    }> = data.data ?? []

    const users: Record<string, { username: string; name: string }> = Object.fromEntries(
      (data.includes?.users ?? []).map(
        (u: { id: string; username: string; name: string }) => [u.id, u]
      )
    )

    const videoKeys = new Set<string>(
      (data.includes?.media ?? [])
        .filter((m: { type: string }) => m.type === 'video')
        .map((m: { media_key: string }) => m.media_key)
    )

    if (!tweets.length) return `[No X results for: ${query}]`

    // Hard 48h freshness filter — drop anything older even though Twitter's
    // "recent" endpoint allows up to 7 days. Briefing must not contain stale
    // content (see corrections: Lee flagged a 2-month-old Air India story).
    const MAX_AGE_MS = 48 * 3_600_000
    const cutoff = Date.now() - MAX_AGE_MS
    const fresh = tweets.filter(t => {
      if (!t.created_at) return true // keep undated tweets (rare); model can still date-check
      const ts = Date.parse(t.created_at)
      return Number.isNaN(ts) || ts >= cutoff
    })
    const droppedCount = tweets.length - fresh.length
    if (droppedCount > 0) {
      console.log(`[newsdesk] x_search "${query}" → dropped ${droppedCount} stale (>48h) of ${tweets.length}`)
    }
    if (!fresh.length) return `[No fresh (≤48h) X results for: ${query}]`

    console.log(`[newsdesk] x_search "${query}" → ${fresh.length} fresh tweets`)

    return fresh
      .map((t) => {
        const user = users[t.author_id] ?? { username: 'unknown', name: '' }
        const hasVideo = t.attachments?.media_keys?.some((k) => videoKeys.has(k)) ?? false
        return [
          `@${user.username}: ${t.text}`,
          `URL: https://x.com/${user.username}/status/${t.id}`,
          `Has video: ${hasVideo}`,
          t.created_at ? `Posted: ${t.created_at}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      })
      .join('\n---\n')
  } catch (err) {
    console.error(`[newsdesk] X search error for "${query}":`, err)
    return `[X search error for: ${query}]`
  }
}

// ---------------------------------------------------------------------------
// System prompt loader
// ---------------------------------------------------------------------------

function loadSystemPrompt(): string {
  const base = (() => {
    try {
      return readFileSync(join(process.cwd(), '.claude/prompts/newsdesk.md'), 'utf-8')
    } catch {
      return `You are the Newsdesk for On My Radar, an aviation publication for Air Traffic Controllers.
Research aviation news and return a valid JSON brief with global (5-8 items), local (2-4 items), and jobs (3-8 items).
Every sourceUrl must be a DIRECT article URL you actually retrieved — never a tag/category/topic/search/section page or a bare homepage, and never invented.`
    }
  })()
  // Append the curated ATC recruitment source list so the newsdesk targets
  // real ANSP careers pages rather than relying on broad search.
  let jobSources = ''
  try {
    jobSources = '\n\n---\n\n' + readFileSync(join(process.cwd(), '.claude/prompts/atc-job-sources.md'), 'utf-8')
  } catch {
    // Optional — if missing, the base prompt's job rules still apply.
  }
  // Append the LESSONS.md feedback log so accumulated weekly directives
  // (and Lee's standing instructions) reach the newsdesk every run. Without
  // this load, LESSONS.md was effectively dead — written by the audit
  // pipeline but never consumed.
  let lessons = ''
  try {
    lessons = '\n\n---\n\n## Accumulated Lessons & Directives\n\n' +
      readFileSync(join(process.cwd(), 'LESSONS.md'), 'utf-8')
  } catch {
    // Optional — if missing, the base prompt still applies.
  }
  return base + jobSources + lessons
}

// ---------------------------------------------------------------------------
// Zod schema (mirrors lib/types.ts Brief interface)
// ---------------------------------------------------------------------------

const BriefArticleSchema = z.object({
  headline: z.string().max(120),
  summary: z.string(),
  category: z.enum(['incident', 'regulation', 'technology', 'airspace', 'weather', 'staffing']),
  severity: z.enum(['routine', 'notable', 'critical']),
  source: z.string(),
  sourceUrl: z.string(),
  xPostUrl: z.string().nullable().optional(),
  imagePrompt: z.string().optional(),
})

const BriefJobSchema = z.object({
  title: z.string(),
  ansp: z.string(),
  location: z.string(),
  type: z.enum(['ACC', 'TWR', 'APP']),
  source: z.string(),
  sourceUrl: z.string().nullable().optional(),
  primarySourceUrl: z.string().nullable().optional(),
  posted: z.string().nullable().optional(),
})

const BriefSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetCountry: z.string(),
  global: z.array(BriefArticleSchema).min(1),
  local: z.array(BriefArticleSchema),
  noLocalNews: z.boolean().optional(),
  jobs: z.array(BriefJobSchema),
})

// ---------------------------------------------------------------------------
// JSON extraction helper
// ---------------------------------------------------------------------------

function extractJson(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlock) return codeBlock[1].trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1)
  }

  return text.trim()
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function runNewsdesk(
  date: string,
  targetCountry = 'South Africa'
): Promise<Brief> {
  console.log(`[newsdesk] Starting brief for ${date} (target: ${targetCountry})`)

  const monthYear = new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Pre-fetch all research in parallel
  console.log('[newsdesk] Pre-fetching search results (parallel)...')
  const [
    recent,
    xBreaking,
    xIncidents,
    xLocal,
    webIncidents,
    webAirspace,
    webRegulatory,
    webLocal,
    webLocalAirports,
    webJobs1,
    webJobs2,
    webJobs3,
    webJobs4,
    webJobs5,
    webJobs6,
  ] = await Promise.all([
    getRecentContent(7),
    xSearch('from:FlightGlobal OR from:ICAO OR from:FAA OR from:EUROCONTROL aviation'),
    xSearch('from:AviationHerald OR from:flightradar24 incident'),
    xSearch('from:ATNS_SOC OR from:CAA_ZA aviation'),
    // News queries — 48h hard freshness gate (the briefing must be timely).
    braveSearch(`aviation incident accident ${date}`, 'pd', 48),
    braveSearch(`ATC airspace NOTAM announcement ${date}`, 'pd', 48),
    braveSearch(`ICAO FAA EUROCONTROL news ${date}`, 'pd', 48),
    braveSearch(`${targetCountry} SACAA ATNS aviation news ${date}`, 'pw', 48),
    braveSearch(`FACT FAOR FALA airspace ${date}`, 'pw', 48),
    // Job queries — 30-day window (open vacancies stay relevant for weeks).
    // Target the Tier-1 curated ANSP career-page domains directly. See
    // .claude/prompts/atc-job-sources.md for the full list and rationale.
    braveSearch(`air traffic controller vacancy site:eurocontrol.int OR site:nats.aero OR site:dfs.de OR site:skyguide.ch`, 'pm', 24 * 30),
    braveSearch(`air traffic controller vacancy site:navcanada.ca OR site:airservicesaustralia.com OR site:airways.co.nz OR site:atns.com`, 'pm', 24 * 30),
    braveSearch(`ATCO vacancy site:atc-network.com/jobs OR site:jobs.flightglobal.com OR site:aviationjobsearch.com`, 'pm', 24 * 30),
    braveSearch(`"closing date" OR "apply by" air traffic controller ATCO ${monthYear}`, 'pm', 24 * 30),
    // Broader queries (no site restriction) to catch listings from sources
    // not yet curated — recruitment agencies, smaller ANSPs, LinkedIn.
    braveSearch(`experienced "air traffic controller" hiring ${monthYear}`, 'pm', 24 * 30),
    braveSearch(`rated ATCO recruitment "apply now" OR "closing date" ${monthYear}`, 'pm', 24 * 30),
  ])
  console.log('[newsdesk] Pre-fetch complete')

  const recentBlock = [
    recent.headlines.length
      ? `ALREADY PUBLISHED (last 7 days — do NOT repeat these stories):\n${recent.headlines.map((h) => `- ${h}`).join('\n')}`
      : '',
    recent.jobs.length
      ? `ALREADY LISTED JOBS (last 7 days — do NOT repeat these postings):\n${recent.jobs.map((j) => `- ${j}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const systemPrompt = loadSystemPrompt()

  const fullPrompt = `${systemPrompt}

---

## Pre-Fetched Research — ${date}

All searches have already been run. Use the results below to write the brief. Do NOT call any search tools — they are not available in this context.

### X/Twitter — Breaking Aviation & ATC
${xBreaking}

### X/Twitter — Aviation Incidents
${xIncidents}

### X/Twitter — ${targetCountry} Local Aviation
${xLocal}

### Web Search — Aviation Incidents & Accidents (past 24h)
${webIncidents}

### Web Search — ATC Airspace & NOTAM Announcements
${webAirspace}

### Web Search — ICAO / FAA / EUROCONTROL Regulatory News
${webRegulatory}

### Web Search — ${targetCountry} Local Aviation News
${webLocal}

### Web Search — South African Airport Airspace (FACT/FAOR/FALA)
${webLocalAirports}

### Web Search — ATCO Vacancies (search 1)
${webJobs1}

### Web Search — ATCO Vacancies (search 2)
${webJobs2}

### Web Search — ATCO Vacancies (LinkedIn / FlightGlobal)
${webJobs3}

### Web Search — ATCO Recruitment 2026
${webJobs4}

### Web Search — ATCO Hiring (broad)
${webJobs5}

### Web Search — ATCO Recruitment (broad)
${webJobs6}

---
${recentBlock ? `\n${recentBlock}\n\n---\n` : ''}

## Task

Write the On My Radar brief for **${date}**, target country: **${targetCountry}**.

For xPostUrl: match each article to the best tweet from the X results above. Prefer tweets with "Has video: true". If no matching tweet exists, set xPostUrl to null.

Output ONLY a valid JSON object — no prose, no markdown, no preamble:
{
  "date": "${date}",
  "targetCountry": "${targetCountry}",
  "global": [ { "headline": "", "summary": "", "category": "", "severity": "", "source": "", "sourceUrl": "", "xPostUrl": null, "imagePrompt": "" } ],
  "local": [],
  "noLocalNews": false,
  "jobs": [ { "title": "", "ansp": "", "location": "", "type": "ACC|APP|TWR", "source": "", "sourceUrl": null, "primarySourceUrl": null, "posted": null, "closingDate": null } ]
}`

  // Call Claude CLI — prompt via stdin, JSON response on stdout
  console.log('[newsdesk] Calling claude CLI...')
  const claudeResult = spawnSync('claude', ['--print', '--model', 'claude-sonnet-4-6'], {
    input: fullPrompt,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: 300_000,
    env: process.env,
  })

  if (claudeResult.error) {
    throw new Error(`Claude CLI spawn failed: ${claudeResult.error.message}`)
  }
  if (claudeResult.status !== 0) {
    const stderr = (claudeResult.stderr ?? '').slice(0, 500)
    throw new Error(`Claude CLI exited ${claudeResult.status}: ${stderr}`)
  }

  const output = claudeResult.stdout ?? ''
  if (!output.trim()) {
    throw new Error('Claude CLI returned empty output')
  }

  // Parse the JSON response
  try {
    const jsonStr = extractJson(output)
    const parsed = BriefSchema.parse(JSON.parse(jsonStr))
    console.log(
      `[newsdesk] Brief complete — ${parsed.global.length} global, ${parsed.local.length} local, ${parsed.jobs.length} jobs`
    )
    return parsed as Brief
  } catch (err) {
    console.error('[newsdesk] Failed to parse brief JSON:', err)
    console.error('[newsdesk] Raw response preview:', output.slice(0, 800))
    throw new Error(`Newsdesk JSON parse failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}
