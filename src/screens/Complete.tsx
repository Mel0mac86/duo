import type { Completion } from '../lib/store'
import type { LessonResult } from '../types'

function formatTime(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export function Complete({ completion, result, streak, heartsOn, onContinue }: {
  completion: Completion; result: LessonResult; streak: number; heartsOn: boolean; onContinue: () => void
}) {
  const answers = result.total + result.mistakes
  const accuracy = Math.round((result.total / answers) * 100)
  const perfect = result.mistakes === 0
  return (
    <main className="complete">
      <div className="big-emoji" aria-hidden="true">{perfect ? '🌟' : '🎉'}</div>
      <h1>{result.practice ? 'Ripasso completato!' : perfect ? 'Lezione perfetta!' : 'Lezione completata!'}</h1>
      {completion.streakExtended && (
        <p className="chip flame" style={{ fontSize: 20 }} data-testid="streak-up">
          <span aria-hidden="true">🔥</span> Serie di {streak} {streak === 1 ? 'giorno' : 'giorni'}!
        </p>
      )}
      {completion.goalReached && <p className="muted">Hai raggiunto l'obiettivo di oggi.</p>}
      {completion.usedFreeDay && <p className="muted" data-testid="free-day">🛡️ Ieri non hai studiato, ma il giorno libero della settimana ha salvato la tua serie.</p>}
      {result.practice && heartsOn && <p className="muted">Hai recuperato un cuore ❤️</p>}
      <div className="stats">
        <div className="stat xp"><div className="label">XP</div><div className="value" data-testid="earned-xp">+{completion.xp}</div></div>
        <div className="stat acc"><div className="label">Precisione</div><div className="value">{accuracy}%</div></div>
        <div className="stat"><div className="label">Tempo</div><div className="value">{formatTime(result.ms)}</div></div>
      </div>
      <footer className="footer">
        <div className="footer-inner" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onContinue} autoFocus>Continua</button>
        </div>
      </footer>
    </main>
  )
}
