'use client'

import { useEffect, useRef } from 'react'

const SA_CALLSIGNS = [
  'SAA103', 'SAA204', 'SAA281', 'SFR471', 'SFR302', 'AFR102', 'AFR7B',
  'SIA204', 'BAW53', 'UAE406', 'QFA63', 'ETH703',
  'KLM592', 'LNK12', 'LNK43', 'SIA406', 'GBB401', 'GBB223', 'VIR602', 'VIR41',
]

const TARGET_COUNT = 20
const HISTORY_LENGTH = 8
const SWEEP_PERIOD_MS = 4000
const GLOW_DECAY_MS = 4000
const NM_PER_PX_BASE = 480 / 1920
const INITIAL_HEADINGS = [180, 360, 90, 270, 135, 315, 225, 45]

// Table Mountain SVG profile path points (1440-wide coordinate space)
const MOUNTAIN_PATH_RAW = [
  [0, 120], [0, 80],
  // Q120,55 240,48
  [60, 67.5], [120, 55], [180, 51.5], [240, 48],
  // Q360,42 480,40
  [300, 45], [360, 42], [420, 41], [480, 40],
  [560, 39], [640, 39], [720, 41],
  // Q800,44 880,52
  [760, 42.5], [800, 44], [840, 48], [880, 52],
  // Q960,60 1040,68
  [920, 56], [960, 60], [1000, 64], [1040, 68],
  // Q1120,74 1200,70
  [1080, 71], [1120, 74], [1160, 72], [1200, 70],
  // Q1320,64 1440,72
  [1260, 67], [1320, 64], [1380, 68], [1440, 72],
  [1440, 120],
]
const MOUNTAIN_SOURCE_W = 1440
const MOUNTAIN_SOURCE_H = 120

interface Position {
  x: number
  y: number
}

interface Target {
  id: number
  callsign: string
  position: Position
  heading: number
  groundspeed: number
  fl: number
  clearedFL: number | null
  history: Position[]
  lastGlowTime: number
}

