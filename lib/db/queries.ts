import { desc, eq, sql } from 'drizzle-orm'
import { getDb } from './client'
import { articles, editions, jobs } from './schema'
import type { EditionWithContent } from '@/lib/types'

export async function getLatestEdition(): Promise<EditionWithContent | null> {
  const db = getDb()
  const edition = await db
    .select()
    .from(editions)
    .orderBy(desc(editions.date))
    .limit(1)
  if (!edition[0]) return null

  const [editionArticles, editionJobs] = await Promise.all([
    db.select().from(articles).where(eq(articles.editionDate, edition[0].date)),
    db.select().from(jobs).where(eq(jobs.editionDate, edition[0].date)),
  ])

  return serializeEdition(edition[0], editionArticles, editionJobs)
}

export async function getEditionByDate(date: string): Promise<EditionWithContent | null> {
  const db = getDb()
  const edition = await db
    .select()
    .from(editions)
    .where(eq(editions.date, date))
    .limit(1)
  if (!edition[0]) return null

  const [editionArticles, editionJobs] = await Promise.all([
    db.select().from(articles).where(eq(articles.editionDate, date)),
    db.select().from(jobs).where(eq(jobs.editionDate, date)),
  ])

  return serializeEdition(edition[0], editionArticles, editionJobs)
}

// Drizzle returns Date objects for timestamp columns; serialize to ISO strings for the public types
function serializeEdition(
  edition: { id: number; date: string; editionNumber: number; targetCountry: string; publishedAt: Date | null; createdAt: Date },
  editionArticles: Array<Record<string, unknown>>,
  editionJobs: Array<Record<string, unknown>>
): EditionWithContent {
  return {
    ...edition,
    publishedAt: edition.publishedAt?.toISOString() ?? null,
    createdAt: edition.createdAt.toISOString(),
    articles: editionArticles.map((a) => ({
      ...a,
      createdAt: (a.createdAt as Date).toISOString(),
    })) as EditionWithContent['articles'],
    jobs: editionJobs.map((j) => ({
      ...j,
      createdAt: (j.createdAt as Date).toISOString(),
    })) as EditionWithContent['jobs'],
  }
}

export async function getArticleBySlug(slug: string) {
  const db = getDb()
  const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1)
  return result[0] ?? null
}

export async function getRelatedArticles(articleId: number, embedding: number[], limit = 4) {
  const db = getDb()
  // Cosine similarity search via pgvector
  const vectorStr = `[${embedding.join(',')}]`
  const result = await db.execute(
    sql`SELECT id, headline, summary, category, severity, image_url, slug
        FROM articles
        WHERE id != ${articleId} AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${limit}`
  )
  return result.rows
}

export async function getAllEditionDates(): Promise<string[]> {
  const db = getDb()
  const result = await db
    .select({ date: editions.date })
    .from(editions)
    .orderBy(desc(editions.date))
  return result.map((r) => r.date)
}

export async function getRecentEditions(days = 7) {
  const db = getDb()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const recentEditions = await db
    .select()
    .from(editions)
    .where(sql`${editions.date} >= ${cutoffStr}`)
    .orderBy(desc(editions.date))

  const editionDates = recentEditions.map((e) => e.date)
  if (!editionDates.length) return []

  const editionArticles = await db
    .select()
    .from(articles)
    .where(sql`${articles.editionDate} IN ${editionDates}`)

  return recentEditions.map((edition) => ({
    ...edition,
    articles: editionArticles.filter((a) => a.editionDate === edition.date),
  }))
}

export async function getEditionCount(): Promise<number> {
  const db = getDb()
  const result = await db.execute(sql`SELECT COUNT(*) as count FROM editions`)
  return parseInt(String(result.rows[0]?.count ?? '0'))
}
