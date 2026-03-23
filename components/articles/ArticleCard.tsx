'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import type { Article, Category, Severity } from '@/lib/types'

const SEVERITY_BORDER: Record<Severity, string> = {
  critical: '4px solid #ff4444',
  notable: '4px solid #f5a623',
  routine: '2px solid #00ff88',
}

const SEVERITY_LABEL: Record<Severity, { text: string; color: string }> = {
  critical: { text: '\u25CF CRITICAL', color: '#ff4444' },
  notable: { text: '\u25C9 NOTABLE', color: '#f5a623' },
  routine: { text: '\u25CB ROUTINE', color: '#00ff88' },
}

const CATEGORY_COLORS: Record<Category, string> = {
  incident: '#ff4444',
  regulation: '#4a7fa5',
  technology: '#00ff88',
  airspace: '#f5a623',
  weather: '#8899aa',
  staffing: '#a070d0',
}

interface ArticleCardProps {
  article: Article
  index?: number
}

export default function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const catColor = CATEGORY_COLORS[article.category] ?? '#4a7fa5'
  const sev = SEVERITY_LABEL[article.severity] ?? SEVERITY_LABEL.routine

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="card-ping relative"
      style={{
        background: 'rgba(13,17,23,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(74,127,165,0.25)',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        borderLeft: SEVERITY_BORDER[article.severity] ?? SEVERITY_BORDER.routine,
        borderRadius: '6px',
        padding: '20px 24px',
      }}
    >
      {/* Top row: badges + optional thumbnail */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`badge-${article.category} text-xs font-mono px-2 py-0.5 rounded uppercase tracking-widest`}
          >
            {article.category}
          </span>
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: sev.color }}>
            {sev.text}
          </span>
        </div>
        {article.imageUrl && (
          <Image
            src={article.imageUrl}
            alt=""
            width={80}
            height={80}
            className="rounded object-cover shrink-0"
            style={{ width: 80, height: 80 }}
          />
        )}
      </div>

      {/* Headline */}
      <Link href={`/article/${article.slug}`} className="block group">
        <h2 className="text-white font-bold text-lg leading-snug mb-3 group-hover:text-radar-green transition-colors">
          {article.headline}
        </h2>
      </Link>

      {/* Summary */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: '#a0b4c8' }}>
        {article.summary}
      </p>

      {/* Source */}
      <div className="flex items-center gap-4 flex-wrap">
        {article.sourceUrl ? (
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-steel-blue hover:text-radar-green transition-colors uppercase tracking-wider"
          >
            {article.source} &#8599;
          </a>
        ) : (
          <span className="text-xs font-mono text-steel-blue">{article.source}</span>
        )}
      </div>
    </motion.article>
  )
}