interface State {
  targets: Target[]
  sweepAngle: number
  lastFrame: number
  nmPerPx: number
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomBetween(a: number, b: number): number {
  return a + Math.random() * (b - a)
}

function isInExclusionZone(x: number, y: number, canvasW: number, canvasH: number): boolean {
  // Keep the center area clear for the title
  const cx = canvasW / 2
  const cy = canvasH / 2
  const zoneW = canvasW * 0.4
  const zoneH = canvasH * 0.3
  return Math.abs(x - cx) < zoneW / 2 && Math.abs(y - cy) < zoneH / 2
}

function createTarget(canvasW: number, canvasH: number, index: number): Target {
  const heading = randomFrom(INITIAL_HEADINGS) + randomBetween(-15, 15)
  let x: number, y: number
  let attempts = 0
  do {
    x = randomBetween(50, canvasW - 50)
    y = randomBetween(50, canvasH - 50)
    attempts++
  } while (isInExclusionZone(x, y, canvasW, canvasH) && attempts < 20)
  return {
    id: index,
    callsign: SA_CALLSIGNS[index % SA_CALLSIGNS.length],
    position: { x, y },
    heading,
    groundspeed: randomBetween(280, 520),
    fl: Math.round(randomBetween(6, 39)) * 10,
    clearedFL: null,
    history: [],
    lastGlowTime: 0,
  }
}

function respawnTarget(target: Target, canvasW: number, canvasH: number): Target {
  const heading = randomFrom(INITIAL_HEADINGS) + randomBetween(-15, 15)
  const edge = Math.floor(Math.random() * 4)
  let x: number, y: number
  if (edge === 0) { x = randomBetween(0, canvasW); y = 0 }
  else if (edge === 1) { x = canvasW; y = randomBetween(0, canvasH) }
  else if (edge === 2) { x = randomBetween(0, canvasW); y = canvasH }
  else { x = 0; y = randomBetween(0, canvasH) }
  return {
    ...target,
    callsign: SA_CALLSIGNS[Math.floor(Math.random() * SA_CALLSIGNS.length)],
    position: { x, y },
    heading,
    groundspeed: randomBetween(280, 520),
    fl: Math.round(randomBetween(6, 39)) * 10,
    clearedFL: null,
    history: [],
  }
}

function advanceTarget(target: Target, dtSec: number, nmPerPx: number, canvasW: number, canvasH: number): Target {
  const drift = (Math.random() - 0.5) * 2 * dtSec
  const heading = (target.heading + drift + 360) % 360
  const speedPxPerSec = (target.groundspeed / 3600) / nmPerPx
  const rad = (heading - 90) * (Math.PI / 180)
  const nx = target.position.x + Math.cos(rad) * speedPxPerSec * dtSec
  const ny = target.position.y + Math.sin(rad) * speedPxPerSec * dtSec
  const history = [{ ...target.position }, ...target.history].slice(0, HISTORY_LENGTH)
  const newTarget = { ...target, heading, position: { x: nx, y: ny }, history }
  if (nx < -80 || nx > canvasW + 80 || ny < -80 || ny > canvasH + 80) {
    return respawnTarget(newTarget, canvasW, canvasH)
  }
  return newTarget
}

function drawTarget(ctx: CanvasRenderingContext2D, target: Target, now: number, nmPerPx: number) {
  const { x, y } = target.position
  const glowAge = now - target.lastGlowTime
  const glowAlpha = Math.max(0, 1 - glowAge / GLOW_DECAY_MS)

  // Overall target opacity — keep things subtle
  const baseOpacity = 0.55

  // History dots (smaller, more transparent)
  target.history.forEach((pos, i) => {
    const r = Math.max(0.5, 2.5 - i * 0.3)
    const alpha = (0.35 - i * 0.04) * glowAlpha * baseOpacity
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,255,136,${alpha})`
    ctx.fill()
  })

  // Velocity vector (2-minute projection, more transparent)
  const speedPxPerSec = (target.groundspeed / 3600) / nmPerPx
  const rad = (target.heading - 90) * (Math.PI / 180)
  const vx = x + Math.cos(rad) * speedPxPerSec * 120
  const vy = y + Math.sin(rad) * speedPxPerSec * 120
  ctx.beginPath()
  ctx.setLineDash([3, 3])
  ctx.moveTo(x, y)
  ctx.lineTo(vx, vy)
  ctx.strokeStyle = `rgba(0,255,136,${0.2 * baseOpacity})`
  ctx.lineWidth = 0.6
  ctx.stroke()
  ctx.setLineDash([])

  // Target dot (reduced from 5 to 3)
  ctx.beginPath()
  ctx.arc(x, y, 3, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(0,255,136,${0.7 * baseOpacity})`
  ctx.fill()

  // ATC label (smaller font, more transparent box)
  const cleared = target.clearedFL ?? target.fl
  const arrow = cleared > target.fl ? '\u2191' : cleared < target.fl ? '\u2193' : '\u2192'
  const line1 = target.callsign
  const line2 = `${target.fl}${arrow}${cleared}  ${Math.round(target.groundspeed)}`
  const lx = x + 6
  const ly = y - 14
  ctx.font = '8px "Space Mono", monospace'
  const w = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 6
  ctx.fillStyle = `rgba(0,20,10,${0.45 * baseOpacity})`
  ctx.strokeStyle = `rgba(0,255,136,${0.4 * baseOpacity})`
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.roundRect(lx, ly - 11, w, 21, 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = `rgba(255,255,255,${0.6 * baseOpacity})`
  ctx.fillText(line1, lx + 3, ly - 1)
  ctx.fillStyle = `rgba(160,180,200,${0.5 * baseOpacity})`
  ctx.fillText(line2, lx + 3, ly + 9)
  // Leader line
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(lx, ly + 4)
  ctx.strokeStyle = `rgba(0,255,136,${0.15 * baseOpacity})`
  ctx.lineWidth = 0.4
  ctx.stroke()
}

function getMountainPath(canvasW: number, canvasH: number): { x: number; y: number }[] {
  const scale = (canvasW * 0.7) / MOUNTAIN_SOURCE_W
  const offsetX = canvasW * 0.15 // center the 70% width
  const mountainTop = canvasH * 0.55
  const mountainBottom = canvasH * 0.70
  const heightScale = (mountainBottom - mountainTop) / MOUNTAIN_SOURCE_H

  return MOUNTAIN_PATH_RAW.map(([sx, sy]) => ({
    x: offsetX + sx * scale,
    y: mountainTop + sy * heightScale,
  }))
}

function drawMountainSilhouette(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  sweepAngleDeg: number,
  now: number,
  mountainGlowTimes: Float64Array
) {
  const points = getMountainPath(canvasW, canvasH)
  if (points.length < 2) return

  const cx = canvasW / 2
  const cy = canvasH / 2

  // Update glow times for mountain segments hit by sweep
  const segmentCount = 60
  const mountainLeft = canvasW * 0.15
  const mountainRight = canvasW * 0.85

  for (let i = 0; i < segmentCount; i++) {
    const segX = mountainLeft + (i / segmentCount) * (mountainRight - mountainLeft)
    const segY = canvasH * 0.62 // approximate vertical center of mountain
    const angle = ((Math.atan2(segY - cy, segX - cx) * 180 / Math.PI) + 90 + 360) % 360
    const diff = Math.abs(angle - sweepAngleDeg)
    if (diff < 10 || diff > 350) {
      mountainGlowTimes[i] = now
    }
  }

  // Draw mountain as a series of vertical slices with varying glow
  ctx.save()

  // Build the mountain path
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  ctx.closePath()
  ctx.clip()

  // Fill the clipped mountain shape with glow based on sweep proximity
  for (let i = 0; i < segmentCount; i++) {
    const sliceLeft = mountainLeft + (i / segmentCount) * (mountainRight - mountainLeft)
    const sliceRight = mountainLeft + ((i + 1) / segmentCount) * (mountainRight - mountainLeft)

    const glowAge = now - mountainGlowTimes[i]
    const glowFade = Math.max(0, 1 - glowAge / 3000)
    const baseAlpha = 0.02
    const glowAlpha = baseAlpha + glowFade * 0.15

    ctx.fillStyle = `rgba(0,255,136,${glowAlpha})`
    // Fill a tall rect — the clip path constrains it to the mountain shape
    ctx.fillRect(sliceLeft, canvasH * 0.4, sliceRight - sliceLeft, canvasH * 0.4)
  }

  // Draw a subtle outline that also glows
  ctx.restore()
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }

  // Outline with very dim base + sweep glow
  // Calculate average glow across all segments for the outline
  let avgGlow = 0
  for (let i = 0; i < segmentCount; i++) {
    const glowAge = now - mountainGlowTimes[i]
    avgGlow += Math.max(0, 1 - glowAge / 3000)
  }
  avgGlow /= segmentCount
  const outlineAlpha = 0.02 + avgGlow * 0.08

  ctx.strokeStyle = `rgba(0,255,136,${outlineAlpha})`
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawRadarSweep(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, sweepAngleDeg: number) {
  const cx = canvasW / 2
  const cy = canvasH / 2
  const maxR = Math.sqrt(cx * cx + cy * cy)
  const rad = (sweepAngleDeg - 90) * (Math.PI / 180)
  const startRad = rad - (30 * Math.PI / 180)
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.arc(cx, cy, maxR, startRad, rad)
  ctx.closePath()
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.6)
  grad.addColorStop(0, 'rgba(0,255,136,0)')
  grad.addColorStop(1, 'rgba(0,255,136,0.06)')
  ctx.fillStyle = grad
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(rad) * maxR, cy + Math.sin(rad) * maxR)
  ctx.strokeStyle = 'rgba(0,255,136,0.6)'
  ctx.lineWidth = 1
  ctx.stroke()
}

export default function RadarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<State>({
    targets: [],
    sweepAngle: 0,
    lastFrame: 0,
    nmPerPx: NM_PER_PX_BASE,
  })
  const mountainGlowRef = useRef<Float64Array>(new Float64Array(60))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const state = stateRef.current
    const mountainGlowTimes = mountainGlowRef.current

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      state.nmPerPx = 480 / canvas.width
    }
    resize()

    state.targets = Array.from({ length: TARGET_COUNT }, (_, i) =>
      createTarget(canvas.width, canvas.height, i)
    )
    // Give some targets a cleared FL for visual variety
    state.targets.filter((_, i) => i % 5 === 0).forEach((t) => {
      t.clearedFL = t.fl + (Math.random() > 0.5 ? 20 : -20)
    })

    window.addEventListener('resize', resize)

    let rafId: number
    function frame(now: number) {
      rafId = requestAnimationFrame(frame)
      if (!canvas || !ctx) return
      const dt = Math.min((now - state.lastFrame) / 1000, 0.1)
      state.lastFrame = now

      state.targets = state.targets.map((t) =>
        advanceTarget(t, dt, state.nmPerPx, canvas.width, canvas.height)
      )

      state.sweepAngle = ((now % SWEEP_PERIOD_MS) / SWEEP_PERIOD_MS) * 360

      // Glow targets as sweep passes
      state.targets.forEach((t) => {
        const { x, y } = t.position
        const cx = canvas.width / 2
        const cy = canvas.height / 2
        const angle = ((Math.atan2(y - cy, x - cx) * 180 / Math.PI) + 90 + 360) % 360
        const diff = Math.abs(angle - state.sweepAngle)
        if (diff < 15 || diff > 345) t.lastGlowTime = now
      })

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0a0e14'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(0,255,136,0.015)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawRadarSweep(ctx, canvas.width, canvas.height, state.sweepAngle)
      drawMountainSilhouette(ctx, canvas.width, canvas.height, state.sweepAngle, now, mountainGlowTimes)
      state.targets.forEach((t) => drawTarget(ctx, t, now, state.nmPerPx))
    }

    rafId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
