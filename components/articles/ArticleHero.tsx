'use client'

import Image from 'next/image'
import type { Article, Severity } from '@/lib/types'

const SEVERITY_LABEL: Record<Severity, { text: string; color: string }> = {
  critical: { text: '\u25CF CRITICAL', color: '#ff4444' },
  notable: { text: '\u25C9 NOTABLE', color: '#f5a623' },
  routine: { text: '\u25CB ROUTINE', color: '#00ff88' },
}

const CATEGORY_COLORS: Record<string, string> = {
  incident: '#ff4444',
  regulation: '#4a7fa5',
  technology: '#00ff88',
  airspace: '#f5a623',
  weather: '#8899aa',
  staffing: '#a070d0',
}

interface ArticleHeroProps {
  article: Article
}

export default function ArticleHero({ article }: ArticleHeroProps) {
  const sev = SEVERITY_LABEL[article.severity] ?? SEVERITY_LABEL.routine
  const catColor = CATEGORY_COLORS[article.category] ?? '#4a7fa5'

  return (
    <section
      className="relative flex flex-col justify-end overflow-hidden"
      style={{ minHeight: '50vh' }}
    >
      {/* Background image */}
      {article.imageUrl && (
        <Image
          src={article.imageUrl}
          alt=""
          fill
          className="object-cover"
          style={{ opacity: 0.2 }}
          priority
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 30%, #080c10 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-6 pb-12 pt-32">
        {/* Badges */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`badge-${article.category} text-xs font-mono px-2 py-0.5 rounded uppercase tracking-widest`}
          >
            {article.category}
          </span>
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: sev.color }}>
            {sev.text}
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-mono text-white font-bold leading-tight mb-4"
          style={{
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            animation: 'scanLine 2s ease-out forwards',
          }}
        >
          {article.headline}
        </h1>

        {/* Meta */}
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
          {article.xPostUrl && (
            <a
              href={article.xPostUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs uppercase tracking-wider transition-colors"
              style={{ color: '#1d9bf0' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#00ff88')}
              onMouseLeave={e => (e.currentTarget.style.color = '#1d9bf0')}
            >
              &#9654; View on X
            </a>
          )}
          <span className="font-mono text-xs text-text-muted">{article.editionDate}</span>
        </div>
      </div>
    </section>
  )
}
