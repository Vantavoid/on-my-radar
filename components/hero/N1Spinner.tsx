'use client'

interface N1SpinnerProps {
  size?: number
  opacity?: number
  velocityRpm?: number | null
  scale?: number
}

export default function N1Spinner({
  size = 80,
  opacity = 0.6,
  velocityRpm = null,
  scale = 1,
}: N1SpinnerProps) {
  const rpm = velocityRpm !== null ? velocityRpm : 120
  const duration = 60 / Math.max(rpm, 1)
  const actualSize = size * scale

  return (
    <svg
      width={actualSize}
      height={actualSize}
      viewBox="0 0 100 100"
      style={{ opacity }}
      aria-hidden="true"
    >
      <g
        style={{
          transformOrigin: '50px 50px',
          animation: `n1Spin ${duration}s linear infinite`,
        }}
      >
        <circle cx="50" cy="50" r="48" fill="none" stroke="#4a7fa5" strokeWidth="0.8" opacity="0.5" />
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <g key={angle} style={{ transformOrigin: '50px 50px', transform: `rotate(${angle}deg)` }}>
            <path
              d="M50,38 Q54,30 56,18 Q52,14 48,14 Q44,14 40,18 Q42,30 46,38 Z"
              fill="#0d1117"
              stroke="#4a7fa5"
              strokeWidth="0.8"
            />
          </g>
        ))}
        <circle cx="50" cy="50" r="12" fill="#1a2030" stroke="#4a7fa5" strokeWidth="1" />
        <circle cx="50" cy="50" r="4" fill="#4a7fa5" opacity="0.6" />
      </g>
    </svg>
  )
}
