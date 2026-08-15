import { mulberry32, range, irange, pick } from '../lib/rng.js'
import { LANDMARKS } from './content.js'

// ---------------------------------------------------------------- dimensions
export const BLOCK = 22 // buildable block, edge to edge
export const ROAD = 12 // carriageway width
export const PITCH = BLOCK + ROAD // 34
export const N = 5 // blocks per side
export const HALF = ((N - 1) / 2) * PITCH // 68 — outermost block centre
export const EDGE = HALF + PITCH / 2 // 85 — outermost road centreline
export const BOUND = EDGE + 4 // player clamp
export const INSET = 3 // sidewalk width inside a block
export const PARK = [2, 2] // the block that is a park

export const blockCenter = (i) => (i - (N - 1) / 2) * PITCH
export const ROADS = Array.from({ length: N + 1 }, (_, k) => -EDGE + k * PITCH)

const FACE = { north: Math.PI, south: 0, east: Math.PI / 2, west: -Math.PI / 2 }
const forwardOf = (yaw) => [Math.sin(yaw), Math.cos(yaw)]

const OFFICE_COLORS = ['#f8f9fb', '#eef1f6', '#e8ecf3', '#f4f2ec', '#ffffff', '#e6eaf1', '#f6f4f7']
const ROOF_COLORS = ['#dfe4ec', '#d7dde7', '#e7e3d8', '#e2e6ee']

// ------------------------------------------------------------------ windows
const WIN_W = 1.15
const WIN_H = 1.5
const STEP_X = 2.45
const STEP_Y = 2.95
const SILL = 2.4

function addWindows(out, b) {
  const { x, z, h, yaw, wx, wz, doorFront } = b
  const rows = Math.max(1, Math.floor((h - SILL - 1.4) / STEP_Y) + 1)
  const faces = [
    { yaw: 0, span: wx, nx: 0, nz: 1 },
    { yaw: Math.PI, span: wx, nx: 0, nz: -1 },
    { yaw: Math.PI / 2, span: wz, nx: 1, nz: 0 },
    { yaw: -Math.PI / 2, span: wz, nx: -1, nz: 0 },
  ]
  const front = forwardOf(yaw)
  for (const f of faces) {
    const cols = Math.max(1, Math.floor((f.span * 2 - 1.6) / STEP_X))
    const w0 = -((cols - 1) * STEP_X) / 2
    const depth = f.nz !== 0 ? wz : wx
    const isFront = Math.abs(f.nx - front[0]) < 0.01 && Math.abs(f.nz - front[1]) < 0.01
    for (let r = 0; r < rows; r++) {
      const wy = SILL + r * STEP_Y
      if (wy + WIN_H / 2 > h - 0.7) continue
      for (let c = 0; c < cols; c++) {
        const off = w0 + c * STEP_X
        // leave the doorway clear
        if (isFront && doorFront && wy < 5.2 && Math.abs(off) < 3.1) continue
        const px = f.nz !== 0 ? x + off : x + f.nx * (depth + 0.06)
        const pz = f.nz !== 0 ? z + f.nz * (depth + 0.06) : z + off
        out.push({ p: [px, wy, pz], yaw: f.yaw, tint: b.landmark ? 1 : 0 })
      }
    }
  }
}

// ----------------------------------------------------------------- landmarks
function placeLandmark(lm) {
  const [i, j] = lm.block
  const cx = blockCenter(i)
  const cz = blockCenter(j)
  const yaw = FACE[lm.side]
  const [fx, fz] = forwardOf(yaw)
  const stand = BLOCK / 2 - 2 // front facade sits 2 inside the block edge
  // clamp so a landmark can never grow past its own block and onto the road,
  // whatever size the copy asks for
  const span = BLOCK - 4
  const w = Math.min(lm.size[0], span)
  const h = lm.size[1]
  const d = Math.min(lm.size[2], span)
  const x = cx + fx * (stand - d / 2)
  const z = cz + fz * (stand - d / 2)
  const axis = Math.abs(fx) > 0.5 // true when the facade faces east/west
  const wx = axis ? d / 2 : w / 2
  const wz = axis ? w / 2 : d / 2
  const door = [x + fx * (d / 2), z + fz * (d / 2)]
  return {
    id: lm.key,
    landmark: true,
    key: lm.key,
    name: lm.name,
    tag: lm.tag,
    accent: lm.accent,
    x,
    z,
    w,
    d,
    h,
    yaw,
    wx,
    wz,
    color: lm.accent,
    roof: lm.accent,
    doorFront: true,
    door: { x: door[0], z: door[1], yaw },
    trigger: { x: door[0] + fx * 3.1, z: door[1] + fz * 3.1 },
    block: [i, j],
  }
}

// -------------------------------------------------------------------- blocks
const LAYOUTS = [
  [1, 1],
  [2, 1],
  [1, 2],
  [2, 2],
  [2, 2],
]

