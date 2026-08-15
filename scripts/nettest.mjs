// Two clients, one realm, no browser. Asserts that the things that actually
// break in multiplayer work: you see other people, you see them move, you see
// them leave, and you cannot claim to be somewhere the city does not go.
import { createServer } from 'node:http'
import { WebSocket } from 'ws'
import { attachRealm, REALM_PATH } from '../server/realm.mjs'

let failed = 0
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${!ok && detail ? ` — ${detail}` : ''}`)
  if (!ok) failed++
}

const server = createServer((_, res) => res.writeHead(404).end())
const realm = attachRealm(server, { log: () => {} })
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const url = `ws://127.0.0.1:${server.address().port}${REALM_PATH}`

const open = () =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    ws.inbox = []
    ws.on('message', (raw) => { ws.inbox.push(JSON.parse(raw)) })
    ws.on('open', () => resolve(ws))
    ws.on('error', reject)
  })

/** Wait for a message matching `pred`, or give up. */
const waitFor = (ws, pred, label, ms = 4000) =>
  new Promise((resolve) => {
    const hit = ws.inbox.find(pred)
    if (hit) return resolve(hit)
    const started = Date.now()
    const iv = setInterval(() => {
      const found = ws.inbox.find(pred)
      if (found) { clearInterval(iv); resolve(found) }
      else if (Date.now() - started > ms) {
        clearInterval(iv)
        console.log(`       timed out waiting for ${label}`)
        resolve(null)
      }
    }, 20)
  })

const send = (ws, obj) => ws.send(JSON.stringify(obj))

console.log('\npontaxi.fun — realm checks\n')

// ------------------------------------------------------------------ joining
const a = await open()
const welcomeA = await waitFor(a, (m) => m.t === 'welcome', 'A welcome')
check('first client is welcomed', !!welcomeA)
check('first client is alone', welcomeA?.peers.length === 0, `${welcomeA?.peers.length} peers`)
check('the realm hands out a name', !!welcomeA?.you?.name, JSON.stringify(welcomeA?.you))
check('the realm hands out a look', !!welcomeA?.you?.look?.shirt)

const b = await open()
const welcomeB = await waitFor(b, (m) => m.t === 'welcome', 'B welcome')
check('second client sees the first already there',
  welcomeB?.peers.length === 1 && welcomeB.peers[0].id === welcomeA.you.id)

const joinSeen = await waitFor(a, (m) => m.t === 'join' && m.p.id === welcomeB.you.id, 'A sees B join')
check('the first client is told someone joined', !!joinSeen)
check('everyone agrees on that person’s look',
  JSON.stringify(joinSeen?.p?.look) === JSON.stringify(welcomeB?.you?.look))

// ------------------------------------------------------------------- moving
send(a, { t: 'm', x: 12.5, z: -4.25, yaw: 1.2, mv: 1 })
const moved = await waitFor(
  b,
  (m) => m.t === 'state' && m.p.some(([id, x]) => id === welcomeA.you.id && Math.abs(x - 12.5) < 0.01),
  'B sees A move',
)
check('movement reaches the other client', !!moved)
const rowA = moved?.p.find(([id]) => id === welcomeA.you.id)
check('the position that arrives is the position that was sent',
  !!rowA && Math.abs(rowA[1] - 12.5) < 0.01 && Math.abs(rowA[2] - -4.25) < 0.01,
  JSON.stringify(rowA))
check('facing survives the trip', !!rowA && Math.abs(rowA[3] - 1.2) < 0.01)
check('the walk flag survives the trip', !!rowA && Math.abs(rowA[4] - 1) < 0.01)
check('the roster counts both of us', moved?.n === 2, `n=${moved?.n}`)

// --------------------------------------------------------------- misbehaving
b.inbox.length = 0
send(a, { t: 'm', x: 99999, z: -99999, yaw: 12, mv: 40 })
const clamped = await waitFor(b, (m) => m.t === 'state', 'a clamped state packet')
const rowClamped = clamped?.p.find(([id]) => id === welcomeA.you.id)
check('a client cannot walk out of the city',
  !!rowClamped && Math.abs(rowClamped[1]) <= 89 && Math.abs(rowClamped[2]) <= 89,
  JSON.stringify(rowClamped))
check('a client cannot claim an impossible walk speed',
  !!rowClamped && rowClamped[4] >= 0 && rowClamped[4] <= 1, JSON.stringify(rowClamped))

b.inbox.length = 0
send(a, 'not json at all')
send(a, JSON.stringify({ t: 'something-else' }))
send(a, JSON.stringify({ t: 'm', x: 'over there', z: null }))
const survived = await waitFor(b, (m) => m.t === 'state', 'the realm still ticking')
check('junk from a client does not take the realm down', !!survived)
const rowAfter = survived?.p.find(([id]) => id === welcomeA.you.id)
check('junk does not corrupt a position',
  !!rowAfter && Number.isFinite(rowAfter[1]) && Number.isFinite(rowAfter[2]),
  JSON.stringify(rowAfter))

// ------------------------------------------------------------------- leaving
a.inbox.length = 0
b.close()
const leave = await waitFor(a, (m) => m.t === 'leave' && m.id === welcomeB.you.id, 'A sees B leave')
check('leaving is announced', !!leave)
const alone = await waitFor(a, (m) => m.t === 'state' && m.n === 1, 'roster back to 1')
check('the roster shrinks again', !!alone)
check('the realm forgot the disconnected client', !realm.players.has(welcomeB.you.id))

a.close()
realm.close()
await new Promise((r) => server.close(r))

console.log(`\n${failed === 0 ? 'all realm checks passed' : `${failed} check(s) failed`}\n`)
process.exit(failed === 0 ? 0 : 1)
