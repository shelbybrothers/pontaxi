import { useEffect, useRef } from 'react'
import { CITY, BLOCK, N, PARK, PITCH, EDGE, blockCenter, ROADS, ROAD } from '../data/city.js'
import { live } from '../state/store.js'

const SIZE = 158
const SPAN = EDGE * 2 + 14 // world units the map covers
const K = SIZE / SPAN

const toPx = (v) => SIZE / 2 + v * K

export function Minimap() {
  const canvas = useRef(null)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = SIZE * dpr
    c.height = SIZE * dpr
    const ctx = c.getContext('2d')
    ctx.scale(dpr, dpr)

    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, SIZE, SIZE)

      // ground
      ctx.fillStyle = '#242a35'
      ctx.fillRect(0, 0, SIZE, SIZE)

      // carriageways
      ctx.strokeStyle = '#333c4b'
      ctx.lineWidth = ROAD * K
      ctx.beginPath()
      for (const r of ROADS) {
        ctx.moveTo(toPx(-EDGE - 6), toPx(r))
        ctx.lineTo(toPx(EDGE + 6), toPx(r))
        ctx.moveTo(toPx(r), toPx(-EDGE - 6))
        ctx.lineTo(toPx(r), toPx(EDGE + 6))
      }
      ctx.stroke()

      // blocks
      const b = BLOCK * K
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const park = i === PARK[0] && j === PARK[1]
          ctx.fillStyle = park ? '#4e7a52' : '#59616f'
          ctx.fillRect(toPx(blockCenter(i)) - b / 2, toPx(blockCenter(j)) - b / 2, b, b)
        }
      }

      // the six doors you can walk through
      for (const l of CITY.landmarks) {
        ctx.fillStyle = l.accent
        const s = 7.5
        ctx.fillRect(toPx(l.x) - s / 2, toPx(l.z) - s / 2, s, s)
      }

      // locals
      for (const n of live.npcs) {
        ctx.fillStyle = n.named ? '#ffd66b' : '#7fd4e8'
        ctx.fillRect(toPx(n.x) - 1.2, toPx(n.z) - 1.2, 2.4, 2.4)
      }

      // you
      const px = toPx(live.px)
      const pz = toPx(live.pz)
      ctx.save()
      ctx.translate(px, pz)
      ctx.rotate(Math.PI - live.pyaw)
      ctx.fillStyle = '#ee5f56'
      ctx.beginPath()
      ctx.moveTo(0, -6.5)
      ctx.lineTo(4.6, 5)
      ctx.lineTo(0, 2.6)
      ctx.lineTo(-4.6, 5)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()

      // compass
      ctx.fillStyle = 'rgba(255,255,255,0.72)'
      ctx.font = '600 9px ui-monospace, Menlo, monospace'
      ctx.textAlign = 'center'
      ctx.fillText('N', SIZE / 2, 12)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="minimap">
      <canvas ref={canvas} style={{ width: SIZE, height: SIZE }} />
    </div>
  )
}

export { PITCH }
