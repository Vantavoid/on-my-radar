'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import TableMountainWireframe from './TableMountainWireframe'
import N1Spinner from './N1Spinner'
import type { Edition } from '@/lib/types'

interface ParallaxHeroProps {
  edition: Edition | null
}

export default function ParallaxHero({ edition }: ParallaxHeroProps) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const mountainY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -40])
  const spinnerOpacity = useTransform(scrollYProgress, [0, 0.5], [0.6, 0])

  return (
    <section
      ref={ref}
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: '100vh', zIndex: 2 }}
    >
      {/* Layer 1: Table Mountain wireframe with parallax */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: mountainY, zIndex: 1 }}
      >
        <div className="absolute bottom-0 left-0 right-0">
          <TableMountainWireframe />
        </div>
      </motion.div>

      {/* Layer 2: N1 spinner — decorative, top-left */}
      <motion.div
        className="absolute top-8 left-8 pointer-events-none"
        style={{ opacity: spinnerOpacity, zIndex: 2 }}
      >
        <N1Spinner size={64} opacity={0.3} />
      </motion.div>

      {/* Layer 3: Title block */}
      <motion.div
        className="relative z-10 text-center px-6"
        style={{ y: titleY }}
      >
        <div
          className="font-mono tracking-[0.25em] text-white mb-2 uppercase"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            letterSpacing: '0.25em',
            textShadow: '0 0 40px rgba(0,255,136,0.3)',
            animation: 'scanLine 3s ease-out forwards',
          }}
        >
          ON MY RADAR
        </div>
        <div className="font-mono text-steel-blue text-sm tracking-[0.4em] uppercase">
          Aviation Intelligence — Cape Town
        </div>
        {edition && (
          <div className="font-mono text-steel-blue text-xs tracking-widest mt-2 opacity-60">
            Edition {edition.editionNumber} &middot; {edition.date}
          </div>
        )}
      </motion.div>

      {/* Scroll prompt */}
      {edition && (
        <div
          className="absolute bottom-12 font-mono text-amber text-xs tracking-widest z-10"
          style={{ animation: 'scrollBounce 2s ease-in-out infinite' }}
        >
          &darr; CLEARED TO DESCEND
        </div>
      )}
    </section>
  )
}
