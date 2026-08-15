import { useRef, useState } from 'react'
import { PixelText } from '../lib/pixelfont.jsx'
import { useGame } from '../state/store.js'
import { LANDMARKS, X_URL, X_HANDLE } from '../data/content.js'
import { Play, Pad, Dash, Door, Tap, XMark, Down } from './Icons.jsx'

export function Landing() {
  const phase = useGame((s) => s.phase)
  const ready = useGame((s) => s.ready)
  const enterCity = useGame((s) => s.enterCity)
  const setScrolled = useGame((s) => s.setScrolled)
  const [leaving, setLeaving] = useState(false)
  const scroller = useRef(null)

  if (phase !== 'title') return null

  const go = () => {
    if (!ready || leaving) return
    setLeaving(true)
    setTimeout(enterCity, 260)
  }

  const scrollDown = () => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.clientHeight * 0.92, behavior: 'smooth' })
  }

  return (
    <div
      className={`landing${leaving ? ' leaving' : ''}`}
      ref={scroller}
      onScroll={(e) => setScrolled(e.currentTarget.scrollTop > e.currentTarget.clientHeight * 0.3)}
    >
      <section className="hero">
        <div className="card">
          <PixelText
            className="logo"
            align="center"
            px={7}
            lineGap={3}
            lines={[
              { text: 'PONTAXI', fill: '#1d2430' },
              { text: '.FUN', fill: '#f2b632' },
            ]}
            style={{ filter: 'drop-shadow(0 3px 0 rgba(255,255,255,0.95)) drop-shadow(0 8px 16px rgba(29,36,48,0.18))' }}
          />

          <p className="lede">
            A small city with a taxi company in it. Walk the streets, talk to
            whoever is standing around, and go inside any building with a sign
            over the door.
          </p>

          <div className="cta-row">
            <button className="enter" onClick={go} disabled={!ready}>
              <Play size={19} /> Take a ride
            </button>
            <a className="xbtn" href={X_URL} target="_blank" rel="noreferrer noopener">
              <XMark /> {X_HANDLE}
            </a>
          </div>

          <div className={`status${ready ? '' : ' loading'}`}>
            {ready ? 'City ready' : 'Paving the roads…'}
          </div>

          <div className="chips">
            <span className="chip"><Pad /> WASD / Arrows</span>
            <span className="chip"><Dash /> Shift to dash</span>
            <span className="chip"><Door /> E to enter or talk</span>
            <span className="chip"><Tap /> Pad on phones</span>
          </div>
        </div>

        <button className="scroll-cue" onClick={scrollDown}>
          What is down there <Down />
        </button>
      </section>

      <section className="panel">
        <h2>Six doors you can actually open</h2>
        <div className="places">
          {LANDMARKS.map((l) => (
            <div className="place" key={l.key} style={{ '--a': l.accent }}>
              <span className="ptag">{l.tag}</span>
              <h3>{l.name}</h3>
              <p>{l.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Getting around</h2>
        <ul className="howto">
          <li><b>Walk</b> — WASD or the arrow keys. Hold Shift and you run. On a phone you get a stick and two buttons.</li>
          <li><b>Talk</b> — stand next to anyone and press E. Some of them want something from you.</li>
          <li><b>Go in</b> — every building with a sign has a door that opens. There are six of them.</li>
        </ul>
        <p className="fineprint">
          Nothing here is downloaded. The whole city — roads, buildings, the
          fountain, everyone walking around — is boxes generated in your browser
          when the page opens. That is why it starts fast on a bad connection.
        </p>
        <button className="enter small" onClick={go} disabled={!ready}>
          <Play size={16} /> Take a ride
        </button>
      </section>

      <footer className="foot">
        <span>© pontaxi.fun</span>
        <a href={X_URL} target="_blank" rel="noreferrer noopener">
          <XMark size={13} /> {X_HANDLE}
        </a>
      </footer>
    </div>
  )
}
