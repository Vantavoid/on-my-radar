'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const PATH = 'M 50,350 C 200,300 300,50 500,200 C 700,350 800,100 950,180'

function getPointOnPath(pathEl: SVGPathElement | null, t: number): { x: number; y: number; angle: number } {
  if (!pathEl) return { x: 50, y: 350, angle: 0 }
  const len = pathEl.getTotalLength()
  const pt = pathEl.getPointAtLength(t * len)
  const pt2 = pathEl.getPointAtLength(Math.min(t * len + 1, len))
  const angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * (180 / Math.PI)
  return { x: pt.x, y: pt.y, angle }
}

export default function ScrollAircraft() {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const progress = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60">
      <svg
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* Hidden path for measurement */}
        <path ref={pathRef} d={PATH} fill="none" stroke="none" />

        {/* Visible contrail path */}
        <path
          d={PATH}
          fill="none"
          stroke="rgba(74,127,165,0.15)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Contrails - rendered as trailing lines */}
        <motion.path
          d={PATH}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="3"
          style={{
            pathLength: progress,
          }}
        />
        <motion.path
          d={PATH}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="8"
          style={{
            pathLength: progress,
          }}
        />
      </svg>

      {/* Aircraft */}
      <motion.div
        className="absolute pointer-events-none z-0"
        style={{
          width: 40,
          height: 15,
          left: useTransform(progress, (t) => {
            const { x } = getPointOnPath(pathRef.current, t)
            return `${(x / 1000) * 100}%`
          }),
          top: useTransform(progress, (t) => {
            const { y } = getPointOnPath(pathRef.current, t)
            return `${(y / 400) * 100}%`
          }),
          rotate: useTransform(progress, (t) => {
            const { angle } = getPointOnPath(pathRef.current, t)
            return angle
          }),
          translateX: '-50%',
          translateY: '-50%',
        }}
      >
        {/* 747 side silhouette */}
        <svg viewBox="0 0 40 15" className="w-full h-full">
          <path
            d="M2,8 L8,7 L12,4 L18,3 L30,3 L36,5 L38,7 L36,9 L30,9 L18,10 L12,13 L8,10 L2,9 Z"
            fill="none"
            stroke="#4a7fa5"
            strokeWidth="0.8"
          />
          {/* Tail */}
          <path
            d="M30,3 L33,0 L36,0 L36,5"
            fill="none"
            stroke="#4a7fa5"
            strokeWidth="0.6"
          />
          {/* Engine */}
          <ellipse cx="14" cy="11" rx="2.5" ry="1" fill="none" stroke="#4a7fa5" strokeWidth="0.5" />
        </svg>
      </motion.div>
    </div>
  )
}
