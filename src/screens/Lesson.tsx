import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BuildExercise, Course, Exercise, MatchExercise, SelectExercise, TypeExercise } from '../types'
import { checkAnswer } from '../lib/answers'
import type { Verdict } from '../lib/answers'
import { answerRun, nextRun, runDone, runProgress, shuffle, startRun } from '../lib/lesson'
import type { Run } from '../lib/lesson'
import { canSpeak, sfx, speak } from '../lib/sound'
import { Modal } from '../components/Chrome'

interface Props {
  course: Course
  exercises: Exercise[]
  practice: boolean
  hearts: number
  sound: boolean
  onWrong: (ex: Exercise) => void
  onRight: (ex: Exercise) => void
  onFinish: (run: Run) => void
  onQuit: () => void
  onOutOfHearts: () => void
}

const PRAISE = ['Ottimo!', 'Perfetto!', 'Esatto!', 'Bravissimo!', 'Ben fatto!']

export function Lesson(props: Props) {
  const { course, practice, hearts, sound, onWrong, onRight, onFinish, onQuit, onOutOfHearts } = props
  const [run, setRun] = useState(() => startRun(props.exercises))
  const [answer, setAnswer] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [quitting, setQuitting] = useState(false)
  const ex = run.queue[run.index]

  const check = useCallback((given?: string) => {
    const value = given ?? answer
    if (!ex || verdict || value === null) return
    let v: Verdict
    if (ex.type === 'select') v = value === ex.answer ? { correct: true, note: null, expected: ex.answer } : { correct: false, note: null, expected: ex.answer }
    else if (ex.type === 'match') v = { correct: true, note: null, expected: '' }
    else v = checkAnswer(value, ex.answers, { typos: ex.type === 'type' })
    setVerdict(v)
    setRun((r) => answerRun(r, v.correct))
    if (v.correct) {
      onRight(ex)
      if (sound) sfx.correct()
    } else {
      onWrong(ex)
      if (sound) sfx.wrong()
    }
  }, [answer, ex, verdict, onRight, onWrong, sound])

  const proceed = useCallback(() => {
    if (!verdict) return
    if (!verdict.correct && !practice && hearts <= 0) {
      onOutOfHearts()
      return
    }
    const next = nextRun(run)
    if (runDone(next)) {
      onFinish(next)
      return
    }
    setRun(next)
    setAnswer(null)
    setVerdict(null)
  }, [verdict, practice, hearts, run, onFinish, onOutOfHearts])

  // Enter checks, then continues
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || quitting) return
      const t = e.target as HTMLElement
      if (t.tagName === 'BUTTON') return
      e.preventDefault()
      if (verdict) proceed()
      else check()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [verdict, proceed, check, quitting])

  if (!ex) return null
  const pct = Math.round(runProgress(run) * 100)
  const praise = PRAISE[run.index % PRAISE.length]

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="icon-btn" aria-label="Esci dalla lezione" onClick={() => setQuitting(true)}>✕</button>
        <div className="bar" role="progressbar" aria-label="Avanzamento lezione" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} />
        </div>
        {practice
          ? <span className="chip xp" aria-label="Ripasso">🔁</span>
          : <span className="chip heart" data-testid="lesson-hearts"><span className="emoji" aria-hidden="true">❤️</span><span className="sr-only">Cuori:</span>{hearts}</span>}
      </div>

      <main className="lesson-body" key={run.index}>
        {ex.type === 'select' && <Select ex={ex} course={course} sound={sound} value={answer} locked={!!verdict} verdict={verdict} onChange={setAnswer} />}
        {(ex.type === 'build' || ex.type === 'listen') && <Build ex={ex} course={course} sound={sound} locked={!!verdict} onChange={setAnswer} />}
        {ex.type === 'type' && <TypeIn ex={ex} course={course} locked={!!verdict} onChange={setAnswer} />}
        {ex.type === 'match' && <Match ex={ex} course={course} sound={sound} onDone={() => check('done')} />}
      </main>

      <footer className={`footer${verdict ? (verdict.correct ? ' correct' : ' wrong') : ''}`}>
        <div className="footer-inner" role="status" aria-live="polite">
          {verdict ? (
            <>
              <div className="feedback">
                {verdict.correct ? (
                  <>
                    <h2><span aria-hidden="true">✅</span> {praise}</h2>
                    {verdict.note === 'accent' && <p className="answer">Attenzione agli accenti: {verdict.expected}</p>}
                    {verdict.note === 'typo' && <p className="answer">Attenzione all'ortografia: {verdict.expected}</p>}
                  </>
                ) : (
                  <>
                    <h2><span aria-hidden="true">❌</span> Risposta corretta:</h2>
                    <p className="answer" lang={ex.type !== 'match' && 'lang' in ex && ex.lang === 'native' ? course.nativeLang : course.targetLang}>{verdict.expected}</p>
                  </>
                )}
              </div>
              <button className={`btn ${verdict.correct ? 'success' : 'danger'}`} onClick={proceed} autoFocus>Continua</button>
            </>
          ) : ex.type === 'match' ? (
            <>
              <span className="muted">Abbina le coppie</span>
              <button className="btn" disabled>Verifica</button>
            </>
          ) : (
            <>
              <span />
              <button className="btn success" disabled={!answer} onClick={() => check()}>Verifica</button>
            </>
          )}
        </div>
      </footer>

      {quitting && (
        <Modal label="Uscire dalla lezione?">
          <div className="big-emoji" aria-hidden="true">🥺</div>
          <h2>Vuoi davvero uscire?</h2>
          <p className="muted">Perderai i progressi di questa lezione.</p>
          <button className="btn block" onClick={() => setQuitting(false)} autoFocus>Continua la lezione</button>
          <button className="btn ghost block" onClick={onQuit}>Esci</button>
        </Modal>
      )}
    </div>
  )
}

