// Speech recognition through the browser (Safari on iPhone, Chrome). Nothing is recorded or sent by Parlami.

interface Alternative { transcript: string }
interface RecognitionEvent { results: ArrayLike<ArrayLike<Alternative>> }
interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}
type RecognitionCtor = new () => Recognition

function ctor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function canRecognize(): boolean {
  return ctor() !== null
}

/** Listens once and resolves with what was heard (several guesses), or rejects with a reason. */
export function listenOnce(lang: string): { result: Promise<string[]>; stop: () => void } {
  const Ctor = ctor()
  if (!Ctor) return { result: Promise.reject(new Error('unsupported')), stop: () => {} }
  const rec = new Ctor()
  rec.lang = lang
  rec.interimResults = false
  rec.maxAlternatives = 5
  const result = new Promise<string[]>((resolve, reject) => {
    let heard: string[] = []
    rec.onresult = (e) => {
      const first = e.results[0]
      heard = Array.from({ length: first.length }, (_, i) => first[i].transcript)
    }
    rec.onerror = (e) => reject(new Error(e.error))
    rec.onend = () => (heard.length ? resolve(heard) : reject(new Error('no-speech')))
  })
  rec.start()
  return { result, stop: () => rec.abort() }
}
