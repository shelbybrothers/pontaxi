import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { VoxelChar, poseRig } from './Voxel.jsx'
import { CITY, ROADS, N, PITCH, resolve } from '../data/city.js'
import { LOCALS, CROWD } from '../data/content.js'
import { mulberry32, pick, range, irange } from '../lib/rng.js'
import { live, useGame } from '../state/store.js'

const shortest = (a, b) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

/** Builds the cast once. The array is mutated in place every frame. */
export function useCrowd() {
  return useMemo(() => {
    const rnd = mulberry32(9137)
    const list = []

    for (const def of LOCALS) {
      const [sx, sz] = resolve(def.at[0], def.at[1], 1, CITY.colliders)
      list.push({
        id: def.id,
        def,
        look: def.look,
        kid: !!def.kid,
        x: sx,
        z: sz,
        home: [sx, sz],
        yaw: rnd() * Math.PI * 2,
        tx: sx,
        tz: sz,
        wait: range(rnd, 0, 3),
        speed: range(rnd, 1.5, 2.1),
        phase: rnd() * 6,
        accent: '#ee5f56',
        rig: {},
        named: true,
      })
    }

    for (let k = 0; k < CROWD.count; k++) {
      const ni = irange(rnd, 0, N)
      const nj = irange(rnd, 0, N)
      const ox = range(rnd, -4.4, 4.4)
      const oz = range(rnd, -4.4, 4.4)
      list.push({
        id: `c${k}`,
        look: {
          skin: pick(rnd, CROWD.skin),
          hair: pick(rnd, CROWD.hair),
          shirt: pick(rnd, CROWD.shirt),
          pants: pick(rnd, CROWD.pants),
          hat: rnd() < 0.16 ? pick(rnd, CROWD.shirt) : undefined,
        },
        kid: rnd() < 0.14,
        node: [ni, nj],
        ox,
        oz,
        x: ROADS[ni] + ox,
        z: ROADS[nj] + oz,
        tx: ROADS[ni] + ox,
        tz: ROADS[nj] + oz,
        yaw: rnd() * Math.PI * 2,
        wait: range(rnd, 0, 2),
        speed: range(rnd, 2.0, 3.3),
        phase: rnd() * 6,
        accent: '#7fd4e8',
        rig: {},
        named: false,
        rnd,
      })
    }

    live.npcs = list
    return list
  }, [])
}

export function NPCs({ npcs }) {
  useFrame((_, dt) => {
    const st = useGame.getState()
    if (st.phase === 'interior') return
    const step = Math.min(dt, 0.05)
    const talking = st.dialogue?.npcId

    for (const n of npcs) {
      let moving = 0

      if (n.wait > 0) {
        n.wait -= step
      } else {
        const dx = n.tx - n.x
        const dz = n.tz - n.z
        const d = Math.hypot(dx, dz)
        if (d < 0.45) {
          retarget(n)
        } else {
          const v = n.speed * step
          n.x += (dx / d) * v
          n.z += (dz / d) * v
          moving = Math.min(1, n.speed / 2.6)
          n.yaw += shortest(n.yaw, Math.atan2(dx, dz)) * Math.min(1, step * 9)
        }
      }

      // named locals turn to whoever walks up to them
      if (n.named) {
        const pd = Math.hypot(live.px - n.x, live.pz - n.z)
        if (pd < 5.5 || talking === n.id) {
          n.yaw += shortest(n.yaw, Math.atan2(live.px - n.x, live.pz - n.z)) * Math.min(1, step * 7)
          if (talking === n.id) moving = 0
        }
      }

      n.phase += step * (moving > 0 ? 2.2 + n.speed * 0.9 : 0)
      if (n.root) {
        n.root.position.set(n.x, 0, n.z)
        n.root.rotation.y = n.yaw
      }
      poseRig(n.rig, n.phase, moving)
    }
  })

  return (
    <group>
      {npcs.map((n) => (
        <group key={n.id} ref={(o) => { n.root = o }} position={[n.x, 0, n.z]}>
          <VoxelChar look={n.look} rig={n.rig} kid={n.kid} />
        </group>
      ))}
    </group>
  )
}

function retarget(n) {
  if (n.named) {
    const a = Math.random() * Math.PI * 2
    const r = 1.2 + Math.random() * 2.6
    const [x, z] = resolve(n.home[0] + Math.cos(a) * r, n.home[1] + Math.sin(a) * r, 1, CITY.colliders)
    n.tx = x
    n.tz = z
    n.wait = 1.5 + Math.random() * 4
    return
  }
  const [ni, nj] = n.node
  const opts = []
  if (ni > 0) opts.push([ni - 1, nj])
  if (ni < N) opts.push([ni + 1, nj])
  if (nj > 0) opts.push([ni, nj - 1])
  if (nj < N) opts.push([ni, nj + 1])
  const next = opts[Math.floor(Math.random() * opts.length)]
  n.node = next
  n.tx = ROADS[next[0]] + n.ox
  n.tz = ROADS[next[1]] + n.oz
  n.wait = Math.random() < 0.14 ? 0.6 + Math.random() * 2.4 : 0
}

export { PITCH }
