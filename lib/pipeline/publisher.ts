/**
 * Daily publish pipeline orchestrator.
 * Called by .claude/scripts/daily-publish.ts at 0400z UTC.
 *
 * Steps:
 *  1. Newsdesk agent → curated Brief JSON
 *  2. Visual Director → Gemini images per article → Vercel Blob URLs
 *  3. Embedder → Gemini Embedding 2 → pgvector
 *  4. Write to Neon DB
 *  5. Deploy (vercel deploy --prod)
 *  6. Notify via Telegram
 */

import { getDb } from '@/lib/db/client'
import { editions, articles, jobs } from '@/lib/db/schema'
import type { Brief, BriefArticle } from '@/lib/types'
import { generateImages } from './visuals'
import { embedArticles } from './embeddings'
import { eq } from 'drizzle-orm'

function slugify(headline: string, date: string): string {
  return `${date}-${headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)}`
}

export async function publishEdition(brief: Brief): Promise<{ editionNumber: number; url: string }> {
  const db = getDb()

  // 1. Determine edition number
  const existing = await db.select().from(editions)
  const editionNumber = existing.length + 1

  // 2. Insert edition
  await db.insert(editions).values({
    date: brief.date,
    editionNumber,
    targetCountry: brief.targetCountry,
  }).onConflictDoNothing()

  // 3. Generate images for all articles
  const allArticles: BriefArticle[] = [...brief.global, ...brief.local]
  const withImages = await generateImages(allArticles)

  // 4. Generate embeddings
  const withEmbeddings = await embedArticles(withImages)

  // 5. Insert articles
  const globalArticles = withEmbeddings.slice(0, brief.global.length)
  const localArticles = withEmbeddings.slice(brief.global.length)

  for (const [i, article] of globalArticles.entries()) {
    await db.insert(articles).values({
      editionDate: brief.date,
      slug: slugify(article.headline, brief.date),
      headline: article.headline,
      summary: article.summary,
      category: article.category,
      severity: article.severity,
      section: 'global',
      source: article.source,
      sourceUrl: article.sourceUrl || null,
      xPostUrl: article.xPostUrl || null,
      imageUrl: article.imageUrl || null,
      imagePrompt: article.imagePrompt || null,
      embedding: article.embedding || null,
    }).onConflictDoNothing()
  }

  for (const article of localArticles) {
    await db.insert(articles).values({
      editionDate: brief.date,
      slug: slugify(article.headline, brief.date),
      headline: article.headline,
      summary: article.summary,
      category: article.category,
      severity: article.severity,
      section: 'local',
      source: article.source,
      sourceUrl: article.sourceUrl || null,
      xPostUrl: article.xPostUrl || null,
      imageUrl: article.imageUrl || null,
      imagePrompt: article.imagePrompt || null,
      embedding: article.embedding || null,
    }).onConflictDoNothing()
  }

  // 6. Insert jobs
  for (const job of brief.jobs) {
    await db.insert(jobs).values({
      editionDate: brief.date,
      title: job.title,
      ansp: job.ansp,
      location: job.location,
      type: job.type,
      sourceUrl: job.sourceUrl || null,
      primarySourceUrl: job.primarySourceUrl || null,
      posted: job.posted || null,
    })
  }

  // 7. Mark published
  await db.update(editions)
    .set({ publishedAt: new Date() })
    .where(eq(editions.date, brief.date))

  return {
    editionNumber,
    url: `https://on-my-radar.vercel.app`,
  }
}
