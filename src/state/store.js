import { create } from 'zustand'
import { QUEST } from '../data/content.js'

/** Per-frame values that must never trigger a React render. */
export const live = {
  px: 0,
  pz: 21,
  pyaw: Math.PI,
  moving: 0,
  npcs: [], // [{ x, z, accent }] — read by the minimap
  taxis: [],
}

let toastTimer = null

export const useGame = create((set, get) => ({
  phase: 'title', // title | city | interior
  ready: false,
  prompt: null, // { id, title, sub, action }
  dialogue: null, // { name, role, accent, lines, cta, index }
  interior: null, // landmark key
  quest: 'none', // none | carrying | done
  toast: null,
  scrolled: false, // past the landing hero — the city signs get out of the way

  connected: false, // realm socket is up
  population: 0, // people in the city, you included
  self: null, // { id, name, look } handed out by the realm
  roster: 0, // bumped when someone joins or leaves, to re-render the peer list

  setReady: (ready) => set({ ready }),

  setRealm: (patch) => set((s) => ({ ...patch, roster: s.roster + 1 })),
  bumpRoster: () => set((s) => ({ roster: s.roster + 1 })),

  setScrolled: (scrolled) => {
    if (get().scrolled !== scrolled) set({ scrolled })
  },

  enterCity: () => set({ phase: 'city' }),

  setPrompt: (p) => {
    if ((get().prompt?.id ?? null) === (p?.id ?? null)) return
    set({ prompt: p })
  },

  openDialogue: (d) => set({ dialogue: { index: 0, ...d } }),

  advance: () => {
    const d = get().dialogue
    if (!d) return
    if (d.index < d.lines.length - 1) {
      set({ dialogue: { ...d, index: d.index + 1 } })
      return
    }
    set({ dialogue: null })
    if (d.questPickup && get().quest === 'none') {
      set({ quest: 'carrying' })
      get().say(QUEST.pickup)
    }
    if (d.exitOnEnd) get().exitBuilding()
  },

  closeDialogue: () => set({ dialogue: null }),

  enterBuilding: (key) => {
    set({ phase: 'interior', interior: key, prompt: null })
    if (key === 'hq' && get().quest === 'carrying') {
      set({ quest: 'done' })
      get().say(QUEST.deliver)
    }
  },

  exitBuilding: () => set({ phase: 'city', interior: null, dialogue: null }),

  say: (toast) => {
    set({ toast })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), 4200)
  },
}))

if (import.meta.env?.DEV) {
  window.__live = live
  window.__game = useGame
}
