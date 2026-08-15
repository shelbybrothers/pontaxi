// The realm: everyone walking the same city at the same time.
//
// A plain WebSocket relay. It holds one record per connected player, accepts
// movement from them, and broadcasts the whole roster ten times a second. It
// attaches to an existing http.Server, so the site and the realm share a port
// and a deploy.
import { WebSocketServer } from 'ws'
import { CROWD } from '../src/data/content.js'

export const REALM_PATH = '/ws'

const TICK_MS = 100 // 10 broadcasts a second
const BOUND = 89 // must match BOUND in src/data/city.js
const MAX_PLAYERS = 64
const MAX_RATE = 40 // client messages per second before we stop listening
const DEAD_MS = 30000 // no pong for this long and you are gone

const NAMES = ['Cab', 'Fare', 'Meter', 'Hack', 'Shift', 'Ride', 'Yellow', 'Night']

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)
const num = (v, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/** Everyone gets the same look for a given id, on every client. */
function lookFor(n) {
  const pick = (arr, salt) => arr[(n * 7 + salt * 13) % arr.length]
  return {
    skin: pick(CROWD.skin, 1),
    hair: pick(CROWD.hair, 2),
    shirt: pick(CROWD.shirt, 3),
    pants: pick(CROWD.pants, 4),
  }
}

export function attachRealm(server, { path = REALM_PATH, log = console.log } = {}) {
  const wss = new WebSocketServer({ server, path, maxPayload: 2048 })
  const players = new Map()
  let nextId = 1

  const send = (ws, obj) => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
  }
  const broadcast = (obj, exceptId) => {
    const raw = JSON.stringify(obj)
    for (const p of players.values()) {
      if (p.id === exceptId) continue
      if (p.ws.readyState === p.ws.OPEN) p.ws.send(raw)
    }
  }
  /** What other clients are allowed to know about someone. */
  const publicOf = (p) => ({ id: p.id, name: p.name, look: p.look })

  wss.on('connection', (ws) => {
    if (players.size >= MAX_PLAYERS) {
      send(ws, { t: 'full' })
      ws.close(1013, 'realm full')
      return
    }

    const id = nextId++
    const player = {
      id,
      ws,
      name: `${NAMES[id % NAMES.length]} ${id}`,
      look: lookFor(id),
      x: 0,
      z: 21,
      yaw: Math.PI,
      mv: 0,
      alive: true,
      rate: 0,
      rateAt: Date.now(),
    }
    players.set(id, player)

    send(ws, {
      t: 'welcome',
      you: publicOf(player),
      spawn: { x: player.x, z: player.z },
      peers: [...players.values()].filter((p) => p.id !== id).map(publicOf),
    })
    broadcast({ t: 'join', p: publicOf(player) }, id)
    log(`[realm] ${player.name} joined (${players.size} in the city)`)

    ws.on('pong', () => { player.alive = true })

    ws.on('message', (raw) => {
      // a client that will not stop talking gets ignored, not disconnected —
      // a burst on a bad connection should not kick someone out of the city
      const now = Date.now()
      if (now - player.rateAt > 1000) { player.rate = 0; player.rateAt = now }
      if (++player.rate > MAX_RATE) return

      let msg
      try { msg = JSON.parse(raw) } catch { return }
      if (!msg || msg.t !== 'm') return

      // position is clamped to the map, so nobody can walk into the void or
      // claim to be somewhere the city does not go
      player.x = clamp(num(msg.x, player.x), -BOUND, BOUND)
      player.z = clamp(num(msg.z, player.z), -BOUND, BOUND)
      player.yaw = clamp(num(msg.yaw, player.yaw), -Math.PI * 2, Math.PI * 2)
      player.mv = clamp(num(msg.mv, 0), 0, 1)
    })

    const drop = () => {
      if (!players.delete(id)) return
      broadcast({ t: 'leave', id })
      log(`[realm] ${player.name} left (${players.size} in the city)`)
    }
    ws.on('close', drop)
    ws.on('error', drop)
  })

  const tick = setInterval(() => {
    if (players.size === 0) return
    broadcast({
      t: 'state',
      n: players.size,
      p: [...players.values()].map((p) => [
        p.id,
        Math.round(p.x * 100) / 100,
        Math.round(p.z * 100) / 100,
        Math.round(p.yaw * 1000) / 1000,
        Math.round(p.mv * 100) / 100,
      ]),
    })
  }, TICK_MS)

  const heartbeat = setInterval(() => {
    for (const p of players.values()) {
      if (!p.alive) { p.ws.terminate(); continue }
      p.alive = false
      try { p.ws.ping() } catch { /* closing anyway */ }
    }
  }, DEAD_MS / 2)

  const close = () => {
    clearInterval(tick)
    clearInterval(heartbeat)
    wss.close()
  }
  server.on('close', close)

  return { wss, players, close }
}
