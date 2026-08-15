import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGame } from '../state/store.js'

const LOOPS = [
  { r: 82, dir: 1, speed: 11, count: 2 },
  { r: 88.5, dir: -1, speed: 9, count: 2 },
]

/** Position + heading on a square loop of half-width r. */
function pathAt(r, t) {
  const side = 2 * r
  const per = side * 4
  let u = ((t % per) + per) % per
  if (u < side) return [-r + u, -r, Math.PI / 2]
  u -= side
  if (u < side) return [r, -r + u, 0]
  u -= side
  if (u < side) return [r - u, r, -Math.PI / 2]
  u -= side
  return [-r, r - u, Math.PI]
}

export function Traffic() {
  const cars = useMemo(() => {
    const out = []
    LOOPS.forEach((l, li) => {
      for (let k = 0; k < l.count; k++) {
        out.push({
          r: l.r,
          dir: l.dir,
          speed: l.speed,
          t: (2 * l.r * 4 * (k + li * 0.37)) / l.count,
          ref: { current: null },
        })
      }
    })
    return out
  }, [])

  useFrame((_, dt) => {
    if (useGame.getState().phase === 'interior') return
    const step = Math.min(dt, 0.05)
    for (const c of cars) {
      c.t += c.speed * step
      const t = c.dir > 0 ? c.t : -c.t
      const [x, z, yaw] = pathAt(c.r, t)
      const o = c.ref.current
      if (!o) continue
      o.position.set(x, 0, z)
      o.rotation.y = c.dir > 0 ? yaw : yaw + Math.PI
    }
  })

  return (
    <group>
      {cars.map((c, i) => (
        <group key={i} ref={c.ref}>
          <Taxi />
        </group>
      ))}
    </group>
  )
}

export function Taxi({ scale = 1 }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.72, 0.86, 3.7]} />
        <meshLambertMaterial color="#f4c231" />
      </mesh>
      <mesh position={[0, 1.45, -0.12]} castShadow>
        <boxGeometry args={[1.56, 0.72, 1.95]} />
        <meshLambertMaterial color="#ffe08a" />
      </mesh>
      <mesh position={[0, 1.92, -0.12]}>
        <boxGeometry args={[0.5, 0.24, 0.34]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.86, 0.34, sz * 1.22]}>
            <boxGeometry args={[0.42, 0.52, 0.56]} />
            <meshLambertMaterial color="#2b3140" />
          </mesh>
        )),
      )}
    </group>
  )
}
