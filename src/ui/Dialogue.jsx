import { useGame } from '../state/store.js'
import { act } from '../state/actions.js'
import { Chevron } from './Icons.jsx'

export function Dialogue() {
  const d = useGame((s) => s.dialogue)
  if (!d) return null

  const last = d.index >= d.lines.length - 1
  const hint = last ? (d.exitOnEnd ? 'E — back to the street' : 'E — done') : 'E — next'

  return (
    <div className="dialogue" onClick={act}>
      <div className="nametag" style={{ background: d.accent }}>
        {d.role ? `${d.role} · ${d.name}` : d.name}
      </div>

      <div className="line">{d.lines[d.index]}</div>

      <div className="row">
        {d.cta && (
          <a
            className="pill gold"
            href={d.cta.href}
            onClick={(e) => e.stopPropagation()}
            rel="noreferrer"
          >
            {d.cta.label}
            <Chevron color="rgba(255,255,255,0.95)" />
          </a>
        )}
        <span className="adv">
          {hint} <Chevron size={10} />
        </span>
      </div>
    </div>
  )
}
