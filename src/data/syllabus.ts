import type { Course, Sentence, Unit, Word } from '../types'

// One shared beginner syllabus, written in Italian. Every course built with
// makeCourse() translates these 30 words and 24 sentences, in this order.

const LESSONS = ['Saluti', 'Persone', 'Cibo', 'Animali', 'Colori', 'Famiglia']

const WORDS: [string, string][] = [
  ['ciao', '👋'], ['grazie', '🙏'], ['arrivederci', '🚪'], ['buongiorno', '☀️'], ['buonanotte', '🌙'],
  ['uomo', '👨'], ['donna', '👩'], ['ragazzo', '👦'], ['ragazza', '👧'], ['bambino', '🧒'],
  ['mela', '🍎'], ['pane', '🍞'], ['acqua', '💧'], ['latte', '🥛'], ['formaggio', '🧀'],
  ['cane', '🐶'], ['gatto', '🐱'], ['uccello', '🐦'], ['cavallo', '🐴'], ['pesce', '🐟'],
  ['rosso', '🔴'], ['blu', '🔵'], ['verde', '🟢'], ['giallo', '🟡'], ['nero', '⚫'],
  ['madre', '👩‍👧'], ['padre', '👨‍👦'], ['sorella', '👭'], ['fratello', '👬'], ['nonna', '👵'],
]

const SENTENCES: [string, string[]?][] = [
  ['Ciao, mi chiamo Luca.', ['Ciao, sono Luca.']],
  ['Buongiorno, Marta!'],
  ['Grazie, arrivederci.', ['Grazie, ciao.']],
  ['Buonanotte, mamma.'],
  ['Io sono una donna.', ['Sono una donna.']],
  ['Lui è un ragazzo.', ['È un ragazzo.']],
  ['Lei è una ragazza.', ['È una ragazza.']],
  ['Tu sei un uomo.', ['Sei un uomo.']],
  ['Io mangio una mela.', ['Mangio una mela.']],
  ['Lei beve acqua.', ["Lei beve dell'acqua.", 'Beve acqua.']],
  ['Il ragazzo mangia pane.', ['Il ragazzo mangia il pane.']],
  ['Noi beviamo latte.', ['Beviamo latte.', 'Beviamo il latte.', 'Noi beviamo il latte.']],
  ['Il gatto beve latte.', ['Il gatto beve il latte.']],
  ['Ho un cane.', ['Io ho un cane.']],
  ['Il cavallo è grande.'],
  ["L'uccello è piccolo."],
  ['La mela è rossa.'],
  ['Il mio cane è nero.'],
  ['Il sole è giallo.'],
  ['La porta è blu.'],
  ['Mio padre legge un libro.', ['Mio papà legge un libro.']],
  ['Ho una sorella.', ['Io ho una sorella.']],
  ['Lui è mio fratello.', ['È mio fratello.']],
  ['Mia nonna cucina la pasta.', ['Mia nonna cucina pasta.']],
]

type Tr = string | [string, string[]]

export interface CourseMeta {
  id: string
  title: string
  targetName: string
  targetLang: string
  flag: string
  /** written without spaces between words (Chinese, Japanese): data uses spaces to mark tiles */
  compact?: boolean
  /** not written in the Latin alphabet: no typing exercise, show a romanization */
  nonLatin?: boolean
}

export interface Translation {
  words: string[]
  sentences: Tr[]
  /** romanization of each word (non-Latin scripts) */
  wordRoman?: string[]
  /** romanization of each sentence (non-Latin scripts) */
  sentenceRoman?: string[]
}

export function makeCourse(meta: CourseMeta, tr: Translation): Course {
  if (tr.words.length !== WORDS.length || tr.sentences.length !== SENTENCES.length) {
    throw new Error(`${meta.id}: needs ${WORDS.length} words and ${SENTENCES.length} sentences`)
  }
  const words: Word[] = WORDS.map(([native, emoji], i) => ({ native, emoji, target: tr.words[i], roman: tr.wordRoman?.[i] }))
  const sentences: Sentence[] = SENTENCES.map(([native, nativeAlts], i) => {
    const t = tr.sentences[i]
    const [target, targetAlts] = typeof t === 'string' ? [t, []] : t
    return { native, nativeAlts: nativeAlts ?? [], target, targetAlts, roman: tr.sentenceRoman?.[i] }
  })
  const lessons = LESSONS.map((title, i) => ({
    id: `${meta.id}-l${i + 1}`,
    title,
    words: words.slice(i * 5, i * 5 + 5),
    sentences: sentences.slice(i * 4, i * 4 + 4),
  }))
  const units: Unit[] = [
    { id: `${meta.id}-u1`, title: 'Primi passi', description: 'Saluta, presentati, parla di persone e cibo', lessons: lessons.slice(0, 3) },
    { id: `${meta.id}-u2`, title: 'Intorno a me', description: 'Animali, colori e famiglia', lessons: lessons.slice(3) },
  ]
  return { ...meta, nativeLang: 'it-IT', units }
}
