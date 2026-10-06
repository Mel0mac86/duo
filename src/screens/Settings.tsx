import { useState } from 'react'
import type { SaveState } from '../types'
import { courses } from '../data/courses'
import { GOALS } from './Onboarding'
import { Modal } from '../components/Chrome'

export function Settings({ state, canSpeak, onChange, onReset }: {
  state: SaveState; canSpeak: boolean; onChange: (patch: Partial<SaveState>) => void; onReset: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  return (
    <>
      <h1>Impostazioni</h1>

      <section className="section" aria-labelledby="course-t">
        <h2 id="course-t">Corso</h2>
        <div className="options" role="radiogroup" aria-labelledby="course-t">
          {courses.map((c) => (
            <button key={c.id} className="option" role="radio" aria-checked={state.courseId === c.id} onClick={() => onChange({ courseId: c.id })}>
              <span><span className="flag" aria-hidden="true">{c.flag}</span> {c.title}</span>
              <span className="muted">{state.courses[c.id]?.completed.length ?? 0} lezioni fatte</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="goal-t">
        <h2 id="goal-t">Obiettivo giornaliero</h2>
        <div className="options" role="radiogroup" aria-labelledby="goal-t">
          {GOALS.map((g) => (
            <button key={g.xp} className="option" role="radio" aria-checked={state.dailyGoal === g.xp} onClick={() => onChange({ dailyGoal: g.xp })}>
              <span>{g.label}</span>
              <span className="muted">{g.xp} XP</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section card">
        <label className="row" htmlFor="hearts">
          <span>
            Cuori (modalità sfida)
            <small className="hint">{state.heartsOn
              ? 'Ogni errore costa un cuore; senza cuori ti fermi o ripassi.'
              : 'Spenti: studi quanto vuoi, gli errori non hanno limiti.'}</small>
          </span>
          <input id="hearts" type="checkbox" className="switch" checked={state.heartsOn} onChange={(e) => onChange({ heartsOn: e.target.checked })} />
        </label>
      </section>

      {canSpeak && (
        <section className="section card">
          <label className="row" htmlFor="speak">
            <span>
              Esercizi di pronuncia
              <small className="hint">Leggi una frase ad alta voce in ogni lezione.</small>
            </span>
            <input id="speak" type="checkbox" className="switch" checked={state.speakOn} onChange={(e) => onChange({ speakOn: e.target.checked })} />
          </label>
        </section>
      )}

      <section className="section card">
        <label className="row" htmlFor="sound">
          <span>Effetti sonori e voce</span>
          <input id="sound" type="checkbox" className="switch" checked={state.sound} onChange={(e) => onChange({ sound: e.target.checked })} />
        </label>
      </section>

      <section className="section">
        <button className="btn secondary" onClick={() => setConfirm(true)}>Azzera i progressi</button>
      </section>

      {confirm && (
        <Modal label="Azzerare i progressi?">
          <h2>Azzerare tutti i progressi?</h2>
          <p className="muted">Perderai XP, serie e lezioni completate in tutti i corsi. Non si può annullare.</p>
          <button className="btn danger block" onClick={onReset}>Azzera</button>
          <button className="btn ghost block" onClick={() => setConfirm(false)} autoFocus>Annulla</button>
        </Modal>
      )}
    </>
  )
}
