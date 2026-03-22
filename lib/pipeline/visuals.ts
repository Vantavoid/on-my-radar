import { generateText } from 'ai'
import { put } from '@vercel/blob'
import type { BriefArticle } from '@/lib/types'

interface ArticleWithImage extends BriefArticle {
  imageUrl?: string
}

export async function generateImages(articles: BriefArticle[]): Promise<ArticleWithImage[]> {
  if (!process.env.VERCEL_BLOB_READ_WRITE_TOKEN && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('[visuals] No Blob token — skipping image generation')
    return articles
  }

  return Promise.all(
    articles.map(async (article) => {
      try {
        const prompt = article.imagePrompt || buildDefaultPrompt(article)

        const result = await generateText({
          model: 'google/gemini-3.1-flash-image-preview',
          prompt: `Generate a cinematic, photorealistic aviation image. ${prompt}.
Style: dark, dramatic, high-contrast. Night or golden hour lighting. Professional aviation photography aesthetic.
Do NOT include text overlays or watermarks.`,
        })

        const imageFiles = result.files?.filter((f) => f.mediaType?.startsWith('image/'))
        if (!imageFiles?.length) return article

        const imageData = imageFiles[0]
        const buffer = Buffer.from(imageData.uint8Array)
        const filename = `articles/${article.headline.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}-${Date.now()}.png`

        const blob = await put(filename, buffer, {
          access: 'private',
          contentType: imageData.mediaType ?? 'image/png',
        })

        return { ...article, imageUrl: blob.url }
      } catch (err) {
        console.error(`[visuals] Failed for "${article.headline}":`, err)
        return article
      }
    })
  )
}

function buildDefaultPrompt(article: BriefArticle): string {
  const categoryPrompts: Record<string, string> = {
    incident: 'Emergency aircraft on runway, flashing lights, emergency vehicles nearby',
    regulation: 'Air traffic control tower at night, radar screens glowing inside',
    technology: 'Modern ATC radar equipment, multiple monitors displaying flight data',
    airspace: 'Aerial view of busy airport with multiple aircraft, Cape Town coastline visible',
    weather: 'Dramatic storm clouds over an airport, lightning in distance, aircraft on approach',
    staffing: 'Professional air traffic controller at radar console, focused on screens',
  }
  return categoryPrompts[article.category] ?? 'Commercial aircraft in flight over ocean at sunset'
}
