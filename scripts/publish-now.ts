/**
 * One-shot publish script — runs the full pipeline locally.
 * Usage: npx tsx --env-file=.env.local scripts/publish-now.ts
 */

// Patch @ alias for tsx
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// Manual alias resolution: replace @/ imports at runtime
const projectRoot = resolve(import.meta.dirname, '..')

// We need to import with relative paths since tsx doesn't support tsconfig paths
const { runNewsdesk } = await import(pathToFileURL(resolve(projectRoot, 'lib/pipeline/newsdesk.ts')).href)
const { publishEdition } = await import(pathToFileURL(resolve(projectRoot, 'lib/pipeline/publisher.ts')).href)
const { notifyTelegram } = await import(pathToFileURL(resolve(projectRoot, 'lib/notify.ts')).href)

const today = new Date().toISOString().slice(0, 10)
console.log(`[publish] Starting pipeline for ${today}`)

const brief = await runNewsdesk(today)
console.log(`[publish] Brief ready — ${brief.global.length} global, ${brief.local.length} local, ${brief.jobs.length} jobs`)

const result = await publishEdition(brief)
console.log(`[publish] Edition #${result.editionNumber} published`)

const articleCount = brief.global.length + brief.local.length
const lead = brief.global[0]?.headline ?? 'No lead story'
await notifyTelegram(
  `*On My Radar #${result.editionNumber}* published\n` +
  `${articleCount} articles · ${brief.jobs.length} jobs\n` +
  `Lead: ${lead}\n` +
  `${result.url}`
)

console.log('[publish] Done!')
