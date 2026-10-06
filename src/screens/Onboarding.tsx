import { useState } from 'react'
import { courses } from '../data/courses'
import { Logo } from '../components/Chrome'

export const GOALS = [
  { xp: 10, label: 'Tranquillo', detail: '1 lezione al giorno' },
  { xp: 20, label: 'Regolare', detail: '2 lezioni al giorno' },
  { xp: 30, label: 'Serio', detail: '3 lezioni al giorno' },
  { xp: 50, label: 'Intenso', detail: '5 lezioni al giorno' },
]

export function Onboarding({ initialGoal, onDone }: { initialGoal: number; onDone: (courseId: string, goal: number) => void }) {
  const [step, setStep] = useState<'course' | 'goal'>('course')
  const [courseId, setCourseId] = useState<string | null>(null)
  const [goal, setGoal] = useState(initialGoal)

  return (
    <main className="onboard">
      <div className="brand"><Logo /> Parlami</div>
      {step === 'course' ? (
        <>
          <h1>Che lingua vuoi imparare?</h1>
          <div className="options" role="radiogroup" aria-label="Corso">
            {courses.map((c) => (
              <button
                key={c.id}
                className="option"
                role="radio"
                aria-checked={courseId === c.id}
                onClick={() => setCourseId(c.id)}
              >
                <span><span className="flag" aria-hidden="true">{c.flag}</span> {c.title}</span>
                <span className="muted">{c.units.reduce((n, u) => n + u.lessons.length, 0)} lezioni</span>
              </button>
            ))}
          </div>
          <button className="btn block" disabled={!courseId} onClick={() => setStep('goal')}>Continua</button>
        </>
      ) : (
        <>
          <h1>Quanto tempo vuoi dedicarci ogni giorno?</h1>
          <div className="options" role="radiogroup" aria-label="Obiettivo giornaliero">
            {GOALS.map((g) => (
              <button key={g.xp} className="option" role="radio" aria-checked={goal === g.xp} onClick={() => setGoal(g.xp)}>
                <span>{g.label}</span>
                <span className="muted">{g.detail} · {g.xp} XP</span>
              </button>
            ))}
          </div>
          <button className="btn block" onClick={() => courseId && onDone(courseId, goal)}>Inizia a imparare</button>
          <button className="btn ghost" onClick={() => setStep('course')}>Indietro</button>
        </>
      )}
    </main>
  )
}
