const ENGINE_POSITIONS = [102, 338, 1102, 1338]

const CONTRAIL_SOURCES = [
  { x: 102, wing: false },
  { x: 280, wing: true },
  { x: 338, wing: false },
  { x: 1102, wing: false },
  { x: 1160, wing: true },
  { x: 1338, wing: false },
]

export default function BellyAircraftTransition() {
  return (
    <>
      {/* Belly aircraft SVG */}
      <svg
        viewBox="0 0 1440 280"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        className="w-full block"
      >
        <defs>
          <filter id="belly-edge">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="wing-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2540" />
            <stop offset="100%" stopColor="#0d1420" />
          </linearGradient>
          <linearGradient id="fuse-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1a2540" />
            <stop offset="50%" stopColor="#222e48" />
            <stop offset="100%" stopColor="#1a2540" />
          </linearGradient>
        </defs>

        {/* Left wing */}
        <path d="M664,128 L18,176 L32,194 L666,158 Z" fill="url(#wing-fill)" filter="url(#belly-edge)" />
        <path d="M664,128 L18,176" stroke="rgba(74,127,165,0.55)" strokeWidth="1.4" fill="none" />
        <path d="M666,158 L32,194" stroke="rgba(74,127,165,0.28)" strokeWidth="0.8" fill="none" />

        {/* Right wing */}
        <path d="M776,128 L1422,176 L1408,194 L774,158 Z" fill="url(#wing-fill)" filter="url(#belly-edge)" />
        <path d="M776,128 L1422,176" stroke="rgba(74,127,165,0.55)" strokeWidth="1.4" fill="none" />
        <path d="M774,158 L1408,194" stroke="rgba(74,127,165,0.28)" strokeWidth="0.8" fill="none" />

        {/* Fuselage */}
        <path
          d="M720,14 Q748,15 763,28 L779,138 L782,163 L773,250 Q755,273 720,275 Q685,273 667,250 L658,163 L661,138 L677,28 Q692,15 720,14 Z"
          fill="url(#fuse-fill)"
          filter="url(#belly-edge)"
        />
        <path
          d="M720,14 Q748,15 763,28 L779,138 L782,163 L773,250 Q755,273 720,275 Q685,273 667,250 L658,163 L661,138 L677,28 Q692,15 720,14 Z"
          fill="none"
          stroke="rgba(74,127,165,0.35)"
          strokeWidth="1.2"
        />
        {/* Nose highlights */}
        <path d="M720,14 Q748,15 763,28" stroke="rgba(74,127,165,0.6)" strokeWidth="1.4" fill="none" />
        <path d="M720,14 Q692,15 677,28" stroke="rgba(74,127,165,0.6)" strokeWidth="1.4" fill="none" />

        {/* Belly window strip */}
        <rect x="704" y="55" width="32" height="160" rx="16" fill="#0d1522" opacity="0.8" />
        <rect x="707" y="58" width="26" height="154" rx="13" fill="none" stroke="rgba(74,127,165,0.2)" strokeWidth="0.6" />

        {/* Engine nacelles */}
        <ellipse cx="102" cy="184" rx="68" ry="10" fill="#111e30" />
        <ellipse cx="102" cy="184" rx="68" ry="10" stroke="rgba(74,127,165,0.40)" strokeWidth="1.2" fill="none" />
        <ellipse cx="338" cy="164" rx="60" ry="9" fill="#111e30" />
        <ellipse cx="338" cy="164" rx="60" ry="9" stroke="rgba(74,127,165,0.35)" strokeWidth="1" fill="none" />
        <ellipse cx="1102" cy="164" rx="60" ry="9" fill="#111e30" />
        <ellipse cx="1102" cy="164" rx="60" ry="9" stroke="rgba(74,127,165,0.35)" strokeWidth="1" fill="none" />
        <ellipse cx="1338" cy="184" rx="68" ry="10" fill="#111e30" />
        <ellipse cx="1338" cy="184" rx="68" ry="10" stroke="rgba(74,127,165,0.40)" strokeWidth="1.2" fill="none" />

        {/* Horizontal stabilisers */}
        <path d="M660,252 Q608,264 552,282 L555,291 Q612,274 663,261 Z" fill="url(#wing-fill)" stroke="rgba(74,127,165,0.3)" strokeWidth="0.8" />
        <path d="M780,252 Q832,264 888,282 L885,291 Q828,274 777,261 Z" fill="url(#wing-fill)" stroke="rgba(74,127,165,0.3)" strokeWidth="0.8" />

        {/* Spar lines */}
        <line x1="280" y1="177" x2="666" y2="152" stroke="rgba(74,127,165,0.22)" strokeWidth="1" />
        <line x1="1160" y1="177" x2="774" y2="152" stroke="rgba(74,127,165,0.22)" strokeWidth="1" />
        <line x1="490" y1="160" x2="664" y2="140" stroke="rgba(74,127,165,0.12)" strokeWidth="0.6" />
        <line x1="950" y1="160" x2="776" y2="140" stroke="rgba(74,127,165,0.12)" strokeWidth="0.6" />
      </svg>

      {/* Contrails */}
      <svg
        viewBox="0 0 1440 780"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="w-full block"
        style={{ height: '780px', marginTop: '-2px' }}
      >
        <defs>
          <linearGradient id="ctrail-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ddeeff" stopOpacity="1" />
            <stop offset="20%" stopColor="#c8ddf0" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#c8ddf0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#c8ddf0" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ctrail-core" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#e8f4ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c8ddf0" stopOpacity="0" />
          </linearGradient>
          <filter id="vol-soft"><feGaussianBlur stdDeviation="28" /></filter>
          <filter id="vol-mid"><feGaussianBlur stdDeviation="12" /></filter>
          <filter id="vol-hard"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        {CONTRAIL_SOURCES.map(({ x, wing }, i) => {
          const bw = wing ? 32 : 14
          const fanned = wing ? 6.5 : 4.5
          const h = wing ? 760 : 720
          const layers = [
            { filter: 'url(#vol-soft)', wm: 5.5, op: wing ? 0.38 : 0.28 },
            { filter: 'url(#vol-mid)', wm: 2.5, op: wing ? 0.55 : 0.42 },
            { filter: 'url(#vol-hard)', wm: 1, op: wing ? 0.70 : 0.58, core: true as const },
          ]
          return layers.map((l, li) => (
            <path
              key={`${i}-${li}`}
              d={`M${x - bw * l.wm},0 L${x + bw * l.wm},0 L${x + bw * fanned * l.wm},${h} L${x - bw * fanned * l.wm},${h} Z`}
              fill={'core' in l ? 'url(#ctrail-core)' : 'url(#ctrail-fade)'}
              opacity={l.op}
              filter={l.filter}
            />
          ))
        })}

        {/* Bright core streaks for engines */}
        {ENGINE_POSITIONS.map((x, i) => (
          <line
            key={`core-${i}`}
            x1={x} y1="0" x2={x} y2="480"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
            filter="url(#vol-hard)"
          />
        ))}
      </svg>
    </>
  )
}
