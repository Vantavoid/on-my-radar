import { notFound } from 'next/navigation'
import { getEditionByDate, getAllEditionDates } from '@/lib/db/queries'
import ArticleCard from '@/components/articles/ArticleCard'
import StripBoard from '@/components/jobs/StripBoard'
import AltitudeDivider from '@/components/articles/AltitudeDivider'
import Link from 'next/link'

export const revalidate = 3600

interface ArchivePageProps {
  params: Promise<{ date: string }>
}

export async function generateMetadata({ params }: ArchivePageProps) {
  const { date } = await params
  return {
    title: `Edition ${date} — On My Radar`,
    description: `Aviation news archive for ${date}`,
  }
}

export default async function ArchivePage({ params }: ArchivePageProps) {
  const { date } = await params

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  const edition = await getEditionByDate(date)
  if (!edition) notFound()

  const globalArticles = edition.articles.filter((a) => a.section === 'global')
  const localArticles = edition.articles.filter((a) => a.section === 'local')
  const allDates = await getAllEditionDates()

  return (
    <div className="relative z-[2]">
      {/* Header */}
      <header className="pt-16 pb-12 text-center">
        <Link
          href="/"
          className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase hover:text-radar-green transition-colors"
        >
          ON MY RADAR
        </Link>
        <h1 className="font-mono text-white text-2xl tracking-[0.15em] mt-4 uppercase">
          Edition {edition.editionNumber}
        </h1>
        <p className="font-mono text-steel-blue text-xs tracking-widest mt-2 opacity-60">
          {edition.date} &middot; {edition.targetCountry}
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-6 pb-24">
        {/* Global */}
        {globalArticles.length > 0 && (
          <section className="mb-20">
            <h2 className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase mb-8 opacity-60">
              &#9656; GLOBAL
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {globalArticles.map((article, i) => (
                <ArticleCard key={article.id} article={article} index={i} />
              ))}
            </div>
          </section>
        )}

        {localArticles.length > 0 && (
          <>
            <AltitudeDivider label={`${edition.targetCountry.toUpperCase()} TMA`} />
            <section className="mb-20">
              <h2 className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase mb-8 opacity-60">
                &#9656; {edition.targetCountry.toUpperCase()}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {localArticles.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} />
                ))}
              </div>
            </section>
          </>
        )}

        {edition.jobs.length > 0 && (
          <>
            <AltitudeDivider label="GND DEPARTURE" />
            <section className="mb-20">
              <h2 className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase mb-8 opacity-60">
                &#9656; POSITIONS
              </h2>
              <StripBoard jobs={edition.jobs} />
            </section>
          </>
        )}

        {/* Edition navigator */}
        <nav className="border-t border-metal-dark pt-8 mt-16">
          <h3 className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase mb-4 opacity-60">
            &#9656; ARCHIVE
          </h3>
          <div className="flex flex-wrap gap-3">
            {allDates.map((d) => (
              <Link
                key={d}
                href={`/${d}`}
                className={`font-mono text-xs px-3 py-1.5 rounded border transition-colors ${
                  d === date
                    ? 'border-radar-green text-radar-green bg-radar-green/10'
                    : 'border-metal-dark text-steel-blue hover:border-steel-blue'
                }`}
              >
                {d}
              </Link>
            ))}
          </div>
        </nav>
      </main>

      <footer className="border-t border-metal-dark py-8 text-center font-mono text-steel-blue text-xs tracking-widest opacity-60">
        POWERED BY OTTO &middot; CAPE TOWN ACC
      </footer>
    </div>
  )
}
