import type { Course } from '../types'
import { isUnlocked } from '../lib/store'

interface Props {
  course: Course
  completed: string[]
  order: string[]
  xpToday: number
  dailyGoal: number
  mistakes: number
  canPractice: boolean
  onStart: (lessonId: string) => void
  onPractice: () => void
}

// zig-zag offsets for the path
const OFFSETS = [0, 44, 66, 44, 0, -44, -66, -44]

export function Learn({ course, completed, order, xpToday, dailyGoal, mistakes, canPractice, onStart, onPractice }: Props) {
  const goalPct = Math.min(100, Math.round((xpToday / dailyGoal) * 100))
  const current = order.find((id) => !completed.includes(id))
  let n = 0

  return (
    <>
      <section className="goal-card" aria-label="Obiettivo di oggi">
        <div className="goal-row">
          <h3>Obiettivo di oggi</h3>
          <span className="muted" data-testid="goal">{Math.min(xpToday, dailyGoal)} / {dailyGoal} XP</span>
        </div>
        <div className="bar xpbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={goalPct} aria-label="Obiettivo giornaliero">
          <span style={{ width: `${goalPct}%` }} />
        </div>
        {goalPct >= 100 && <p className="muted">Obiettivo raggiunto. Ottimo lavoro!</p>}
      </section>

      {canPractice && (
        <section className="card practice-card">
          <div>
            <h3>Ripasso</h3>
            <p className="muted">{mistakes ? `${mistakes} errori da rivedere` : 'Rinfresca le lezioni completate'} · +1 ❤️</p>
          </div>
          <button className="btn secondary" onClick={onPractice}>Ripassa</button>
        </section>
      )}

      {!current && (
        <section className="card empty">
          <div className="big-emoji" aria-hidden="true">🏆</div>
          <h2>Corso completato!</h2>
          <p className="muted">Hai finito tutte le lezioni di {course.title.toLowerCase()}. Continua a ripassare per non perdere la serie.</p>
        </section>
      )}

      {course.units.map((unit, ui) => {
        const unitDone = unit.lessons.every((l) => completed.includes(l.id))
        return (
          <section key={unit.id} className={`unit${unitDone ? ' done' : ''}`} aria-labelledby={`${unit.id}-t`}>
            <div className="unit-head">
              <h2 id={`${unit.id}-t`}>Unità {ui + 1}: {unit.title}</h2>
              <p>{unit.description}</p>
            </div>
            <ol className="nodes" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {unit.lessons.map((lesson) => {
                const done = completed.includes(lesson.id)
                const open = isUnlocked(order, completed, lesson.id)
                const isCurrent = lesson.id === current
                const offset = OFFSETS[n++ % OFFSETS.length]
                const state = done ? 'completata' : isCurrent ? 'da fare' : 'bloccata'
                return (
                  <li key={lesson.id} className="node-wrap" style={{ transform: `translateX(${offset}px)` }}>
                    <button
                      className={`node${done ? ' done' : ''}${isCurrent ? ' current' : ''}${open ? '' : ' locked'}`}
                      disabled={!open}
                      onClick={() => onStart(lesson.id)}
                      aria-label={`${lesson.title}, ${state}`}
                    >
                      <span aria-hidden="true">{done ? '✓' : open ? '★' : '🔒'}</span>
                    </button>
                    <span className={`node-label${open ? '' : ' locked'}`} aria-hidden="true">{lesson.title}</span>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </>
  )
}
