// Headless checks on the generated city. These catch the failures you cannot
// see in a screenshot: a door buried inside a wall, two buildings sharing the
// same footprint, a local who spawns inside a lobby.
import {
  CITY, BLOCK, ROAD, ROADS, N, PARK, BOUND, blockCenter, resolve, onRoad,
} from '../src/data/city.js'
import { LANDMARKS, LOCALS } from '../src/data/content.js'

let failed = 0
const check = (name, ok, detail = '') => {
  if (ok) {
    console.log(`  ok   ${name}`)
  } else {
    failed++
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const inBox = (x, z, c, pad = 0) =>
  Math.abs(x - c.x) < c.hw + pad && Math.abs(z - c.z) < c.hd + pad

const hits = (x, z, pad = 0) => CITY.colliders.filter((c) => inBox(x, z, c, pad))

console.log('\npontaxi.fun — city checks\n')

// ------------------------------------------------------------------ landmarks
check('all six landmarks are placed', CITY.landmarks.length === LANDMARKS.length,
  `${CITY.landmarks.length} of ${LANDMARKS.length}`)

check('landmark keys are unique',
  new Set(CITY.landmarks.map((l) => l.key)).size === CITY.landmarks.length)

check('landmarks sit on distinct blocks',
  new Set(CITY.landmarks.map((l) => l.block.join(','))).size === CITY.landmarks.length)

check('no landmark is on the park block',
  CITY.landmarks.every((l) => !(l.block[0] === PARK[0] && l.block[1] === PARK[1])))

for (const l of CITY.landmarks) {
  const cx = blockCenter(l.block[0])
  const cz = blockCenter(l.block[1])
  check(`${l.key}: body stays inside its block`,
    Math.abs(l.x - cx) + l.wx <= BLOCK / 2 + 0.01 &&
    Math.abs(l.z - cz) + l.wz <= BLOCK / 2 + 0.01,
    `centre ${l.x.toFixed(1)},${l.z.toFixed(1)}`)
}

// The trigger is where you must be able to stand to get the "Enter" prompt.
for (const l of CITY.landmarks) {
  const blocked = hits(l.trigger.x, l.trigger.z, 0.95)
  check(`${l.key}: door trigger is standable`, blocked.length === 0,
    blocked.length ? `blocked by ${blocked.length} box(es)` : '')
  check(`${l.key}: trigger is within the player bounds`,
    Math.abs(l.trigger.x) <= BOUND && Math.abs(l.trigger.z) <= BOUND)
  const [rx, rz] = resolve(l.trigger.x, l.trigger.z, 0.95, CITY.colliders)
  check(`${l.key}: collision does not shove you off the door`,
    Math.hypot(rx - l.trigger.x, rz - l.trigger.z) < 0.01)
}

// ------------------------------------------------------------------ buildings
let overlaps = 0
for (let i = 0; i < CITY.buildings.length; i++) {
  for (let j = i + 1; j < CITY.buildings.length; j++) {
    const a = CITY.buildings[i]
    const b = CITY.buildings[j]
    if (Math.abs(a.x - b.x) < a.wx + b.wx - 0.05 && Math.abs(a.z - b.z) < a.wz + b.wz - 0.05) {
      overlaps++
      if (overlaps <= 3) console.log(`       ${a.id} overlaps ${b.id}`)
    }
  }
}
check('no two buildings overlap', overlaps === 0, `${overlaps} pair(s)`)

check('no building spills onto a carriageway',
  CITY.buildings.every((b) => {
    const clear = (v, half) => ROADS.every((r) => Math.abs(v - r) >= ROAD / 2 + half - 0.01)
    return clear(b.x, b.wx) && clear(b.z, b.wz)
  }))

check('every building has a positive footprint',
  CITY.buildings.every((b) => b.w > 0 && b.d > 0 && b.h > 2))

// -------------------------------------------------------------------- windows
check('windows were generated', CITY.windows.length > 500, `${CITY.windows.length}`)
check('window count stays drawable', CITY.windows.length < 12000, `${CITY.windows.length}`)

const sunk = CITY.windows.filter((w) => {
  const b = CITY.buildings.find(
    (bb) => Math.abs(w.p[0] - bb.x) < bb.wx - 0.1 && Math.abs(w.p[2] - bb.z) < bb.wz - 0.1,
  )
  return !!b
})
check('no window is buried inside a facade', sunk.length === 0, `${sunk.length} sunk`)

check('no window pokes above its roof',
  CITY.windows.every((w) => {
    const b = CITY.buildings.find(
      (bb) => Math.abs(w.p[0] - bb.x) <= bb.wx + 0.2 && Math.abs(w.p[2] - bb.z) <= bb.wz + 0.2,
    )
    return !b || w.p[1] + 0.75 <= b.h - 0.6
  }))

// ---------------------------------------------------------------------- spawn
const SPAWN = [0, 21]
check('player spawn is clear', hits(SPAWN[0], SPAWN[1], 0.95).length === 0)
check('player spawn is on tarmac', onRoad(SPAWN[0], SPAWN[1]))

// --------------------------------------------------------------------- locals
for (const l of LOCALS) {
  const [x, z] = resolve(l.at[0], l.at[1], 1, CITY.colliders)
  const moved = Math.hypot(x - l.at[0], z - l.at[1])
  check(`local ${l.id} spawns in the open`, moved < 0.01,
    moved >= 0.01 ? `pushed ${moved.toFixed(1)} out of a building` : '')
  check(`local ${l.id} has lines`, Array.isArray(l.lines) && l.lines.length > 0)
}
check('quest giver exists exactly once',
  LOCALS.filter((l) => l.quest).length === 1)
check('the quest giver has a follow-up line',
  LOCALS.filter((l) => l.quest).every((l) => l.done?.length))

// ------------------------------------------------------------- crowd waypoints
let badNodes = 0
for (const a of ROADS) for (const b of ROADS) if (hits(a, b, 0.6).length) badNodes++
check('every crowd waypoint is walkable', badNodes === 0, `${badNodes} blocked`)

// ---------------------------------------------------------------- landmark copy
for (const lm of LANDMARKS) {
  const i = lm.interior
  check(`${lm.key}: interior has a host, lines and a call to action`,
    !!i?.npc && i.lines?.length > 0 && !!i.cta?.label && !!i.cta?.href)
}
check('no landmark copy still mentions the original site',
  !JSON.stringify(LANDMARKS).toLowerCase().includes('amix'))

// ------------------------------------------------------------------------ done
console.log(
  `\n${failed === 0 ? 'all checks passed' : `${failed} check(s) failed`} — ` +
  `${CITY.buildings.length} buildings, ${CITY.windows.length} windows, ` +
  `${CITY.landmarks.length} doors, ${CITY.trees.length} trees\n`,
)
process.exit(failed === 0 ? 0 : 1)
