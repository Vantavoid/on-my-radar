import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import { editions, articles, jobs } from '@/lib/db/schema'
import { desc, eq, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')
  const db = getDb()

  if (action === 'cleanup-empty') {
    // Delete editions with 0 articles
    const allEditions = await db.select().from(editions).orderBy(desc(editions.date))
    const deleted: string[] = []
    for (const ed of allEditions) {
      const arts = await db.select({ id: articles.id }).from(articles).where(eq(articles.editionDate, ed.date))
      if (arts.length === 0) {
        await db.delete(editions).where(eq(editions.date, ed.date))
        deleted.push(ed.date)
      }
    }
    return NextResponse.json({ deleted })
  }

  const allEditions = await db.select().from(editions).orderBy(desc(editions.date))
  const result: Record<string, unknown>[] = []

  for (const ed of allEditions) {
    const arts = await db.select({ id: articles.id, headline: articles.headline, section: articles.section, slug: articles.slug }).from(articles).where(eq(articles.editionDate, ed.date))
    const jbs = await db.select({ id: jobs.id, title: jobs.title }).from(jobs).where(eq(jobs.editionDate, ed.date))
    result.push({ ...ed, articleCount: arts.length, articles: arts, jobCount: jbs.length, jobs: jbs })
  }

  return NextResponse.json(result, { status: 200 })
}
