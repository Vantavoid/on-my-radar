import { NextRequest, NextResponse } from 'next/server'
import { runNewsdesk } from '@/lib/pipeline/newsdesk'
import { publishEdition } from '@/lib/pipeline/publisher'
import { notifyTelegram } from '@/lib/notify'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date().toISOString().slice(0, 10)
    const brief = await runNewsdesk(today)
    const result = await publishEdition(brief)

    const articleCount = brief.global.length + brief.local.length
    const lead = brief.global[0]?.headline ?? 'No lead story'
    await notifyTelegram(
      `*On My Radar #${result.editionNumber}* published\n` +
      `${articleCount} articles · ${brief.jobs.length} jobs\n` +
      `Lead: ${lead}\n` +
      `${result.url}`
    )

    return NextResponse.json({ ok: true, date: today, editionNumber: result.editionNumber })
  } catch (error) {
    console.error('Publish pipeline failed:', error)
    await notifyTelegram(`*On My Radar* publish failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return NextResponse.json(
      { error: 'Pipeline failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
