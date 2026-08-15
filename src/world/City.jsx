import { useMemo } from 'react'
import * as THREE from 'three'
import { Boxes } from './Instanced.jsx'
import { CITY, BLOCK, N, PARK, blockCenter } from '../data/city.js'

const WIN_GEO = new THREE.PlaneGeometry(1.15, 1.5)
const TRUNK_GEO = new THREE.CylinderGeometry(0.2, 0.26, 1, 6)
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 20)

const GREENS = ['#8fd18a', '#7cc47f', '#a6dd9e', '#71bb7c', '#9ad894']

export function City() {
  const g = useMemo(() => {
    const slabs = []
    const kerbs = []
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const cx = blockCenter(i)
        const cz = blockCenter(j)
        const park = i === PARK[0] && j === PARK[1]
        kerbs.push({ p: [cx, 0.08, cz], s: [BLOCK + 1.1, 0.16, BLOCK + 1.1], color: '#c5cad4' })
        slabs.push({
          p: [cx, 0.15, cz],
          s: [BLOCK, 0.24, BLOCK],
          color: park ? '#cbe6c4' : '#f4f7fa',
        })
      }
    }

    const px = CITY.park.x
    const pz = CITY.park.z
    const paths = [
      { p: [px, 0.28, pz], s: [BLOCK, 0.06, 3.4], color: '#e7ebf2' },
      { p: [px, 0.28, pz], s: [3.4, 0.06, BLOCK], color: '#e7ebf2' },
    ]

    const bodies = CITY.buildings.map((b) => ({
      p: [b.x, b.h / 2, b.z],
      s: [b.w, b.h, b.d],
      yaw: b.yaw,
      color: b.color,
    }))
    const roofs = CITY.buildings.map((b) => ({
      p: [b.x, b.h + 0.14, b.z],
      s: [b.w + 0.34, 0.3, b.d + 0.34],
      yaw: b.yaw,
      color: b.landmark ? shade(b.color, -0.12) : b.roof,
    }))

    const windows = CITY.windows.map((w) => ({
      p: w.p,
      yaw: w.yaw,
      color: w.tint ? '#f3f8ff' : '#b6c1d1',
    }))

    const trunks = CITY.trees.map((t) => ({
      p: [t.p[0], 0.7 * t.s, t.p[2]],
      s: [t.s, 1.4 * t.s, t.s],
    }))
    const canopies = CITY.trees.map((t, i) => ({
      p: [t.p[0], 2.35 * t.s, t.p[2]],
      s: [2.3 * t.s, 2.15 * t.s, 2.3 * t.s],
      color: GREENS[i % GREENS.length],
      yaw: (i % 4) * 0.22,
    }))

    const seats = []
    const backs = []
    const legs = []
    for (const b of CITY.benches) {
      const [x, , z] = b.p
      seats.push({ p: [x, 0.62, z], s: [2.7, 0.18, 0.78], yaw: b.yaw })
      backs.push({ p: [x, 0.98, z], s: [2.7, 0.5, 0.16], yaw: b.yaw, off: true })
      legs.push({ p: [x, 0.31, z], s: [0.2, 0.62, 0.7], yaw: b.yaw, arm: -1 })
      legs.push({ p: [x, 0.31, z], s: [0.2, 0.62, 0.7], yaw: b.yaw, arm: 1 })
    }
    // shift the parts that sit off-centre along the bench's own axis
    for (const b of backs) {
      b.p = [b.p[0] - Math.cos(b.yaw) * 0.3, b.p[1], b.p[2] + Math.sin(b.yaw) * 0.3]
    }
    for (const l of legs) {
      l.p = [l.p[0] + Math.sin(l.yaw + Math.PI / 2) * 1.05 * l.arm, l.p[1], l.p[2] + Math.cos(l.yaw + Math.PI / 2) * 1.05 * l.arm]
    }

    const poles = CITY.lamps.map((l) => ({ p: [l.p[0], 2.5, l.p[2]], s: [0.16, 5, 0.16] }))
    const heads = CITY.lamps.map((l) => ({ p: [l.p[0], 5.06, l.p[2]], s: [0.62, 0.24, 0.62] }))

    const sigPole = CITY.signals.map((s) => ({ p: [s.p[0], 2.8, s.p[2]], s: [0.24, 5.6, 0.24], yaw: s.yaw }))
    const sigHead = CITY.signals.map((s) => ({ p: [s.p[0], 5.4, s.p[2]], s: [0.54, 1.5, 0.46], yaw: s.yaw }))
    const sigRed = CITY.signals.map((s) => ({
      p: [s.p[0] + Math.sin(s.yaw) * 0.26, 5.78, s.p[2] + Math.cos(s.yaw) * 0.26],
      s: [0.28, 0.28, 0.06],
      yaw: s.yaw,
    }))
    const sigGreen = CITY.signals.map((s) => ({
      p: [s.p[0] + Math.sin(s.yaw) * 0.26, 5.04, s.p[2] + Math.cos(s.yaw) * 0.26],
      s: [0.28, 0.28, 0.06],
      yaw: s.yaw,
    }))

    const planterBox = CITY.planters.map((p) => ({ p: [p.p[0], 0.5, p.p[2]], s: [1.5, 0.7, 1.5] }))
    const planterTop = CITY.planters.map((p, i) => ({
      p: [p.p[0], 0.92, p.p[2]],
      s: [1.3, 0.3, 1.3],
      color: GREENS[(i + 2) % GREENS.length],
    }))

    const carBody = []
    const carCabin = []
    const carWheel = []
    const carSign = []
    for (const c of CITY.parked) {
      const [x, , z] = c.p
      const col = c.taxi ? '#f4c231' : c.color
      carBody.push({ p: [x, 0.72, z], s: [1.72, 0.86, 3.7], yaw: c.yaw, color: col })
      carCabin.push({ p: [x, 1.45, z], s: [1.56, 0.72, 1.95], yaw: c.yaw, color: c.taxi ? '#ffe08a' : shade(col, 0.06) })
      if (c.taxi) carSign.push({ p: [x, 1.92, z], s: [0.5, 0.24, 0.34], yaw: c.yaw })
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const dx = Math.cos(c.yaw) * 0.86 * sx + Math.sin(c.yaw) * 1.22 * sz
          const dz = -Math.sin(c.yaw) * 0.86 * sx + Math.cos(c.yaw) * 1.22 * sz
          carWheel.push({ p: [x + dx, 0.34, z + dz], s: [0.42, 0.52, 0.56], yaw: c.yaw })
        }
      }
    }

    return {
      slabs, kerbs, paths, bodies, roofs, windows,
      trunks, canopies, seats, backs, legs,
      poles, heads, sigPole, sigHead, sigRed, sigGreen,
      planterBox, planterTop, carBody, carCabin, carWheel, carSign,
    }
  }, [])

  return (
    <group>
      {/* tarmac */}
      <mesh rotation-x={-Math.PI / 2} position-y={0} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshLambertMaterial color="#9298a3" />
      </mesh>

      <Boxes items={g.kerbs} receive />
      <Boxes items={g.slabs} receive />
      <Boxes items={g.paths} receive />
      <Boxes items={CITY.lines} color="#f2c94c" />
      <Boxes items={CITY.cross} color="#f2f5f9" />

      <Boxes items={g.bodies} cast receive />
      <Boxes items={g.roofs} cast receive />
      <Boxes items={g.windows} geometry={WIN_GEO} side={THREE.DoubleSide} />

      <Boxes items={g.trunks} geometry={TRUNK_GEO} color="#a9754f" cast />
      <Boxes items={g.canopies} cast />

      <Boxes items={g.seats} color="#e6cb98" cast />
      <Boxes items={g.backs} color="#e6cb98" cast />
      <Boxes items={g.legs} color="#c0a780" />

      <Boxes items={g.poles} color="#7f8694" cast />
      <Boxes items={g.heads} color="#f6f8fb" />

      <Boxes items={g.sigPole} color="#4d5464" cast />
      <Boxes items={g.sigHead} color="#343b49" cast />
      <Boxes items={g.sigRed} color="#ef5a52" />
      <Boxes items={g.sigGreen} color="#5ac47f" />

      <Boxes items={g.planterBox} color="#e2e6ee" cast />
      <Boxes items={g.planterTop} />

      <Boxes items={g.carBody} cast />
      <Boxes items={g.carCabin} cast />
      <Boxes items={g.carWheel} color="#2b3140" />
      <Boxes items={g.carSign} color="#ffffff" />

      <Fountain x={CITY.park.x} z={CITY.park.z} />
      <StreetClock p={CITY.clock.p} />
      <BusStop p={CITY.busstop.p} />
      <SignBoard p={CITY.board.p} yaw={CITY.board.yaw} />
      <Doors />
    </group>
  )
}

