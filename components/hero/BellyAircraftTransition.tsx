/**
 * BellyAircraftTransition — Realistic belly-up 747 silhouette with SAA livery
 * accents and helical wake vortices from wingtips. Server component (no 'use client').
 */

// Generate a helical wake vortex path from a wingtip origin
function helicalVortexPath(
  startX: number,
  startY: number,
  length: number,
  amplitude: number,
  wavelength: number,
  drift: number, // horizontal drift direction (+1 right, -1 left)
  phase: number = 0,
): string {
  const steps = 80
  const points: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = startY + t * length
    const x =
      startX +
      drift * t * 40 +
      amplitude * (1 - t * 0.3) * Math.sin((t * length / wavelength) * Math.PI * 2 + phase)
    points.push(i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return points.join(' ')
}

// Pre-compute vortex paths (server-safe, deterministic)
const LEFT_TIP_X = 118
const RIGHT_TIP_X = 1322
const VORTEX_START_Y = 8

const vortices = [
  // Left wingtip — main vortex
  { path: helicalVortexPath(LEFT_TIP_X, VORTEX_START_Y, 700, 18, 90, -1, 0), opacity: 0.12, width: 2.5 },
  { path: helicalVortexPath(LEFT_TIP_X, VORTEX_START_Y, 700, 14, 90, -1, 0.3), opacity: 0.07, width: 5 },
  { path: helicalVortexPath(LEFT_TIP_X, VORTEX_START_Y, 700, 22, 90, -1, -0.2), opacity: 0.04, width: 9 },
  // Right wingtip — main vortex
  { path: helicalVortexPath(RIGHT_TIP_X, VORTEX_START_Y, 700, 18, 90, 1, 0), opacity: 0.12, width: 2.5 },
  { path: helicalVortexPath(RIGHT_TIP_X, VORTEX_START_Y, 700, 14, 90, 1, 0.3), opacity: 0.07, width: 5 },
  { path: helicalVortexPath(RIGHT_TIP_X, VORTEX_START_Y, 700, 22, 90, 1, -0.2), opacity: 0.04, width: 9 },
]

export default function BellyAircraftTransition() {
  return (
    <>
      {/* Aircraft belly SVG */}
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        className="w-full block"
      >
        <defs>
          {/* Soft edge filter */}
          <filter id="belly-soft">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="belly-glow">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          {/* Fuselage belly — visible light grey (SAA white belly seen from below at altitude) */}
          <linearGradient id="fuse-belly" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3a4a62" />
            <stop offset="30%" stopColor="#4a5c78" />
            <stop offset="50%" stopColor="#566a88" />
            <stop offset="70%" stopColor="#4a5c78" />
            <stop offset="100%" stopColor="#3a4a62" />
          </linearGradient>

          {/* Wing underside */}
          <linearGradient id="wing-under" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#354868" />
            <stop offset="60%" stopColor="#283a54" />
            <stop offset="100%" stopColor="#1e2e44" />
          </linearGradient>

          {/* SAA tail accent — orange to blue */}
          <linearGradient id="saa-tail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8752a" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#c4622a" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1a5c8a" stopOpacity="0.3" />
          </linearGradient>

          {/* Engine intake glow */}
          <radialGradient id="engine-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#1a2e4a" />
            <stop offset="60%" stopColor="#111c2e" />
            <stop offset="100%" stopColor="#0a1220" />
          </radialGradient>

          {/* Vortex fade */}
          <linearGradient id="vortex-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8ab4d4" stopOpacity="1" />
            <stop offset="40%" stopColor="#8ab4d4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8ab4d4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ====== LEFT WING ====== */}
        {/* Main wing planform — swept, tapered, realistic 747 shape */}
        <path
          d={`
            M668,132
            L640,140
            L340,160
            L180,172
            L118,180
            L108,184
            L118,188
            L190,192
            L360,196
            L640,184
            L670,172
            Z
          `}
          fill="url(#wing-under)"
          filter="url(#belly-soft)"
        />
        {/* Wing leading edge highlight */}
        <path
          d="M668,132 L640,140 L340,160 L180,172 L118,180"
          fill="none"
          stroke="rgba(140,180,210,0.45)"
          strokeWidth="1.2"
        />
        {/* Flap track fairings */}
        <line x1="400" y1="164" x2="408" y2="196" stroke="rgba(120,160,200,0.2)" strokeWidth="0.8" />
        <line x1="500" y1="156" x2="505" y2="190" stroke="rgba(120,160,200,0.2)" strokeWidth="0.8" />
        <line x1="580" y1="148" x2="582" y2="184" stroke="rgba(120,160,200,0.2)" strokeWidth="0.8" />
        {/* Wing spar lines */}
        <line x1="200" y1="178" x2="660" y2="148" stroke="rgba(120,160,200,0.14)" strokeWidth="0.6" />
        <line x1="300" y1="186" x2="660" y2="164" stroke="rgba(120,160,200,0.1)" strokeWidth="0.5" />

        {/* ====== RIGHT WING ====== */}
        <path
          d={`
            M772,132
            L800,140
            L1100,160
            L1260,172
            L1322,180
            L1332,184
            L1322,188
            L1250,192
            L1080,196
            L800,184
            L770,172
            Z
          `}
          fill="url(#wing-under)"
          filter="url(#belly-soft)"
        />
        <path
          d="M772,132 L800,140 L1100,160 L1260,172 L1322,180"
          fill="none"
          stroke="rgba(140,180,210,0.45)"
          strokeWidth="1.2"
        />
        <line x1="1040" y1="164" x2="1032" y2="196" stroke="rgba(120,160,200,0.2)" strokeWidth="0.8" />
        <line x1="940" y1="156" x2="935" y2="190" stroke="rgba(120,160,200,0.2)" strokeWidth="0.8" />
        <line x1="860" y1="148" x2="858" y2="184" stroke="rgba(120,160,200,0.2)" strokeWidth="0.8" />
        <line x1="1240" y1="178" x2="780" y2="148" stroke="rgba(120,160,200,0.14)" strokeWidth="0.6" />
        <line x1="1140" y1="186" x2="780" y2="164" stroke="rgba(120,160,200,0.1)" strokeWidth="0.5" />

        {/* ====== FUSELAGE ====== */}
        <path
          d={`
            M720,16
            Q742,17 754,26
            L762,60
            L770,120
            L774,160
            L772,220
            L766,260
            L756,285
            Q740,304 720,306
            Q700,304 684,285
            L674,260
            L668,220
            L666,160
            L670,120
            L678,60
            L686,26
            Q698,17 720,16
            Z
          `}
          fill="url(#fuse-belly)"
          filter="url(#belly-soft)"
        />
        {/* Fuselage outline — very subtle */}
        <path
          d={`
            M720,16
            Q742,17 754,26
            L762,60
            L770,120
            L774,160
            L772,220
            L766,260
            L756,285
            Q740,304 720,306
            Q700,304 684,285
            L674,260
            L668,220
            L666,160
            L670,120
            L678,60
            L686,26
            Q698,17 720,16
            Z
          `}
          fill="none"
          stroke="rgba(140,180,210,0.35)"
          strokeWidth="0.8"
        />
        {/* Belly panel line (centreline) */}
        <line x1="720" y1="30" x2="720" y2="290" stroke="rgba(100,150,190,0.06)" strokeWidth="0.5" />

        {/* Nose radome — slightly darker circle */}
        <ellipse cx="720" cy="24" rx="14" ry="8" fill="#1a2640" opacity="0.6" />
        <ellipse cx="720" cy="24" rx="14" ry="8" fill="none" stroke="rgba(100,150,190,0.2)" strokeWidth="0.5" />

        {/* ====== SAA TAIL LIVERY ACCENT ====== */}
        {/* Subtle orange-blue band near the tail area */}
        <path
          d={`
            M706,265
            Q720,268 734,265
            L736,280
            Q720,284 704,280
            Z
          `}
          fill="url(#saa-tail)"
        />
        {/* Tiny SAA springbok hint — just a subtle warm spot */}
        <ellipse cx="720" cy="272" rx="6" ry="4" fill="#d4702a" opacity="0.1" />

        {/* ====== ENGINE NACELLES ====== */}
        {/* Left outboard — #1 */}
        <ellipse cx="248" cy="174" rx="28" ry="9" fill="url(#engine-glow)" />
        <ellipse cx="248" cy="174" rx="28" ry="9" fill="none" stroke="rgba(100,150,190,0.2)" strokeWidth="0.7" />
        <ellipse cx="248" cy="174" rx="14" ry="5" fill="#0c1520" opacity="0.5" />
        {/* Pylon */}
        <line x1="248" y1="165" x2="260" y2="155" stroke="rgba(100,150,190,0.1)" strokeWidth="1.5" />

        {/* Left inboard — #2 */}
        <ellipse cx="440" cy="162" rx="30" ry="10" fill="url(#engine-glow)" />
        <ellipse cx="440" cy="162" rx="30" ry="10" fill="none" stroke="rgba(100,150,190,0.2)" strokeWidth="0.7" />
        <ellipse cx="440" cy="162" rx="15" ry="5.5" fill="#0c1520" opacity="0.5" />
        <line x1="440" y1="152" x2="452" y2="146" stroke="rgba(100,150,190,0.1)" strokeWidth="1.5" />

        {/* Right inboard — #3 */}
        <ellipse cx="1000" cy="162" rx="30" ry="10" fill="url(#engine-glow)" />
        <ellipse cx="1000" cy="162" rx="30" ry="10" fill="none" stroke="rgba(100,150,190,0.2)" strokeWidth="0.7" />
        <ellipse cx="1000" cy="162" rx="15" ry="5.5" fill="#0c1520" opacity="0.5" />
        <line x1="1000" y1="152" x2="988" y2="146" stroke="rgba(100,150,190,0.1)" strokeWidth="1.5" />

        {/* Right outboard — #4 */}
        <ellipse cx="1192" cy="174" rx="28" ry="9" fill="url(#engine-glow)" />
        <ellipse cx="1192" cy="174" rx="28" ry="9" fill="none" stroke="rgba(100,150,190,0.2)" strokeWidth="0.7" />
        <ellipse cx="1192" cy="174" rx="14" ry="5" fill="#0c1520" opacity="0.5" />
        <line x1="1192" y1="165" x2="1180" y2="155" stroke="rgba(100,150,190,0.1)" strokeWidth="1.5" />

        {/* ====== HORIZONTAL STABILISER ====== */}
        <path
          d="M670,272 L610,290 L580,302 L582,308 L615,298 L672,280 Z"
          fill="url(#wing-under)"
          stroke="rgba(100,150,190,0.15)"
          strokeWidth="0.6"
        />
        <path
          d="M770,272 L830,290 L860,302 L858,308 L825,298 L768,280 Z"
          fill="url(#wing-under)"
          stroke="rgba(100,150,190,0.15)"
          strokeWidth="0.6"
        />

        {/* ====== VERTICAL STABILISER (seen as thin line from below) ====== */}
        <line x1="720" y1="278" x2="720" y2="308" stroke="rgba(100,150,190,0.2)" strokeWidth="2" />
        {/* SAA tail fin accent */}
        <line x1="720" y1="286" x2="720" y2="302" stroke="#d4702a" strokeWidth="1.2" opacity="0.15" />

        {/* ====== NAVIGATION LIGHTS (very subtle) ====== */}
        {/* Left wingtip — red */}
        <circle cx="116" cy="180" r="2" fill="#ff3333" opacity="0.15" />
        <circle cx="116" cy="180" r="5" fill="#ff3333" opacity="0.04" />
        {/* Right wingtip — green */}
        <circle cx="1324" cy="180" r="2" fill="#33ff66" opacity="0.15" />
        <circle cx="1324" cy="180" r="5" fill="#33ff66" opacity="0.04" />
        {/* Belly beacon — subtle red pulse area */}
        <circle cx="720" cy="180" r="3" fill="#ff4444" opacity="0.06" />

        {/* ====== ATMOSPHERIC HAZE — far-away feel ====== */}
        <rect x="0" y="0" width="1440" height="320" fill="rgba(10,18,28,0.05)" />
      </svg>

      {/* Wake vortex SVG — helical spirals from wingtips */}
      <svg
        viewBox="0 0 1440 700"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="w-full block"
        style={{ height: '700px', marginTop: '-2px' }}
      >
        <defs>
          <linearGradient id="vortex-fade-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7aa8c8" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#7aa8c8" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#7aa8c8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#7aa8c8" stopOpacity="0" />
          </linearGradient>
          <filter id="vortex-blur-soft"><feGaussianBlur stdDeviation="6" /></filter>
          <filter id="vortex-blur-mid"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>

        {vortices.map((v, i) => (
          <path
            key={i}
            d={v.path}
            fill="none"
            stroke="url(#vortex-fade-v)"
            strokeWidth={v.width}
            opacity={v.opacity}
            filter={v.width > 6 ? 'url(#vortex-blur-soft)' : v.width > 3 ? 'url(#vortex-blur-mid)' : undefined}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </>
  )
}
