import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BuildExercise, Course, Exercise, MatchExercise, SelectExercise, SpeakExercise, TypeExercise } from '../types'
import { checkAnswer, checkSpoken, compactText } from '../lib/answers'
import type { Verdict } from '../lib/answers'
import { answerRun, nextRun, runDone, runProgress, shuffle, startRun } from '../lib/lesson'
import type { Run } from '../lib/lesson'
import { canSpeak, sfx, speak } from '../lib/sound'
import { Modal } from '../components/Chrome'
import { listenOnce } from '../lib/speech'
import { REPORT_URL } from '../config'

interface Props {
  course: Course
  exercises: Exercise[]
  practice: boolean
  hearts: number
  heartsOn: boolean
  sound: boolean
  /** grammar notes for this lesson */
  tips: string[]
  /** open the notes before the first exercise */
  showTips: boolean
  onTipsSeen: () => void
  onWrong: (ex: Exercise) => void
  onRight: (ex: Exercise) => void
  onFinish: (run: Run) => void
  onQuit: () => void
  onOutOfHearts: () => void
}

const SKIP = '__skip__'

const PRAISE = ['Ottimo!', 'Perfetto!', 'Esatto!', 'Bravissimo!', 'Ben fatto!']

export function Lesson(props: Props) {
  const { course, practice, hearts, heartsOn, sound, tips, onWrong, onRight, onFinish, onQuit, onOutOfHearts, onTipsSeen } = props
  const [run, setRun] = useState(() => startRun(props.exercises))
  const [answer, setAnswer] = useState<string | null>(null)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [quitting, setQuitting] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(props.showTips && tips.length > 0)
  const [answerGiven, setAnswerGiven] = useState('')
  const ex = run.queue[run.index]

  const check = useCallback((given?: string) => {
    const value = given ?? answer
    if (!ex || verdict || value === null) return
    let v: Verdict
    if (ex.type === 'select') v = value === ex.answer ? { correct: true, note: null, expected: ex.answer } : { correct: false, note: null, expected: ex.answer }
    else if (ex.type === 'match') v = { correct: true, note: null, expected: '' }
    else if (ex.type === 'speak') v = value === SKIP ? { correct: true, note: 'skip', expected: '' } : checkSpoken(value.split('\n'), ex.answers, ex.compact)
    else v = checkAnswer(value, ex.answers, { typos: ex.type === 'type', compact: ex.compact })
    setVerdict(v)
    setAnswerGiven(value)
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
    if (!verdict.correct && heartsOn && !practice && hearts <= 0) {
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
  }, [verdict, heartsOn, practice, hearts, run, onFinish, onOutOfHearts])

  // Enter checks, then continues
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || quitting || tipsOpen) return
      const t = e.target as HTMLElement
      if (t.tagName === 'BUTTON') return
      e.preventDefault()
      if (verdict) proceed()
      else check()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [verdict, proceed, check, quitting, tipsOpen])

  if (!ex) return null

  const closeTips = () => {
    setTipsOpen(false)
    onTipsSeen()
  }

  if (tipsOpen && run.index === 0 && !verdict && props.showTips) {
    return (
      <div className="lesson">
        <main className="lesson-body tips-page">
          <div className="big-emoji" aria-hidden="true">💡</div>
          <h1 className="ex-title">Prima di iniziare</h1>
          <TipList tips={tips} />
        </main>
        <footer className="footer">
          <div className="footer-inner" style={{ justifyContent: 'flex-end' }}>
            <button className="btn" onClick={closeTips} autoFocus>Inizia la lezione</button>
          </div>
        </footer>
      </div>
    )
  }
  const pct = Math.round(runProgress(run) * 100)
  const praise = PRAISE[run.index % PRAISE.length]

  return (
    <div className="lesson">
      <div className="lesson-top">
        <button className="icon-btn" aria-label="Esci dalla lezione" onClick={() => setQuitting(true)}>✕</button>
        {tips.length > 0 && <button className="icon-btn" aria-label="Suggerimenti della lezione" onClick={() => setTipsOpen(true)}>💡</button>}
        <div className="bar" role="progressbar" aria-label="Avanzamento lezione" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <span style={{ width: `${pct}%` }} />
        </div>
        {practice
          ? <span className="chip xp" aria-label="Ripasso">🔁</span>
          : heartsOn && <span className="chip heart" data-testid="lesson-hearts"><span className="emoji" aria-hidden="true">❤️</span><span className="sr-only">Cuori:</span>{hearts}</span>}
      </div>

      <main className="lesson-body" key={run.index}>
        {ex.type === 'select' && <Select ex={ex} course={course} sound={sound} value={answer} locked={!!verdict} verdict={verdict} onChange={setAnswer} />}
        {(ex.type === 'build' || ex.type === 'listen') && <Build ex={ex} course={course} sound={sound} locked={!!verdict} onChange={setAnswer} />}
        {ex.type === 'type' && <TypeIn ex={ex} course={course} locked={!!verdict} onChange={setAnswer} />}
        {ex.type === 'speak' && <Speak ex={ex} course={course} sound={sound} locked={!!verdict} onChange={setAnswer} onSkip={() => check(SKIP)} />}
        {ex.type === 'match' && <Match ex={ex} course={course} sound={sound} onDone={() => check('done')} />}
      </main>

      <footer className={`footer${verdict ? (verdict.correct ? ' correct' : ' wrong') : ''}`}>
        <div className="footer-inner" role="status" aria-live="polite">
          {verdict ? (
            <>
              <div className="feedback">
                {verdict.correct ? (
                  <>
                    <h2><span aria-hidden="true">✅</span> {verdict.note === 'skip' ? 'Nessun problema' : praise}</h2>
                    {verdict.note === 'skip' && <p className="answer">Ci riproverai nella prossima lezione.</p>}
                    {verdict.note === 'accent' && <p className="answer">Attenzione agli accenti: {verdict.expected}</p>}
                    {verdict.note === 'typo' && <p className="answer">Attenzione all'ortografia: {verdict.expected}</p>}
                  </>
                ) : (
                  <>
                    <h2><span aria-hidden="true">❌</span> Risposta corretta:</h2>
                    <p className="answer" dir="auto" lang={ex.type !== 'match' && 'lang' in ex && ex.lang === 'native' ? course.nativeLang : course.targetLang}>{verdict.expected}</p>
                  </>
                )}
                {verdict.note !== 'skip' && ex.type !== 'match' && (
                  <a className="report" href={reportLink(course, ex, answerGiven, verdict.expected)} target="_blank" rel="noopener noreferrer">
                    Segnala un errore
                  </a>
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

      {tipsOpen && (
        <Modal label="Suggerimenti">
          <div className="big-emoji" aria-hidden="true">💡</div>
          <h2>Suggerimenti</h2>
          <TipList tips={tips} />
          <button className="btn block" onClick={() => setTipsOpen(false)} autoFocus>Ho capito</button>
        </Modal>
      )}

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
              <span>
                <span>{o.text}</span>
                {o.roman && <small className="roman">{o.roman}</small>}
              </span>
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
  // Arabic sentences are built right to left
  const dir = ex.lang === 'target' && course.rtl ? 'rtl' : undefined
  const listen = ex.type === 'listen'
  const shown = (t: string) => (course.compact ? compactText(t) : t)
  const play = useCallback((slow = false) => { if (ex.audio) speak(compactOr(ex.audio, course.compact), course.targetLang, slow) }, [ex.audio, course.targetLang, course.compact])

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
            ? <p className="bubble" dir="auto" lang={course.targetLang}><span data-testid="listen-text">{shown(ex.audio ?? '')}</span>{ex.roman && <small className="roman">{ex.roman}</small>}</p>
            : <button className="link-btn" onClick={() => setReveal(true)}>Non posso ascoltare ora</button>}
        </>
      ) : (
        <div className="speech">
          <div className="avatar" aria-hidden="true">🧑‍🏫</div>
          <p className="bubble" dir="auto" lang={ex.lang === 'target' ? course.nativeLang : course.targetLang}>
            {ex.lang === 'native' && sound && (
              <button className="icon-btn" style={{ fontSize: 20, padding: 2 }} aria-label="Ascolta la frase" onClick={() => speak(shown(ex.prompt), course.targetLang)}>🔊</button>
            )}
            <span>
              <span data-testid="prompt">{ex.lang === 'native' ? shown(ex.prompt) : ex.prompt}</span>
              {ex.roman && <small className="roman">{ex.roman}</small>}
            </span>
          </p>
        </div>
      )}
      <div className="answer-line" aria-label="La tua risposta" data-testid="answer-line" lang={lang} dir={dir}>
        {picked.map((i, pos) => (
          <button key={i} className="tile" disabled={locked} onClick={() => setPicked((p) => p.filter((_, k) => k !== pos))}>
            {ex.tiles[i]}
          </button>
        ))}
      </div>
      <div className="bank" aria-label="Parole disponibili" data-testid="bank" lang={lang} dir={dir}>
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
        <p className="bubble" dir="auto" lang={course.nativeLang}><span data-testid="prompt">{ex.prompt}</span></p>
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
              <span>
                <span>{ex.pairs[i].target}</span>
                {ex.pairs[i].roman && <small className="roman">{ex.pairs[i].roman}</small>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function compactOr(text: string, compact?: boolean): string {
  return compact ? compactText(text) : text
}

function TipList({ tips }: { tips: string[] }) {
  return (
    <ul className="tips">
      {tips.map((t) => <li key={t} dir="ltr">{t}</li>)}
    </ul>
  )
}

function reportLink(course: Course, ex: Exercise, given: string, expected: string): string {
  const shown = 'prompt' in ex ? ex.prompt : ''
  const body = [
    `Corso: ${course.title} (${course.id})`,
    `Lezione: ${ex.lessonId}`,
    `Esercizio: ${ex.id} (${ex.type})`,
    `Frase mostrata: ${shown}`,
    `Risposta data: ${given === SKIP ? '' : given.replace(/\n/g, ' / ')}`,
    `Soluzione indicata: ${expected}`,
    '',
    "Cosa c'è che non va?",
    '',
  ].join('\n')
  const title = `Errore nel corso di ${course.title.toLowerCase()}: ${ex.id}`
  return `${REPORT_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
}

function Speak({ ex, course, sound, locked, onChange, onSkip }: {
  ex: SpeakExercise; course: Course; sound: boolean; locked: boolean; onChange: (v: string | null) => void; onSkip: () => void
}) {
  const [state, setState] = useState<'idle' | 'listening' | 'heard' | 'error'>('idle')
  const [heard, setHeard] = useState<string[]>([])
  const [error, setError] = useState('')
  const stopRef = useRef<() => void>(() => {})
  const text = course.compact ? compactText(ex.prompt) : ex.prompt

  useEffect(() => () => stopRef.current(), [])

  const start = () => {
    setState('listening')
    setError('')
    const { result, stop } = listenOnce(course.targetLang)
    stopRef.current = stop
    result.then(
      (h) => {
        setHeard(h)
        setState('heard')
        onChange(h.join('\n'))
      },
      (e: Error) => {
        setState('error')
        setError(e.message === 'not-allowed' || e.message === 'service-not-allowed'
          ? 'Il microfono non è autorizzato. Puoi consentirlo nelle impostazioni del browser, oppure saltare.'
          : 'Non ho sentito bene. Riprova, parlando vicino al telefono.')
      },
    )
  }

  return (
    <>
      <h1 className="ex-title">Leggi ad alta voce</h1>
      <div className="speech">
        <div className="avatar" aria-hidden="true">🧑‍🏫</div>
        <p className="bubble" dir="auto" lang={course.targetLang}>
          {sound && (
            <button className="icon-btn" style={{ fontSize: 20, padding: 2 }} aria-label="Ascolta la frase" onClick={() => speak(text, course.targetLang)}>🔊</button>
          )}
          <span>
            <span data-testid="prompt">{text}</span>
            {ex.roman && <small className="roman">{ex.roman}</small>}
          </span>
        </p>
      </div>
      <button className={`mic${state === 'listening' ? ' on' : ''}`} disabled={locked || state === 'listening'} onClick={start}>
        <span aria-hidden="true">🎤</span> {state === 'listening' ? 'Ti ascolto…' : state === 'heard' ? 'Riprova' : 'Tocca e parla'}
      </button>
      {state === 'heard' && <p className="muted" dir="auto">Hai detto: «{heard[0]}»</p>}
      {state === 'error' && <p className="muted" role="alert">{error}</p>}
      {!locked && <button className="link-btn" onClick={onSkip}>Non posso parlare ora</button>}
    </>
  )
}
