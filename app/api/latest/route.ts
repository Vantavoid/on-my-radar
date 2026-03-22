import { NextResponse } from 'next/server'
import { getLatestEdition } from '@/lib/db/queries'

export async function GET() {
  const edition = await getLatestEdition()
  if (!edition) {
    return NextResponse.json({ date: null, editionNumber: null, headline: null }, { status: 404 })
  }

  const leadArticle = edition.articles.find((a) => a.section === 'global') ?? edition.articles[0]

  return NextResponse.json({
    date: edition.date,
    editionNumber: edition.editionNumber,
    headline: leadArticle?.headline ?? null,
  })
}
