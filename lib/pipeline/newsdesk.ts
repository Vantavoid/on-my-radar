/**
 * Newsdesk pipeline — AI news research and brief generation.
 *
 * Uses Claude Sonnet via AI Gateway + Brave Search for web research.
 * Produces a Brief JSON conforming to lib/types.ts
 *
 * Called by .claude/scripts/daily-publish.ts at 0400z UTC.
 */

import { generateText, tool, stepCountIs } from 'ai'
import { z } from 'zod'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { Brief } from '@/lib/types'

// ---------------------------------------------------------------------------
// Brave Search helper
// ---------------------------------------------------------------------------

async function braveSearch(query: string, freshness?: string): Promise<string> {
  const key = process.env.BRAVE_API_KEY
  if (!key) {
    console.warn('[newsdesk] No BRAVE_API_KEY — search unavailable')
    return `[Search unavailable — no Brave API key configured for query: ${query}]`
  }

  const params = new URLSearchParams({ q: query, count: '10' })
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
    const results: Array<{ title: string; url: string; description?: string }> =
      data.web?.results ?? []

    if (!results.length) return `[No results found for: ${query}]`

    return results
      .slice(0, 8)
      .map((r) => `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.description ?? '(no snippet)'}\n`)
      .join('\n---\n')
  } catch (err) {
    console.error(`[newsdesk] Brave search error for "${query}":`, err)
    return `[Search error for: ${query}]`
  }
}

// ---------------------------------------------------------------------------
// System prompt loader
// ---------------------------------------------------------------------------

function loadSystemPrompt(): string {
  try {
    return readFileSync(join(process.cwd(), '.claude/prompts/newsdesk.md'), 'utf-8')
  } catch {
    // Inline fallback if file not found
    return `You are the Newsdesk for On My Radar, an aviation publication for Air Traffic Controllers.
Research aviation news and return a valid JSON brief with global (5-8 items), local (2-4 items), and jobs (3-8 items).
Every sourceUrl must be a URL you actually retrieved. Never invent facts or URLs.`
  }
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
  sourceUrl: z.string().optional(),
  primarySourceUrl: z.string().optional(),
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
  // Try markdown code block first
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlock) return codeBlock[1].trim()

  // Try to find a top-level JSON object
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

  const systemPrompt = loadSystemPrompt()

  let result
  try {
    result = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      system: systemPrompt,
      prompt: `Research and write the On My Radar aviation brief for ${date}. Target country: ${targetCountry}.

Use the web_search tool to:
1. Search global aviation news — at least 3 searches using queries like:
   - "aviation incident accident ${date}"
   - "ATC airspace NOTAM announcement ${date}"
   - "ICAO FAA EUROCONTROL news ${date}"
2. Search ${targetCountry} local aviation news — at least 2 searches:
   - "${targetCountry} SACAA ATNS aviation news ${date}"
   - "FACT FAOR FALA airspace ${date}"
3. Search for current EXPERIENCED ATCO job vacancies — at least 2 searches:
   - "experienced rated ATCO controller vacancy ${new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}"
   - "qualified air traffic controller position ANSP ${new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}"
   IMPORTANT: Only include positions for EXPERIENCED/RATED controllers. Do NOT include trainee positions, bursaries, cadet programs, or entry-level roles.
   Each job MUST link to the SPECIFIC job posting URL — never link to a generic careers page (e.g., never atns.co.za/careers). Use the actual listing URL from the ANSP site, recruitment agency, LinkedIn, or FlightGlobal.

After completing all searches, output ONLY a valid JSON object matching this schema exactly — no prose, no markdown, no preamble:
{
  "date": "${date}",
  "targetCountry": "${targetCountry}",
  "global": [ { headline, summary, category, severity, source, sourceUrl, xPostUrl, imagePrompt } ],
  "local": [ ... ],
  "noLocalNews": false,
  "jobs": [ { title, ansp, location, type, source, sourceUrl, primarySourceUrl, posted } ]
}`,
      tools: {
        web_search: tool({
          description: 'Search the web for aviation news, incidents, regulatory updates, and job vacancies',
          inputSchema: z.object({
            query: z.string().describe('The search query'),
            freshness: z
              .string()
              .optional()
              .describe('Optional freshness filter: "pd" = past day, "pw" = past week'),
          }),
          execute: async ({ query, freshness }) => {
            console.log(`[newsdesk] web_search: ${query}`)
            return braveSearch(query, freshness)
          },
        }),
      },
      stopWhen: stepCountIs(20),
    })
  } catch (err) {
    console.error('[newsdesk] generateText failed:', err)
    throw new Error(`Newsdesk AI generation failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Parse the JSON response
  try {
    const jsonStr = extractJson(result.text)
    const parsed = BriefSchema.parse(JSON.parse(jsonStr))
    console.log(
      `[newsdesk] Brief complete — ${parsed.global.length} global, ${parsed.local.length} local, ${parsed.jobs.length} jobs`
    )
    return parsed as Brief
  } catch (err) {
    console.error('[newsdesk] Failed to parse brief JSON:', err)
    console.error('[newsdesk] Raw response preview:', result.text.slice(0, 800))
    throw new Error(`Newsdesk JSON parse failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}

