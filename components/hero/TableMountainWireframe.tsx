const PROFILE =
  'M0,120 L0,80 Q120,55 240,48 Q360,42 480,40 L560,39 L640,39 L720,41 Q800,44 880,52 Q960,60 1040,68 Q1120,74 1200,70 Q1320,64 1440,72 L1440,120 Z'

const ALTITUDE_LABELS: [string, number][] = [
  ['1084m', 600],
  ['800m', 480],
  ['600m', 360],
  ['400m', 240],
]

export default function TableMountainWireframe() {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className="w-full pointer-events-none"
      style={{ height: '120px' }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="mtClip">
          <path d={PROFILE} />
        </clipPath>
      </defs>
      {/* Mountain outline */}
      <path d={PROFILE} fill="none" stroke="#4a7fa5" strokeWidth="0.8" opacity="0.5" />
      {/* Grid lines clipped to profile */}
      <g clipPath="url(#mtClip)" opacity="0.35">
        {[20, 35, 50, 65, 80, 95, 110].map((y) => (
          <line key={y} x1="0" y1={y} x2="1440" y2={y} stroke="#4a7fa5" strokeWidth="0.6" />
        ))}
        {Array.from({ length: 19 }, (_, i) => (i + 1) * 80).map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="120" stroke="#4a7fa5" strokeWidth="0.4" opacity="0.5" />
        ))}
      </g>
      {/* Altitude labels */}
      {ALTITUDE_LABELS.map(([label, x]) => (
        <text key={label} x={x} y="18" fill="#4a7fa5" fontSize="7" fontFamily="monospace" opacity="0.5">
          {label}
        </text>
      ))}
    </svg>
  )
}
