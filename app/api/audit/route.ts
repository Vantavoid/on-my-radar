import { NextRequest, NextResponse } from 'next/server'
import { generateText, stepCountIs } from 'ai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getDb } from '@/lib/db/client'
import { improvementReports } from '@/lib/db/schema'
import { getRecentEditions } from '@/lib/db/queries'
import { notifyTelegram } from '@/lib/notify'

export const maxDuration = 300

function loadAuditPrompt(): string {
  try {
    return readFileSync(join(process.cwd(), '.claude/prompts/improvement.md'), 'utf-8')
  } catch {
    return 'You are an improvement agent. Audit the provided edition data and return a structured JSON report.'
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const recentEditions = await getRecentEditions(7)

    if (!recentEditions.length) {
      await notifyTelegram('*On My Radar Audit*: No editions in the past 7 days — skipping.')
      return NextResponse.json({ ok: true, skipped: true, reason: 'No recent editions' })
    }

    const editionSummary = recentEditions.map((e) => ({
      date: e.date,
      editionNumber: e.editionNumber,
      articleCount: e.articles.length,
      articles: e.articles.map((a) => ({
        headline: a.headline,
        category: a.category,
        severity: a.severity,
        section: a.section,
        source: a.source,
        imagePrompt: a.imagePrompt,
      })),
    }))

    const systemPrompt = loadAuditPrompt()

    const result = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      system: systemPrompt,
      prompt: `Here are the past ${recentEditions.length} editions from the last 7 days. Audit them and return your JSON report.\n\n${JSON.stringify(editionSummary, null, 2)}`,
      stopWhen: stepCountIs(5),
    })

    // Extract the report markdown from the response
    const weekOf = recentEditions[recentEditions.length - 1].date
    const db = getDb()
    await db.insert(improvementReports).values({
      weekOf,
      reportMd: result.text,
    })

    // Send Telegram summary (first 500 chars)
    const preview = result.text.slice(0, 500)
    await notifyTelegram(
      `*On My Radar Weekly Audit*\n` +
      `Week of ${weekOf} · ${recentEditions.length} editions reviewed\n\n` +
      `${preview}${result.text.length > 500 ? '...' : ''}`
    )

    return NextResponse.json({ ok: true, weekOf, editionsReviewed: recentEditions.length })
  } catch (error) {
    console.error('Audit pipeline failed:', error)
    await notifyTelegram(`*On My Radar Audit* failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return NextResponse.json(
      { error: 'Audit failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
