import { useEffect } from 'react'
import { PixelText } from '../lib/pixelfont.jsx'
import { useGame } from '../state/store.js'
import { act, back } from '../state/actions.js'
import { Minimap } from './Minimap.jsx'
import { Prompt } from './Prompt.jsx'
import { Dialogue } from './Dialogue.jsx'
import { Touch } from './Touch.jsx'
import { Parcel } from './Icons.jsx'

export function Hud() {
  const phase = useGame((s) => s.phase)
  const dialogue = useGame((s) => s.dialogue)
  const toast = useGame((s) => s.toast)

  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat) return
      const key = (e.key || '').toLowerCase()
      if (e.code === 'Escape' || key === 'escape') { back(); return }
      const isAct =
        e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space' ||
        key === 'e' || key === 'enter' || key === ' '
      if (!isAct) return
      if (useGame.getState().phase === 'title') return
      e.preventDefault()
      act()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (phase === 'title') return null

  return (
    <div className="hud">
      <PixelText
        className="wordmark"
        px={3}
        lines={[{ text: 'PONTAXI.FUN', fill: '#1d2430' }]}
      />

      {phase === 'city' && <Minimap />}

      {toast && (
        <div className="toast">
          <Parcel color="#f4c231" />
          {toast}
        </div>
      )}

      <Touch />

      <div className="bottombar">
        <Prompt />
        <Dialogue />
        {!dialogue && phase !== 'interior' && (
          <div className="hintbar">
            <span><b className="kbd">W</b><b className="kbd">A</b><b className="kbd">S</b><b className="kbd">D</b> move</span>
            <span className="sep">·</span>
            <span><b className="kbd">Shift</b> dash</span>
            <span className="sep">·</span>
            <span>walk up to a signed building and press <b className="kbd">E</b> to go in</span>
            <span className="sep">·</span>
            <span><b className="kbd">E</b> to talk to the locals</span>
          </div>
        )}
      </div>
    </div>
  )
}
