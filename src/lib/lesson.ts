import { allLessons } from '../data/courses'
import type { BuildExercise, Course, Exercise, LessonDef, Sentence, Word } from '../types'
import { toTiles } from './answers'

export type Rng = () => number

export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pick<T>(items: T[], n: number, rng: Rng): T[] {
  return shuffle(items, rng).slice(0, n)
}

function tileCase(word: string, index: number, locale: string): string {
  return index === 0 && word !== 'I' ? word.toLocaleLowerCase(locale) : word
}

function sentenceTiles(sentence: string, locale: string): string[] {
  return toTiles(sentence).map((w, i) => tileCase(w, i, locale))
}

function distractors(pool: Sentence[], side: 'native' | 'target', locale: string, avoid: string[], n: number, rng: Rng): string[] {
  const taken = new Set(avoid.map((t) => t.toLocaleLowerCase(locale)))
  const words = new Set<string>()
  for (const s of pool) for (const t of sentenceTiles(s[side], locale)) if (!taken.has(t.toLocaleLowerCase(locale))) words.add(t)
  return pick([...words], n, rng)
}

function buildFrom(
  course: Course, lessonId: string, id: string, sentence: Sentence, into: 'native' | 'target',
  pool: Sentence[], rng: Rng, listen = false,
): BuildExercise {
  const locale = into === 'target' ? course.targetLang : course.nativeLang
  const answer = sentence[into]
  const alts = (into === 'target' ? sentence.targetAlts : sentence.nativeAlts) ?? []
  const tiles = sentenceTiles(answer, locale)
  const showsTarget = listen || into === 'native'
  return {
    id,
    lessonId,
    type: listen ? 'listen' : 'build',
    prompt: listen ? '' : into === 'target' ? sentence.native : sentence.target,
    audio: listen ? sentence.target : undefined,
    lang: into,
    tiles: shuffle([...tiles, ...distractors(pool, into, locale, tiles, listen ? 2 : 3, rng)], rng),
    answers: [answer, ...alts],
    roman: showsTarget ? sentence.roman : undefined,
    compact: course.compact && into === 'target' ? true : undefined,
  }
}

/** Words from this lesson, topped up from earlier lessons when needed. */
function wordPool(course: Course, lesson: LessonDef): Word[] {
  const lessons = allLessons(course)
  const idx = lessons.findIndex((l) => l.id === lesson.id)
  return lessons.slice(0, idx + 1).reverse().flatMap((l) => l.words)
}

export function buildLesson(course: Course, lesson: LessonDef, rng: Rng): Exercise[] {
  const pool = allLessons(course).flatMap((l) => l.sentences)
  const others = pool.filter((s) => !lesson.sentences.includes(s))
  const words = wordPool(course, lesson)
  const [s0, s1, s2, s3] = lesson.sentences
  const id = (n: number) => `${lesson.id}#${n}`

  const selects: Exercise[] = pick(lesson.words, 3, rng).map((word, i) => {
    const wrong = pick(words.filter((x) => x.target !== word.target), 2, rng)
    return {
      id: id(i),
      lessonId: lesson.id,
      type: 'select' as const,
      prompt: word.native,
      options: shuffle([word, ...wrong], rng).map((x) => ({ text: x.target, emoji: x.emoji, roman: x.roman })),
      answer: word.target,
    }
  })

  const match: Exercise = {
    id: id(3),
    lessonId: lesson.id,
    type: 'match',
    pairs: lesson.words.map((x) => ({ native: x.native, target: x.target, roman: x.roman })),
  }

  const listenSentence = pick(lesson.sentences, 1, rng)[0]

  return [
    selects[0],
    selects[1],
    buildFrom(course, lesson.id, id(4), s0, 'target', others, rng),
    match,
    buildFrom(course, lesson.id, id(5), s1, 'native', others, rng),
    selects[2],
    buildFrom(course, lesson.id, id(6), s2, 'target', others, rng),
    // typing needs a keyboard for the script: non-Latin courses build the sentence instead
    course.nonLatin
      ? buildFrom(course, lesson.id, id(7), s3, 'target', others, rng)
      : { id: id(7), lessonId: lesson.id, type: 'type', prompt: s3.native, lang: 'target', answers: [s3.target, ...(s3.targetAlts ?? [])] },
    buildFrom(course, lesson.id, id(8), listenSentence, 'target', others, rng, true),
  ]
}

/** Practice: recent mistakes first, topped up with exercises from finished lessons. */
export function buildPractice(course: Course, completed: string[], mistakes: Exercise[], rng: Rng): Exercise[] {
  const out = mistakes.slice(-6).reverse()
  const done = allLessons(course).filter((l) => completed.includes(l.id))
  if (done.length) {
    const extra = shuffle(done, rng).flatMap((l) => buildLesson(course, l, rng)).filter((e) => e.type !== 'match')
    for (const e of shuffle(extra, rng)) {
      if (out.length >= 8) break
      if (!out.some((o) => o.id === e.id)) out.push(e)
    }
  }
  return out.map((e) => ({ ...e }))
}

// --- running a lesson -----------------------------------------------------

export interface Run {
  queue: Exercise[]
  index: number
  total: number
  correct: number
  mistakes: number
  missed: Exercise[]
}

export function startRun(exercises: Exercise[]): Run {
  return { queue: exercises, index: 0, total: exercises.length, correct: 0, mistakes: 0, missed: [] }
}

/** Records an answer. A wrong answer goes to the back of the queue until it is answered right. */
export function answerRun(run: Run, correct: boolean): Run {
  const ex = run.queue[run.index]
  if (correct) return { ...run, correct: run.correct + 1 }
  return {
    ...run,
    mistakes: run.mistakes + 1,
    queue: [...run.queue, ex],
    missed: run.missed.some((m) => m.id === ex.id) ? run.missed : [...run.missed, ex],
  }
}

export function nextRun(run: Run): Run {
  return { ...run, index: run.index + 1 }
}

export function runDone(run: Run): boolean {
  return run.index >= run.queue.length
}

export function runProgress(run: Run): number {
  return run.total ? run.correct / run.total : 0
}