// --- exercises -------------------------------------------------------------

function Select({ ex, course, sound, value, locked, verdict, onChange }: {
  ex: SelectExercise; course: Course; sound: boolean; value: string | null; locked: boolean; verdict: Verdict | null; onChange: (v: string) => void
}) {
  useEffect(() => {
    if (locked) return
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1
      if (i >= 0 && i < ex.options.length) {
        onChange(ex.options[i].text)
        if (sound) speak(ex.options[i].text, course.targetLang)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ex, locked, onChange, sound, course.targetLang])

  return (
    <>
      <h1 className="ex-title">Quale di questi significa «{ex.prompt}»?</h1>
      <div className="choices" role="group" aria-label="Opzioni">
        {ex.options.map((o, i) => {
          const chosen = value === o.text
          const cls = verdict && chosen ? (verdict.correct ? ' correct' : ' wrong') : verdict && o.text === ex.answer ? ' correct' : ''
          return (
            <button
              key={o.text}
              className={`choice${cls}`}
              aria-pressed={chosen}
              disabled={locked}
              lang={course.targetLang}
              onClick={() => {
                onChange(o.text)
                if (sound) speak(o.text, course.targetLang)
              }}
            >
              <span className="key" aria-hidden="true">{i + 1}</span>
              <span className="emoji" aria-hidden="true">{o.emoji}</span>
              {o.text}
            </button>
          )
        })}
      </div>
    </>
  )
}

function Build({ ex, course, sound, locked, onChange }: {
  ex: BuildExercise; course: Course; sound: boolean; locked: boolean; onChange: (v: string | null) => void
}) {
  const [picked, setPicked] = useState<number[]>([])
  const [reveal, setReveal] = useState(ex.type === 'listen' && !canSpeak())
  const lang = ex.lang === 'target' ? course.targetLang : course.nativeLang
  const listen = ex.type === 'listen'
  const play = useCallback((slow = false) => { if (ex.audio) speak(ex.audio, course.targetLang, slow) }, [ex.audio, course.targetLang])

  useEffect(() => {
    if (listen && sound) play()
  }, [listen, sound, play])

  useEffect(() => {
    onChange(picked.length ? picked.map((i) => ex.tiles[i]).join(' ') : null)
  }, [picked, ex.tiles, onChange])

  return (
    <>
      <h1 className="ex-title">{listen ? 'Scrivi ciò che senti' : 'Traduci questa frase'}</h1>
      {listen ? (
        <>
          <div className="listen-row">
            <button className="speaker" aria-label="Ascolta" onClick={() => play()}>🔊</button>
            <button className="speaker slow" aria-label="Ascolta lentamente" onClick={() => play(true)}>🐢</button>
          </div>
          {reveal
            ? <p className="bubble" lang={course.targetLang} data-testid="listen-text">{ex.audio}</p>
            : <button className="link-btn" onClick={() => setReveal(true)}>Non posso ascoltare ora</button>}
        </>
      ) : (
        <div className="speech">
          <div className="avatar" aria-hidden="true">🧑‍🏫</div>
          <p className="bubble" lang={ex.lang === 'target' ? course.nativeLang : course.targetLang}>
            {ex.lang === 'native' && sound && (
              <button className="icon-btn" style={{ fontSize: 20, padding: 2 }} aria-label="Ascolta la frase" onClick={() => speak(ex.prompt, course.targetLang)}>🔊</button>
            )}
            <span data-testid="prompt">{ex.prompt}</span>
          </p>
        </div>
      )}
      <div className="answer-line" aria-label="La tua risposta" data-testid="answer-line" lang={lang}>
        {picked.map((i, pos) => (
          <button key={i} className="tile" disabled={locked} onClick={() => setPicked((p) => p.filter((_, k) => k !== pos))}>
            {ex.tiles[i]}
          </button>
        ))}
      </div>
      <div className="bank" aria-label="Parole disponibili" data-testid="bank" lang={lang}>
        {ex.tiles.map((t, i) => {
          const used = picked.includes(i)
          return (
            <button
              key={i}
              className={`tile${used ? ' used' : ''}`}
              disabled={locked || used}
              aria-hidden={used}
              tabIndex={used ? -1 : undefined}
              onClick={() => {
                setPicked((p) => [...p, i])
                if (sound && ex.lang === 'target' && !listen) speak(t, course.targetLang)
              }}
            >
              {t}
            </button>
          )
        })}
      </div>
    </>
  )
}

function TypeIn({ ex, course, locked, onChange }: { ex: TypeExercise; course: Course; locked: boolean; onChange: (v: string | null) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <>
      <h1 className="ex-title">Scrivi in {course.targetName}</h1>
      <div className="speech">
        <div className="avatar" aria-hidden="true">🧑‍🏫</div>
        <p className="bubble" lang={course.nativeLang}><span data-testid="prompt">{ex.prompt}</span></p>
      </div>
      <label className="sr-only" htmlFor="type-answer">La tua traduzione</label>
      <textarea
        id="type-answer"
        ref={ref}
        className="type-area"
        lang={course.targetLang}
        placeholder={`Scrivi in ${course.targetName}`}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        readOnly={locked}
        onChange={(e) => onChange(e.target.value.trim() ? e.target.value : null)}
      />
    </>
  )
}

function Match({ ex, course, sound, onDone }: { ex: MatchExercise; course: Course; sound: boolean; onDone: () => void }) {
  const left = useMemo(() => shuffle(ex.pairs.map((_, i) => i), Math.random), [ex])
  const right = useMemo(() => shuffle(ex.pairs.map((_, i) => i), Math.random), [ex])
  const [sel, setSel] = useState<{ side: 'l' | 'r'; i: number } | null>(null)
  const [matched, setMatched] = useState<number[]>([])
  const [wrong, setWrong] = useState<{ l: number; r: number } | null>(null)

  const choose = (side: 'l' | 'r', i: number) => {
    if (side === 'r' && sound) speak(ex.pairs[i].target, course.targetLang)
    if (!sel || sel.side === side) {
      setSel({ side, i })
      return
    }
    const l = side === 'l' ? i : sel.i
    const r = side === 'r' ? i : sel.i
    setSel(null)
    if (l === r) {
      const next = [...matched, l]
      setMatched(next)
      if (sound) sfx.correct()
      if (next.length === ex.pairs.length) onDone()
    } else {
      setWrong({ l, r })
      if (sound) sfx.wrong()
      setTimeout(() => setWrong(null), 500)
    }
  }

  const cls = (side: 'l' | 'r', i: number) => {
    if (matched.includes(i)) return ' matched'
    if (wrong && (side === 'l' ? wrong.l : wrong.r) === i) return ' wrong'
    return ''
  }

  return (
    <>
      <h1 className="ex-title">Abbina le coppie</h1>
      <div className="match">
        <div className="col" role="group" aria-label="Italiano" lang={course.nativeLang}>
          {left.map((i) => (
            <button key={i} className={`choice${cls('l', i)}`} disabled={matched.includes(i)} aria-pressed={sel?.side === 'l' && sel.i === i} onClick={() => choose('l', i)}>
              {ex.pairs[i].native}
            </button>
          ))}
        </div>
        <div className="col" role="group" aria-label={course.title} lang={course.targetLang}>
          {right.map((i) => (
            <button key={i} className={`choice${cls('r', i)}`} disabled={matched.includes(i)} aria-pressed={sel?.side === 'r' && sel.i === i} onClick={() => choose('r', i)}>
              {ex.pairs[i].target}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
