import { useGame } from './store.js'
import { ACCENT } from '../data/content.js'

/** The single "E" verb: talk, enter, advance, or leave — whatever is in front of you. */
export function act() {
  const st = useGame.getState()

  if (st.phase === 'title') return
  if (st.dialogue) { st.advance(); return }
  if (st.phase === 'interior') { st.exitBuilding(); return }

  const p = st.prompt
  if (!p) return

  if (p.door) { st.enterBuilding(p.door); return }

  if (p.npc) {
    const def = p.npc.def
    const finished = def.quest && st.quest !== 'none'
    st.openDialogue({
      name: def.name,
      role: def.role,
      accent: def.quest ? ACCENT.coral : ACCENT.teal,
      lines: finished ? def.done || def.lines : def.lines,
      npcId: def.id,
      questPickup: !!def.quest && st.quest === 'none',
    })
  }
}

export function back() {
  const st = useGame.getState()
  if (st.dialogue) { st.closeDialogue(); if (st.phase === 'interior') st.exitBuilding(); return }
  if (st.phase === 'interior') st.exitBuilding()
}
