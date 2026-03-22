import { notFound } from 'next/navigation'
import { getArticleBySlug, getLatestEdition } from '@/lib/db/queries'
import ArticleHero from '@/components/articles/ArticleHero'
import ArticleCard from '@/components/articles/ArticleCard'
import type { Article } from '@/lib/types'

export const revalidate = 3600

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return { title: 'Article Not Found' }
  return {
    title: `${article.headline} — On My Radar`,
    description: article.summary,
    openGraph: {
      title: article.headline,
      description: article.summary,
      images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
    },
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const raw = await getArticleBySlug(slug)
  if (!raw) notFound()

  const article = {
    ...raw,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt),
  } as Article

  // Get related articles from the same edition
  const edition = await getLatestEdition()
  const relatedArticles = edition?.articles
    .filter((a) => a.id !== article.id)
    .slice(0, 4) ?? []

  return (
    <div className="relative z-[2]">
      <ArticleHero article={article} />

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Article body */}
        <div className="font-mono text-text-primary text-sm leading-relaxed space-y-4">
          <p>{article.summary}</p>
        </div>

        {/* Source */}
        <div className="mt-8 pt-6 border-t border-metal-dark">
          <div className="flex items-center gap-4 flex-wrap">
            {article.sourceUrl ? (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-steel-blue hover:text-radar-green transition-colors uppercase tracking-wider"
              >
                {article.source} &#8599;
              </a>
            ) : (
              <span className="font-mono text-xs text-steel-blue">{article.source}</span>
            )}
            <span className="font-mono text-xs text-text-muted">
              {article.editionDate}
            </span>
          </div>
        </div>

        {/* Related articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-16">
            <h2 className="font-mono text-steel-blue text-xs tracking-[0.4em] uppercase mb-8 opacity-60">
              &#9656; ALSO ON RADAR
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedArticles.map((a, i) => (
                <ArticleCard key={a.id} article={a} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Back link */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <a
          href="/"
          className="font-mono text-xs text-steel-blue hover:text-radar-green transition-colors uppercase tracking-wider"
        >
          &larr; BACK TO RADAR
        </a>
      </div>
    </div>
  )
}