function fillBlock(rnd, i, j, out) {
  const cx = blockCenter(i)
  const cz = blockCenter(j)
  const usable = BLOCK - INSET * 2 // 16
  const [nx, nz] = pick(rnd, LAYOUTS)
  const cellX = usable / nx
  const cellZ = usable / nz

  for (let a = 0; a < nx; a++) {
    for (let b = 0; b < nz; b++) {
      if (nx * nz === 4 && rnd() < 0.18) continue
      const gap = nx > 1 || nz > 1 ? 1.1 : 0
      const w = cellX - gap - range(rnd, 0, 1.4)
      const d = cellZ - gap - range(rnd, 0, 1.4)
      if (w < 4 || d < 4) continue
      const bx = cx - usable / 2 + cellX * (a + 0.5)
      const bz = cz - usable / 2 + cellZ * (b + 0.5)
      const tall = rnd()
      const h = tall > 0.9 ? range(rnd, 24, 34) : tall > 0.68 ? range(rnd, 15, 23) : range(rnd, 7, 14)
      out.push({
        id: `b${i}_${j}_${a}_${b}`,
        x: bx,
        z: bz,
        w,
        d,
        h,
        yaw: 0,
        wx: w / 2,
        wz: d / 2,
        color: pick(rnd, OFFICE_COLORS),
        roof: pick(rnd, ROOF_COLORS),
        block: [i, j],
      })
    }
  }
}

/** Small out-buildings sharing a landmark block, kept clear of the landmark. */
function fillAround(rnd, lm, out) {
  const [i, j] = lm.block
  const cx = blockCenter(i)
  const cz = blockCenter(j)
  const back = -Math.sin(lm.yaw)
  const backZ = -Math.cos(lm.yaw)
  const side = [backZ, -back] // perpendicular
  const count = irange(rnd, 1, 2)
  for (let k = 0; k < count; k++) {
    const s = k === 0 ? 1 : -1
    const w = range(rnd, 5, 7)
    const d = range(rnd, 5, 7)
    const bx = cx + back * (BLOCK / 2 - INSET - 2.5) + side[0] * s * range(rnd, 3.5, 5)
    const bz = cz + backZ * (BLOCK / 2 - INSET - 2.5) + side[1] * s * range(rnd, 3.5, 5)
    if (Math.abs(bx - cx) > BLOCK / 2 - 3.5 || Math.abs(bz - cz) > BLOCK / 2 - 3.5) continue
    // do not overlap the landmark box
    if (Math.abs(bx - lm.x) < lm.wx + w / 2 + 0.6 && Math.abs(bz - lm.z) < lm.wz + d / 2 + 0.6) continue
    out.push({
      id: `f${lm.key}${k}`,
      x: bx,
      z: bz,
      w,
      d,
      h: range(rnd, 6, 11),
      yaw: 0,
      wx: w / 2,
      wz: d / 2,
      color: pick(rnd, OFFICE_COLORS),
      roof: pick(rnd, ROOF_COLORS),
      block: [i, j],
    })
  }
}

