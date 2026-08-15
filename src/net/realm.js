// Client half of the realm.
//
// Sending runs on a timer, not on the render loop: a backgrounded tab stops
// getting animation frames, and a player who tabs away should still be where
// they left off rather than freezing at a stale position for everyone else.
import { live, useGame } from '../state/store.js'

/** id -> { id, name, look, buf: [{ t, x, z, yaw, mv }] }. Mutated in place. */
export const peers = new Map()

const SEND_MS = 100
const BUFFER_MS = 130 // render remote players this far in the past, so the
const MAX_RETRIES = 5 // 10 Hz snapshots can be interpolated instead of popped

let socket = null
let sendTimer = null
let retryTimer = null
let retries = 0
let selfId = null
let givenUp = false

function realmUrl() {
  const configured = import.meta.env?.VITE_REALM_URL
  if (configured) return configured
  if (import.meta.env?.DEV) return 'ws://localhost:8826/ws'
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}/ws`
}

function clearPeers() {
  peers.clear()
  useGame.getState().setRealm({ population: 0, connected: false })
}

export function connectRealm() {
  if (socket || givenUp) return
  let url
  try { url = realmUrl() } catch { return }

  let ws
  try { ws = new WebSocket(url) } catch { return scheduleRetry() }
  socket = ws

  ws.onopen = () => {
    retries = 0
    useGame.getState().setRealm({ connected: true })
    sendTimer = setInterval(pushSelf, SEND_MS)
  }

  ws.onmessage = (ev) => {
    let msg
    try { msg = JSON.parse(ev.data) } catch { return }
    const game = useGame.getState()

    switch (msg.t) {
      case 'welcome':
        selfId = msg.you.id
        peers.clear()
        for (const p of msg.peers) peers.set(p.id, { ...p, buf: [] })
        game.setRealm({ self: msg.you, population: msg.peers.length + 1 })
        break
      case 'join':
        if (msg.p.id !== selfId) peers.set(msg.p.id, { ...msg.p, buf: [] })
        game.bumpRoster()
        break
      case 'leave':
        peers.delete(msg.id)
        game.bumpRoster()
        break
      case 'state': {
        const now = performance.now()
        for (const [id, x, z, yaw, mv] of msg.p) {
          if (id === selfId) continue
          const peer = peers.get(id)
          if (!peer) continue // a join we have not seen yet; next tick will have it
          peer.buf.push({ t: now, x, z, yaw, mv })
          if (peer.buf.length > 12) peer.buf.shift()
        }
        if (msg.n !== game.population) game.setRealm({ population: msg.n })
        break
      }
      case 'full':
        givenUp = true
        break
      default:
        break
    }
  }

  ws.onclose = () => {
    if (sendTimer) { clearInterval(sendTimer); sendTimer = null }
    socket = null
    clearPeers()
    scheduleRetry()
  }

  // onerror always precedes onclose; letting onclose do the retry keeps one path
  ws.onerror = () => {}
}

function scheduleRetry() {
  if (givenUp || retryTimer) return
  if (++retries > MAX_RETRIES) {
    // No relay reachable — the city is perfectly playable on your own, so
    // stop knocking rather than retrying forever on a static-only host.
    givenUp = true
    return
  }
  const wait = Math.min(8000, 500 * 2 ** (retries - 1))
  retryTimer = setTimeout(() => { retryTimer = null; connectRealm() }, wait)
}

let lastSent = { x: 0, z: 0, yaw: 0, mv: 0, at: 0 }

function pushSelf() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  const { px, pz, pyaw, moving } = live
  const mv = moving > 0 ? Math.min(1, moving / 7.6) : 0
  const now = performance.now()
  const still =
    Math.abs(px - lastSent.x) < 0.02 &&
    Math.abs(pz - lastSent.z) < 0.02 &&
    Math.abs(pyaw - lastSent.yaw) < 0.02 &&
    Math.abs(mv - lastSent.mv) < 0.05
  // standing still still needs an occasional packet, or a reconnecting peer
  // never learns where you are
  if (still && now - lastSent.at < 1000) return

  lastSent = { x: px, z: pz, yaw: pyaw, mv, at: now }
  socket.send(JSON.stringify({
    t: 'm',
    x: Math.round(px * 100) / 100,
    z: Math.round(pz * 100) / 100,
    yaw: Math.round(pyaw * 1000) / 1000,
    mv: Math.round(mv * 100) / 100,
  }))
}

export function disconnectRealm() {
  if (sendTimer) { clearInterval(sendTimer); sendTimer = null }
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
  if (socket) { socket.onclose = null; socket.close(); socket = null }
  clearPeers()
}

const shortest = (a, b) => {
  let d = (b - a) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

/**
 * Where a peer should be drawn right now: the two snapshots either side of
 * (now - BUFFER_MS), blended. Returns null until there is anything to show.
 */
export function samplePeer(peer, now = performance.now()) {
  const buf = peer.buf
  if (!buf.length) return null
  const target = now - BUFFER_MS

  if (buf.length === 1 || target <= buf[0].t) {
    const s = buf[0]
    return { x: s.x, z: s.z, yaw: s.yaw, mv: s.mv }
  }
  const last = buf[buf.length - 1]
  if (target >= last.t) return { x: last.x, z: last.z, yaw: last.yaw, mv: last.mv }

  for (let i = buf.length - 1; i > 0; i--) {
    const b = buf[i]
    const a = buf[i - 1]
    if (target >= a.t && target <= b.t) {
      const span = b.t - a.t
      const k = span > 0 ? (target - a.t) / span : 1
      return {
        x: a.x + (b.x - a.x) * k,
        z: a.z + (b.z - a.z) * k,
        yaw: a.yaw + shortest(a.yaw, b.yaw) * k,
        mv: a.mv + (b.mv - a.mv) * k,
      }
    }
  }
  return { x: last.x, z: last.z, yaw: last.yaw, mv: last.mv }
}

if (import.meta.env?.DEV) window.__peers = peers
