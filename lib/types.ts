export type Category = 'incident' | 'regulation' | 'technology' | 'airspace' | 'weather' | 'staffing'
export type Severity = 'routine' | 'notable' | 'critical'
export type JobType = 'ACC' | 'TWR' | 'APP'

export interface Article {
  id: number
  editionDate: string
  slug: string
  headline: string
  summary: string
  category: Category
  severity: Severity
  section: 'global' | 'local'
  source: string
  sourceUrl: string | null
  xPostUrl: string | null
  imageUrl: string | null
  imagePrompt: string | null
  createdAt: string
}

export interface Job {
  id: number
  editionDate: string
  title: string
  ansp: string
  location: string
  type: JobType
  sourceUrl: string | null
  primarySourceUrl: string | null
  posted: string | null
  createdAt: string
}

export interface Edition {
  id: number
  date: string
  editionNumber: number
  targetCountry: string
  publishedAt: string | null
  createdAt: string
}

export interface EditionWithContent extends Edition {
  articles: Article[]
  jobs: Job[]
}

// Raw brief format from newsdesk pipeline (before DB insertion)
export interface BriefArticle {
  headline: string
  summary: string
  source: string
  sourceUrl: string
  category: Category
  severity: Severity
  xPostUrl?: string
  imagePrompt?: string
  imageUrl?: string
}

export interface BriefJob {
  title: string
  ansp: string
  location: string
  type: JobType
  source: string
  sourceUrl?: string
  primarySourceUrl?: string
  posted?: string
}

export interface Brief {
  date: string
  targetCountry: string
  global: BriefArticle[]
  local: BriefArticle[]
  noLocalNews?: boolean
  jobs: BriefJob[]
}
