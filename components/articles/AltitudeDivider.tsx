'use client'

import N1Spinner from '@/components/hero/N1Spinner'

interface AltitudeDividerProps {
  label: string
}

export default function AltitudeDivider({ label }: AltitudeDividerProps) {
  return (
    <div className="flex items-center gap-4 my-8 opacity-40">
      <div className="flex-1 h-px bg-steel-blue" />
      <N1Spinner size={32} opacity={0.5} />
      <span className="font-mono text-steel-blue text-xs tracking-widest">{label}</span>
      <N1Spinner size={32} opacity={0.5} />
      <div className="flex-1 h-px bg-steel-blue" />
    </div>
  )
}