function Fountain({ x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={CYL} position={[0, 0.55, 0]} scale={[9.2, 1.1, 9.2]} castShadow receiveShadow>
        <meshLambertMaterial color="#eef1f6" />
      </mesh>
      <mesh geometry={CYL} position={[0, 1.12, 0]} scale={[8, 0.12, 8]}>
        <meshLambertMaterial color="#8ed7e8" />
      </mesh>
      <mesh geometry={CYL} position={[0, 1.9, 0]} scale={[1.5, 1.9, 1.5]} castShadow>
        <meshLambertMaterial color="#e8ebf1" />
      </mesh>
      <mesh geometry={CYL} position={[0, 2.9, 0]} scale={[3.8, 0.34, 3.8]} castShadow>
        <meshLambertMaterial color="#f2f4f8" />
      </mesh>
      <mesh geometry={CYL} position={[0, 3.1, 0]} scale={[3.2, 0.1, 3.2]}>
        <meshLambertMaterial color="#9adeee" />
      </mesh>
    </group>
  )
}

function StreetClock({ p }) {
  return (
    <group position={[p[0], 0, p[2]]}>
      <mesh position={[0, 2.6, 0]} castShadow>
        <boxGeometry args={[0.3, 5.2, 0.3]} />
        <meshLambertMaterial color="#5c6377" />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.85, 0.7, 0.85]} />
        <meshLambertMaterial color="#5c6377" />
      </mesh>
      <mesh geometry={CYL} position={[0, 5.6, 0]} rotation-x={Math.PI / 2} scale={[2.5, 0.34, 2.5]} castShadow>
        <meshLambertMaterial color="#5c6377" />
      </mesh>
      {[0.19, -0.19].map((z) => (
        <group key={z} position={[0, 5.6, z]}>
          <mesh geometry={CYL} rotation-x={Math.PI / 2} scale={[2.15, 0.06, 2.15]}>
            <meshLambertMaterial color="#fbfcfe" />
          </mesh>
          <mesh position={[0, 0.28, Math.sign(z) * 0.05]} rotation-z={0}>
            <boxGeometry args={[0.09, 0.62, 0.04]} />
            <meshLambertMaterial color="#3a4152" />
          </mesh>
          <mesh position={[0.24, 0.02, Math.sign(z) * 0.05]} rotation-z={Math.PI / 2}>
            <boxGeometry args={[0.09, 0.5, 0.04]} />
            <meshLambertMaterial color="#3a4152" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function BusStop({ p }) {
  return (
    <group position={[p[0], 0, p[2]]}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[0.16, 3.2, 0.16]} />
        <meshLambertMaterial color="#7f8694" />
      </mesh>
      <mesh position={[0, 3.3, 0]} castShadow>
        <boxGeometry args={[1.9, 1.1, 0.14]} />
        <meshLambertMaterial color="#fbfcfe" />
      </mesh>
      <mesh position={[0, 3.68, 0.09]}>
        <boxGeometry args={[1.9, 0.34, 0.04]} />
        <meshLambertMaterial color="#5cc0ac" />
      </mesh>
    </group>
  )
}

function SignBoard({ p, yaw }) {
  return (
    <group position={[p[0], 0, p[2]]} rotation-y={yaw}>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.85, 0]} castShadow>
          <boxGeometry args={[0.14, 1.7, 0.14]} />
          <meshLambertMaterial color="#8b91a0" />
        </mesh>
      ))}
      <mesh position={[0, 2.15, 0]} castShadow>
        <boxGeometry args={[2.4, 1.3, 0.16]} />
        <meshLambertMaterial color="#fbfcfe" />
      </mesh>
      <mesh position={[0, 2.6, 0.1]}>
        <boxGeometry args={[2.4, 0.4, 0.04]} />
        <meshLambertMaterial color="#ee5f56" />
      </mesh>
      <mesh position={[-0.5, 2.0, 0.1]}>
        <boxGeometry args={[1.2, 0.14, 0.04]} />
        <meshLambertMaterial color="#c3cad6" />
      </mesh>
    </group>
  )
}

