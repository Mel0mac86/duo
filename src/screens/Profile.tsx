import type { Course, SaveState } from '../types'
import { achievements, addDays, currentStreak, dayKey, freeDayAvailable, progressFor, totalXp } from '../lib/store'
import { allLessons } from '../data/courses'

const DAYS = ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa']
const MEDALS: Record<string, string> = { first: '🎒', streak3: '🔥', streak7: '📆', xp100: '⭐', xp500: '🚀', perfect5: '💎' }

export function Profile({ state, course, now }: { state: SaveState; course: Course; now: number }) {
  const today = dayKey(now)
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const max = Math.max(state.dailyGoal, ...week.map((d) => state.xpByDay[d] ?? 0))
  const done = progressFor(state, course.id).completed.length
  const total = allLessons(course).length
  const list = achievements(state, now)

  return (
    <>
      <h1>Il tuo profilo</h1>
      <section className="section" aria-label="Statistiche">
        <div className="tiles">
          <div className="tile-stat"><span className="emoji" aria-hidden="true">🔥</span><div><strong>{currentStreak(state, now)}</strong><span>Serie di giorni</span></div></div>
          <div className="tile-stat"><span className="emoji" aria-hidden="true">⭐</span><div><strong data-testid="total-xp">{totalXp(state)}</strong><span>XP totali</span></div></div>
          <div className="tile-stat"><span className="emoji" aria-hidden="true">📘</span><div><strong>{state.lessonsDone}</strong><span>Lezioni fatte</span></div></div>
          <div className="tile-stat"><span className="emoji" aria-hidden="true">{course.flag}</span><div><strong>{done}/{total}</strong><span>{course.title}</span></div></div>
        </div>
        <p className="muted" data-testid="free-day-status">
          🛡️ {freeDayAvailable(state, now)
            ? 'Giorno libero disponibile: se salti un giorno questa settimana, la serie non si interrompe.'
            : `Giorno libero già usato: torna disponibile il ${formatDay(addDays(state.freeDayUsed!, 7))}.`}
        </p>
      </section>

      <section className="section card" aria-labelledby="week-t">
        <h2 id="week-t">Ultimi 7 giorni</h2>
        <div className="chart" role="img" aria-label={week.map((d) => `${DAYS[new Date(d + 'T12:00').getDay()]} ${state.xpByDay[d] ?? 0} XP`).join(', ')}>
          {week.map((d) => {
            const xp = state.xpByDay[d] ?? 0
            return (
              <div key={d} className={`col${d === today ? ' today' : ''}`}>
                <small>{xp || ''}</small>
                <div className="colbar" style={{ height: `${(xp / max) * 100}%` }} />
                <small>{DAYS[new Date(d + 'T12:00').getDay()]}</small>
              </div>
            )
          })}
        </div>
      </section>

      <section className="section card" aria-labelledby="ach-t">
        <h2 id="ach-t">Traguardi</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {list.map((a) => (
            <li key={a.id} className={`ach${a.done ? ' done' : ''}`}>
              <span className="medal" aria-hidden="true">{MEDALS[a.id]}</span>
              <div>
                <h3>{a.title} {a.done && <span className="sr-only">(ottenuto)</span>}</h3>
                <p className="muted">{a.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function formatDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}
