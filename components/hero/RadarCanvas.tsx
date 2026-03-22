'use client'

import { useEffect, useRef } from 'react'

const SA_CALLSIGNS = [
  'SAA103', 'SAA204', 'SAA281', 'SFR471', 'SFR302', 'AFR102', 'AFR7B',
  'FAR8Y', 'FAR12C', 'SIA204', 'BAW53', 'UAE406', 'QFA63', 'ETH703',
  'KLM592', 'LNK12', 'LNK43', 'SIA406', 'GLO441', 'PCF23',
]

const TARGET_COUNT = 20
const HISTORY_LENGTH = 8
const SWEEP_PERIOD_MS = 4000
const GLOW_DECAY_MS = 4000
const NM_PER_PX_BASE = 480 / 1920
const INITIAL_HEADINGS = [180, 360, 90, 270, 135, 315, 225, 45]

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

function createTarget(canvasW: number, canvasH: number, index: number): Target {
  const heading = randomFrom(INITIAL_HEADINGS) + randomBetween(-15, 15)
  return {
    id: index,
    callsign: SA_CALLSIGNS[index % SA_CALLSIGNS.length],
    position: { x: randomBetween(50, canvasW - 50), y: randomBetween(50, canvasH - 50) },
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

  // History dots
  target.history.forEach((pos, i) => {
    const r = Math.max(1, 4 - i * 0.5)
    const alpha = (0.6 - i * 0.07) * glowAlpha
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,255,136,${alpha})`
    ctx.fill()
  })

  // Velocity vector (2-minute projection)
  const speedPxPerSec = (target.groundspeed / 3600) / nmPerPx
  const rad = (target.heading - 90) * (Math.PI / 180)
  const vx = x + Math.cos(rad) * speedPxPerSec * 120
  const vy = y + Math.sin(rad) * speedPxPerSec * 120
  ctx.beginPath()
  ctx.setLineDash([3, 3])
  ctx.moveTo(x, y)
  ctx.lineTo(vx, vy)
  ctx.strokeStyle = 'rgba(0,255,136,0.4)'
  ctx.lineWidth = 0.8
  ctx.stroke()
  ctx.setLineDash([])

  // Target dot
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#00ff88'
  ctx.fill()

  // ATC label
  const cleared = target.clearedFL ?? target.fl
  const arrow = cleared > target.fl ? '\u2191' : cleared < target.fl ? '\u2193' : '\u2192'
  const line1 = target.callsign
  const line2 = `${target.fl}${arrow}${cleared}  ${Math.round(target.groundspeed)}`
  const lx = x + 8
  const ly = y - 18
  ctx.font = '10px "Space Mono", monospace'
  const w = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width) + 8
  ctx.fillStyle = 'rgba(0,20,10,0.75)'
  ctx.strokeStyle = '#00ff88'
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.roundRect(lx, ly - 14, w, 26, 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.fillText(line1, lx + 4, ly - 2)
  ctx.fillStyle = '#a0b4c8'
  ctx.fillText(line2, lx + 4, ly + 10)
  // Leader line
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(lx, ly + 6)
  ctx.strokeStyle = 'rgba(0,255,136,0.3)'
  ctx.lineWidth = 0.5
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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const state = stateRef.current

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
