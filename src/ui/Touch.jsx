import { useEffect, useRef, useState } from 'react'
import { input } from '../lib/input.js'
import { act } from '../state/actions.js'
import { useGame } from '../state/store.js'

const RADIUS = 52

export function Touch() {
  const [coarse, setCoarse] = useState(false)
  const pad = useRef(null)
  const knob = useRef(null)
  const id = useRef(null)
  const phase = useGame((s) => s.phase)
  const dialogue = useGame((s) => s.dialogue)

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const on = () => setCoarse(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => () => { input.tx = 0; input.ty = 0 }, [])

  // while someone is talking, the dialogue box itself is the tap target
  if (!coarse || phase === 'title' || dialogue) return null

  const setKnob = (dx, dy) => {
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`
  }

  const move = (e) => {
    const el = pad.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let dx = e.clientX - (r.left + r.width / 2)
    let dy = e.clientY - (r.top + r.height / 2)
    const m = Math.hypot(dx, dy)
    if (m > RADIUS) {
      dx = (dx / m) * RADIUS
      dy = (dy / m) * RADIUS
    }
    input.tx = dx / RADIUS
    input.ty = -dy / RADIUS
    input.dash = m > RADIUS * 0.86 ? 1 : 0
    setKnob(dx, dy)
  }

  const release = () => {
    id.current = null
    input.tx = 0
    input.ty = 0
    input.dash = 0
    setKnob(0, 0)
  }

  return (
    <div className="touch">
      <div
        className="dpad"
        ref={pad}
        onPointerDown={(e) => {
          id.current = e.pointerId
          e.currentTarget.setPointerCapture(e.pointerId)
          move(e)
        }}
        onPointerMove={(e) => { if (id.current === e.pointerId) move(e) }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <div className="knob" ref={knob} />
      </div>

      <button className="tbtn" onClick={act}>E</button>
      <button
        className="tbtn dash"
        onPointerDown={() => { input.dash = 1 }}
        onPointerUp={() => { input.dash = 0 }}
        onPointerLeave={() => { input.dash = 0 }}
      >
        DASH
      </button>
    </div>
  )
}
