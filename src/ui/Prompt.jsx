import { useGame } from '../state/store.js'
import { act } from '../state/actions.js'
import { Chevron } from './Icons.jsx'

export function Prompt() {
  const prompt = useGame((s) => s.prompt)
  const phase = useGame((s) => s.phase)
  const dialogue = useGame((s) => s.dialogue)

  if (!prompt || phase !== 'city' || dialogue) return null

  return (
    <div className="prompt">
      <div className="psub">{prompt.sub}</div>
      <div className="ptitle">{prompt.title}</div>
      <button className="pill" onClick={act}>
        <span className="cap">E</span>
        {prompt.action}
        <Chevron color="rgba(255,255,255,0.9)" />
      </button>
    </div>
  )
}
