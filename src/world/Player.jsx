import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { VoxelChar, poseRig } from './Voxel.jsx'
import { axes, input } from '../lib/input.js'
import { CITY, resolve } from '../data/city.js'
import { live, useGame } from '../state/store.js'

export const CAM_YAW = 0.62
export const FORWARD = [-Math.sin(CAM_YAW), -Math.cos(CAM_YAW)]
export const RIGHT = [Math.cos(CAM_YAW), -Math.sin(CAM_YAW)]

const WALK = 7.6
const DASH = 13.4
const RADIUS = 0.95

const LOOK = { skin: '#f2d3b3', hair: '#3a2d24', shirt: '#f4c231', pants: '#39415a' }

const shortest = (a, b) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

export function Player({ npcs }) {
  const group = useRef(null)
  const rig = useMemo(() => ({}), [])
  const walk = useRef(0)
  const scan = useRef(0)

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const st = useGame.getState()
    const step = Math.min(dt, 0.05)

    const frozen = st.phase !== 'city' || !!st.dialogue
    const [ax, ay, mag] = frozen ? [0, 0, 0] : axes()

    let speed = 0
    if (mag > 0.05) {
      const dash = input.dash ? DASH : WALK
      speed = dash * mag
      const mx = RIGHT[0] * ax + FORWARD[0] * ay
      const mz = RIGHT[1] * ax + FORWARD[1] * ay
      const len = Math.hypot(mx, mz) || 1
      const nx = live.px + (mx / len) * speed * step
      const nz = live.pz + (mz / len) * speed * step
      const [rx, rz] = resolve(nx, nz, RADIUS, CITY.colliders)
      live.px = rx
      live.pz = rz
      const want = Math.atan2(mx, mz)
      live.pyaw += shortest(live.pyaw, want) * Math.min(1, step * 16)
    }

    live.moving = speed
    walk.current += step * (speed > 0 ? 2.1 + speed * 0.55 : 0)
    g.position.set(live.px, 0, live.pz)
    g.rotation.y = live.pyaw
    poseRig(rig, walk.current, speed > 0 ? Math.min(1, speed / WALK) : 0)

    // ------------------------------------------------- what is within reach
    scan.current += step
    if (scan.current < 0.12 || st.phase !== 'city') return
    scan.current = 0

    let best = null
    let bestD = Infinity
    for (const n of npcs) {
      const d = Math.hypot(n.x - live.px, n.z - live.pz)
      if (d < 3.6 && d < bestD) {
        bestD = d
        best = { id: `npc:${n.def.id}`, title: n.def.name, sub: n.def.role, action: 'Talk', npc: n }
      }
    }
    for (const l of CITY.landmarks) {
      const d = Math.hypot(l.trigger.x - live.px, l.trigger.z - live.pz)
      if (d < 3.9 && d < bestD) {
        bestD = d
        best = { id: `door:${l.key}`, title: l.name, sub: l.tag, action: 'Enter', door: l.key }
      }
    }
    st.setPrompt(best)
  })

  return (
    <group ref={group} position={[live.px, 0, live.pz]}>
      <VoxelChar look={LOOK} rig={rig} />
      <Parcel />
    </group>
  )
}

/** The courier's parcel, carried once Bo hands it over. */
function Parcel() {
  const quest = useGame((s) => s.quest)
  if (quest !== 'carrying') return null
  return (
    <group position={[0, 1.15, 0.52]}>
      <mesh castShadow>
        <boxGeometry args={[0.72, 0.6, 0.5]} />
        <meshLambertMaterial color="#e0c39a" />
      </mesh>
      <mesh position={[0, 0.31, 0]}>
        <boxGeometry args={[0.26, 0.03, 0.52]} />
        <meshLambertMaterial color="#ee5f56" />
      </mesh>
    </group>
  )
}
