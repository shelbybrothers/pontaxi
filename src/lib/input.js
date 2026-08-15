/** Movement input, kept outside React so it never causes a render. */
export const input = { f: 0, b: 0, l: 0, r: 0, dash: 0, tx: 0, ty: 0 }

const MAP = {
  KeyW: 'f', ArrowUp: 'f',
  KeyS: 'b', ArrowDown: 'b',
  KeyA: 'l', ArrowLeft: 'l',
  KeyD: 'r', ArrowRight: 'r',
}

// `code` is the physical key and is what we want; `key` is the fallback for
// layouts and synthetic events that do not report one.
const KEYMAP = {
  w: 'f', arrowup: 'f',
  s: 'b', arrowdown: 'b',
  a: 'l', arrowleft: 'l',
  d: 'r', arrowright: 'r',
}

const slot = (e) => MAP[e.code] || KEYMAP[(e.key || '').toLowerCase()]
const isShift = (e) => e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift'

function down(e) {
  const k = slot(e)
  if (k) { input[k] = 1; e.preventDefault() }
  if (isShift(e)) input.dash = 1
}
function up(e) {
  const k = slot(e)
  if (k) input[k] = 0
  if (isShift(e)) input.dash = 0
}
function blur() {
  input.f = input.b = input.l = input.r = input.dash = 0
  input.tx = input.ty = 0
}

export function attachInput() {
  if (import.meta.env?.DEV) window.__input = input
  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', blur)
  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', blur)
  }
}

/** Raw stick axes, -1..1, camera-relative. */
export function axes() {
  const x = Math.max(-1, Math.min(1, input.r - input.l + input.tx))
  const y = Math.max(-1, Math.min(1, input.f - input.b + input.ty))
  const m = Math.hypot(x, y)
  return m > 1 ? [x / m, y / m, 1] : [x, y, m]
}
