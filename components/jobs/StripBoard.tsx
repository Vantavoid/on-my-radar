'use client'

import { motion } from 'framer-motion'
import type { Job, JobType } from '@/lib/types'

const TYPE_COLORS: Record<JobType, string> = {
  ACC: '#4a7fa5',
  TWR: '#00ff88',
  APP: '#f5a623',
}

interface StripBoardProps {
  jobs: Job[]
}

export default function StripBoard({ jobs }: StripBoardProps) {
  return (
    <div className="flex flex-col gap-3">
      {jobs.map((job, i) => {
        const color = TYPE_COLORS[job.type] ?? '#4a7fa5'
        const url = job.primarySourceUrl || job.sourceUrl

        return (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className="flex gap-4 items-start rounded"
            style={{
              background: '#1a2a1a',
              borderLeft: `4px solid ${color}`,
              padding: '14px 18px',
            }}
          >
            <span
              className="text-xs font-mono font-bold shrink-0 mt-0.5"
              style={{ color, minWidth: '32px' }}
            >
              {job.type || '\u2014'}
            </span>

            <div className="flex-1 min-w-0">
              <div className="font-mono text-white text-sm font-semibold truncate">
                {job.title}
              </div>
              <div className="font-mono text-xs mt-0.5" style={{ color: '#a0b4c8' }}>
                {job.ansp} &mdash; {job.location}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {job.posted && (
                  <span className="text-xs font-mono text-steel-blue">
                    Posted {job.posted}
                  </span>
                )}
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-radar-green hover:underline"
                  >
                    Apply &#8599;
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
