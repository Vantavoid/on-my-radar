import { embed } from 'ai'
import type { BriefArticle } from '@/lib/types'

interface ArticleWithEmbedding extends BriefArticle {
  imageUrl?: string
  embedding?: number[]
}

export async function embedArticles(
  articles: ArticleWithEmbedding[]
): Promise<ArticleWithEmbedding[]> {
  return Promise.all(
    articles.map(async (article) => {
      try {
        const text = `${article.headline}\n\n${article.summary}`
        const { embedding } = await embed({
          model: 'google/text-embedding-005' as any,
          value: text,
        })
        return { ...article, embedding }
      } catch (err) {
        console.error(`[embeddings] Failed for "${article.headline}":`, err)
        return article
      }
    })
  )
}
