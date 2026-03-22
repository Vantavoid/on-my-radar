import { getLatestEdition } from '@/lib/db/queries'
import RadarCanvas from '@/components/hero/RadarCanvas'
import ParallaxHero from '@/components/hero/ParallaxHero'
import BellyAircraftTransition from '@/components/hero/BellyAircraftTransition'
import ArticleCard from '@/components/articles/ArticleCard'
import AltitudeDivider from '@/components/articles/AltitudeDivider'
import ScrollAircraft from '@/components/articles/ScrollAircraft'
import StripBoard from '@/components/jobs/StripBoard'

export const revalidate = 3600

export default async function HomePage() {
  const edition = await getLatestEdition()

  const globalArticles = edition?.articles.filter((a) => a.section === 'global') ?? []
  const localArticles = edition?.articles.filter((a) => a.section === 'local') ?? []
  const jobs = edition?.jobs ?? []

  return (
    <>
      {/* Fixed radar background */}
      <RadarCanvas />

      {/* Scroll content layer */}
      <div className="relative z-[2]">
        {/* Hero */}
        <ParallaxHero edition={edition} />

        {/* Section transition: belly aircraft flyover */}
        <div className="relative overflow-hidden" style={{ marginBottom: '-2px' }}>
          <BellyAircraftTransition />
        </div>

        {edition ? (
          <main className="relative max-w-5xl mx-auto px-6 pb-24">
            {/* Global news */}
            <section className="mb-56 mt-16">
              <h2 className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase mb-8 opacity-60">
                &#9656; GLOBAL
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {globalArticles.map((article, i) => (
                  <ArticleCard key={article.id} article={article} index={i} />
                ))}
              </div>
            </section>

            {/* Altitude transition */}
            <AltitudeDivider label="FL180 TRANSITION" />

            {/* Local section header */}
            <AltitudeDivider label={`${edition.targetCountry.toUpperCase()} TMA`} />

            {/* Local news — with scroll aircraft as background decoration */}
            <section className="relative mb-56">
              <ScrollAircraft />
              <h2 className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase mb-8 opacity-60">
                &#9656; {edition.targetCountry.toUpperCase()}
              </h2>
              {localArticles.length === 0 ? (
                <p className="font-mono text-text-muted text-sm">
                  No significant local ATC news in last 24h. Monitoring SACAA and ATNS channels.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  {localArticles.map((article, i) => (
                    <ArticleCard key={article.id} article={article} index={i} />
                  ))}
                </div>
              )}
            </section>

            {/* Jobs */}
            {jobs.length > 0 && (
              <>
                <AltitudeDivider label="GND DEPARTURE" />
                <section className="mb-56">
                  <h2 className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase mb-8 opacity-60">
                    &#9656; POSITIONS
                  </h2>
                  <StripBoard jobs={jobs} />
                </section>
              </>
            )}
          </main>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-text-muted font-mono text-sm">
            <p>No edition found.</p>
            <p className="mt-2 opacity-50">Run the pipeline to generate the first edition.</p>
          </div>
        )}

        <footer className="border-t border-metal-dark py-8 text-center font-mono text-steel-blue text-xs tracking-widest opacity-60">
          POWERED BY OTTO &middot; CAPE TOWN ACC &middot; {edition?.date ?? new Date().toISOString().slice(0, 10)}
        </footer>
      </div>
    </>
  )
}
