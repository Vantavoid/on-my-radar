import { config } from 'dotenv'
config({ path: '.env.local' })

import { runNewsdesk } from '../lib/pipeline/newsdesk'
import { publishEdition } from '../lib/pipeline/publisher'

async function main() {
  const today = new Date().toISOString().slice(0, 10)
  console.log(`[pipeline] Starting manual run for ${today}`)
  console.log(`[pipeline] BRAVE_API_KEY: ${process.env.BRAVE_API_KEY ? 'set' : 'MISSING'}`)
  console.log(`[pipeline] DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'MISSING'}`)
  console.log(`[pipeline] BLOB_READ_WRITE_TOKEN: ${process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'MISSING'}`)
  console.log(`[pipeline] VERCEL_OIDC_TOKEN: ${process.env.VERCEL_OIDC_TOKEN ? 'set' : 'MISSING'}`)

  const brief = await runNewsdesk(today)
  console.log(`[pipeline] Newsdesk complete: ${brief.global.length} global, ${brief.local.length} local, ${brief.jobs.length} jobs`)

  if (brief.global.length === 0 && brief.local.length === 0) {
    console.log('[pipeline] Empty brief — newsdesk returned no articles. Aborting publish.')
    process.exit(1)
  }

  const result = await publishEdition(brief)
  console.log(`[pipeline] Published edition #${result.editionNumber}`)
  console.log(`[pipeline] URL: ${result.url}`)
  console.log('[pipeline] Done!')
}

main().catch((err) => {
  console.error('[pipeline] Failed:', err)
  process.exit(1)
})
