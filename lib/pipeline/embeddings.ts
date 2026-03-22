import { embed } from 'ai'
import { google } from '@ai-sdk/google'
import type { BriefArticle } from '@/lib/types'

interface ArticleWithEmbedding extends BriefArticle {
  imageUrl?: string
  embedding?: number[]
}

export async function embedArticles(
  articles: ArticleWithEmbedding[]
): Promise<ArticleWithEmbedding[]> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.warn('[embeddings] No Google API key — skipping embeddings')
    return articles
  }

  return Promise.all(
    articles.map(async (article) => {
      try {
        const text = `${article.headline}\n\n${article.summary}`
        const { embedding } = await embed({
          model: google.textEmbeddingModel('gemini-embedding-exp-03-07'),
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