// ---------------------------------------------------------------------- city
export function buildCity() {
  const rnd = mulberry32(20260813)
  const buildings = []
  const landmarks = LANDMARKS.map(placeLandmark)
  const lmBlock = new Map(landmarks.map((l) => [`${l.block[0]},${l.block[1]}`, l]))

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === PARK[0] && j === PARK[1]) continue
      const lm = lmBlock.get(`${i},${j}`)
      if (lm) continue
      fillBlock(rnd, i, j, buildings)
    }
  }
  for (const lm of landmarks) {
    buildings.push(lm)
    fillAround(rnd, lm, buildings)
  }

  const windows = []
  for (const b of buildings) addWindows(windows, b)

  // ------------------------------------------------------------- road paint
  const lines = []
  const cross = []
  for (const b of ROADS) {
    for (let k = 0; k < N; k++) {
      const a0 = ROADS[k] + ROAD / 2
      const len = PITCH - ROAD
      const mid = a0 + len / 2
      lines.push({ p: [mid, 0.035, b], s: [len, 0.07, 0.34] })
      lines.push({ p: [b, 0.035, mid], s: [0.34, 0.07, len] })
    }
  }
  for (const a of ROADS) {
    for (const b of ROADS) {
      const off = ROAD / 2 + 1.9
      const bars = 7
      const spread = 9.4
      for (let s = 0; s < bars; s++) {
        const t = (s / (bars - 1) - 0.5) * spread
        cross.push({ p: [a + t, 0.035, b - off], s: [0.95, 0.07, 3.1] })
        cross.push({ p: [a + t, 0.035, b + off], s: [0.95, 0.07, 3.1] })
        cross.push({ p: [a - off, 0.035, b + t], s: [3.1, 0.07, 0.95] })
        cross.push({ p: [a + off, 0.035, b + t], s: [3.1, 0.07, 0.95] })
      }
    }
  }

  // ------------------------------------------------------------------ props
  const trees = []
  const benches = []
  const lamps = []
  const signals = []
  const parked = []
  const planters = []

  // park furniture
  const px = blockCenter(PARK[0])
  const pz = blockCenter(PARK[1])
  for (let k = 0; k < 4; k++) {
    const ang = (k / 4) * Math.PI * 2 + Math.PI / 4
    benches.push({ p: [px + Math.cos(ang) * 8.2, 0, pz + Math.sin(ang) * 8.2], yaw: -ang + Math.PI / 2 })
  }
  for (let k = 0; k < 7; k++) {
    const ang = rnd() * Math.PI * 2
    const r = range(rnd, 6.5, 9.6)
    trees.push({ p: [px + Math.cos(ang) * r, 0, pz + Math.sin(ang) * r], s: range(rnd, 0.85, 1.25) })
  }

  // sidewalk furniture around every block
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const cx = blockCenter(i)
      const cz = blockCenter(j)
      const isPark = i === PARK[0] && j === PARK[1]
      const r = BLOCK / 2 - 1.4
      const corners = [
        [cx - r, cz - r],
        [cx + r, cz - r],
        [cx - r, cz + r],
        [cx + r, cz + r],
      ]
      corners.forEach((c, ci) => {
        if (rnd() < (isPark ? 0.9 : 0.55)) trees.push({ p: [c[0], 0, c[1]], s: range(rnd, 0.8, 1.15) })
        if (rnd() < 0.3) lamps.push({ p: [c[0], 0, c[1]] })
        if (!isPark && rnd() < 0.22) planters.push({ p: [c[0], 0, c[1]] })
        if (ci === 0 && Math.abs(cx) <= PITCH && Math.abs(cz) <= PITCH) {
          signals.push({ p: [cx - BLOCK / 2 - 1.6, 0, cz - BLOCK / 2 - 1.6], yaw: -Math.PI / 4 })
        }
      })
      if (!isPark && rnd() < 0.5) {
        const side = irange(rnd, 0, 3)
        const off = BLOCK / 2 + 2.6
        const along = range(rnd, -7, 7)
        // parked cars sit parallel to the kerb they are next to
        const spots = [
          { p: [cx + along, 0, cz - off], yaw: Math.PI / 2 },
          { p: [cx + along, 0, cz + off], yaw: -Math.PI / 2 },
          { p: [cx - off, 0, cz + along], yaw: 0 },
          { p: [cx + off, 0, cz + along], yaw: Math.PI },
        ]
        parked.push({ ...spots[side], taxi: rnd() < 0.45, color: pick(rnd, ['#f0f2f6', '#c9d3e2', '#e8e0cf', '#b8cfe0']) })
      }
    }
  }

  // ------------------------------------------------------------- collisions
  const colliders = buildings.map((b) => ({ x: b.x, z: b.z, hw: b.wx, hd: b.wz }))
  colliders.push({ x: px, z: pz, hw: 4.6, hd: 4.6 }) // fountain

  return {
    buildings,
    landmarks,
    windows,
    lines,
    cross,
    trees,
    benches,
    lamps,
    signals,
    parked,
    planters,
    colliders,
    park: { x: px, z: pz },
    clock: { p: [blockCenter(2) + 8, 0, blockCenter(2) + 12.5] },
    busstop: { p: [blockCenter(1) - 4, 0, blockCenter(1) + 13] },
    board: { p: [blockCenter(1) + 6, 0, blockCenter(1) - 13.4], yaw: Math.PI },
  }
}

export const CITY = buildCity()

if (import.meta.env?.DEV) window.__city = CITY

/** Road-grid waypoints the ambient crowd walks between. */
export function roadNodes() {
  const nodes = []
  for (const a of ROADS) for (const b of ROADS) nodes.push([a, b])
  return nodes
}

/** Push a circle out of every building box. Returns the corrected position. */
export function resolve(x, z, radius, colliders) {
  let nx = x
  let nz = z
  for (const c of colliders) {
    const dx = nx - c.x
    const dz = nz - c.z
    const ox = c.hw + radius - Math.abs(dx)
    const oz = c.hd + radius - Math.abs(dz)
    if (ox > 0 && oz > 0) {
      if (ox < oz) nx += Math.sign(dx || 1) * ox
      else nz += Math.sign(dz || 1) * oz
    }
  }
  const b = BOUND
  return [Math.max(-b, Math.min(b, nx)), Math.max(-b, Math.min(b, nz))]
}

/** True when a point sits on tarmac rather than a block. */
export function onRoad(x, z) {
  const nearRoad = (v) => ROADS.some((r) => Math.abs(v - r) <= ROAD / 2)
  return nearRoad(x) || nearRoad(z)
}