/** Entrances on the six landmarks: recessed door, canopy, two steps. */
function Doors() {
  return (
    <group>
      {CITY.landmarks.map((l) => {
        const fx = Math.sin(l.yaw)
        const fz = Math.cos(l.yaw)
        const at = (o) => [l.door.x + fx * o, 0, l.door.z + fz * o]
        const dark = shade(l.accent, -0.3)
        return (
          <group key={l.key}>
            <mesh position={[l.door.x + fx * 0.09, 1.85, l.door.z + fz * 0.09]} rotation-y={l.yaw}>
              <boxGeometry args={[3.6, 3.7, 0.18]} />
              <meshLambertMaterial color={dark} />
            </mesh>
            <mesh position={[l.door.x + fx * 0.2, 1.75, l.door.z + fz * 0.2]} rotation-y={l.yaw}>
              <boxGeometry args={[3.0, 3.3, 0.14]} />
              <meshLambertMaterial color="#dceaf4" />
            </mesh>
            <mesh position={[l.door.x + fx * 0.62, 4.05, l.door.z + fz * 0.62]} rotation-y={l.yaw} castShadow>
              <boxGeometry args={[4.6, 0.36, 1.5]} />
              <meshLambertMaterial color={dark} />
            </mesh>
            <mesh position={[at(0.85)[0], 0.14, at(0.85)[2]]} rotation-y={l.yaw} receiveShadow>
              <boxGeometry args={[4.4, 0.28, 1.9]} />
              <meshLambertMaterial color="#eef1f6" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function shade(hex, amt) {
  const c = new THREE.Color(hex)
  if (amt >= 0) c.lerp(new THREE.Color('#ffffff'), amt)
  else c.lerp(new THREE.Color('#1a1f2a'), -amt)
  return `#${c.getHexString()}`
}
