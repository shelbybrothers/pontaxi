import { useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { CITY } from '../data/city.js'
import { live, useGame } from '../state/store.js'

/**
 * Directory signs over the six enterable buildings. Full strength on the title
 * overview; on the street they only fade in once you are near.
 */
export function Labels() {
  const nodes = useRef({})

  useFrame(() => {
    const { phase, scrolled } = useGame.getState()
    for (const l of CITY.landmarks) {
      const el = nodes.current[l.key]
      if (!el) continue
      let o = 1
      if (phase === 'city') {
        const d = Math.hypot(l.x - live.px, l.z - live.pz)
        o = d > 42 ? 0 : d < 26 ? 1 : 1 - (d - 26) / 16
      } else if (phase === 'interior') {
        o = 0
      } else if (scrolled) {
        // reading the landing copy, not looking at the city
        o = 0
      }
      if (el.dataset.o !== String(o)) {
        el.style.opacity = o
        el.dataset.o = String(o)
      }
    }
  })

  return (
    <>
      {CITY.landmarks.map((l) => (
        <Html
          key={l.key}
          position={[l.x, l.h + 3.2, l.z]}
          center
          zIndexRange={[9, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="blabel" ref={(el) => { nodes.current[l.key] = el }}>
            <span className="tag" style={{ background: l.accent }}>ENTER</span>
            {l.name}
          </div>
        </Html>
      ))}
    </>
  )
}
