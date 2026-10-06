import { describe, expect, it } from 'vitest'
import { checkAnswer, normalize, toTiles } from './answers'
import { answerRun, buildLesson, buildPractice, nextRun, runDone, seededRng, startRun } from './lesson'
import * as store from './store'
import { allLessons, courses, english, spanish } from '../data/courses'
import type { LessonResult } from '../types'

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).getTime()

describe('answers', () => {
  it('ignores case, punctuation and extra spaces', () => {
    expect(checkAnswer('  hello my name is LUCA ', ['Hello, my name is Luca.']).correct).toBe(true)
  })
  it('expands English contractions both ways', () => {
    expect(checkAnswer("I'm going to the hospital", ['I am going to the hospital.']).correct).toBe(true)
    expect(normalize("We don't")).toBe('we do not')
    expect(checkAnswer("Let's go by car", ['We go by car.', 'Let us go by car.']).correct).toBe(true)
  })
  it('accepts alternatives', () => {
    expect(checkAnswer('Thanks, bye!', ['Thank you, goodbye!', 'Thanks, bye!']).correct).toBe(true)
  })
  it('forgives missing accents but says so', () => {
    const v = checkAnswer('el pajaro es pequeno', ['El pájaro es pequeño.'])
    expect(v).toMatchObject({ correct: true, note: 'accent' })
  })
  it('forgives one typo in a long word when typing', () => {
    expect(checkAnswer('My suitcse is heavy', ['My suitcase is heavy.'], { typos: true })).toMatchObject({ correct: true, note: 'typo' })
    expect(checkAnswer('My suitcse is heavy', ['My suitcase is heavy.']).correct).toBe(false)
  })
  it('does not forgive a wrong short word', () => {
    expect(checkAnswer('I am a men', ['I am a man.'], { typos: true }).correct).toBe(false)
    expect(checkAnswer('She is a boy', ['He is a boy.'], { typos: true }).correct).toBe(false)
  })
  it('rejects empty input', () => {
    expect(checkAnswer('   ', ['Hello']).correct).toBe(false)
  })
  it('keeps apostrophes inside tiles', () => {
    expect(toTiles("Dov'è la stazione?")).toEqual(["Dov'è", 'la', 'stazione'])
  })
})

describe('course content', () => {
  for (const course of courses) {
    it(`${course.id}: every lesson has 5 words and 4 sentences, unique ids`, () => {
      const lessons = allLessons(course)
      expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length)
      for (const l of lessons) {
        expect(l.words).toHaveLength(5)
        expect(l.sentences).toHaveLength(4)
      }
    })
  }

  it('every built lesson can be answered with its own tiles', () => {
    for (const course of [english, spanish]) {
      for (const lesson of allLessons(course)) {
        const exercises = buildLesson(course, lesson, seededRng(7))
        expect(exercises).toHaveLength(9)
        for (const ex of exercises) {
          if (ex.type === 'build' || ex.type === 'listen') {
            const built = toTiles(ex.answers[0]).map((t, i) => (i === 0 && t !== 'I' ? t.toLowerCase() : t))
            for (const t of built) expect(ex.tiles).toContain(t)
            expect(checkAnswer(built.join(' '), ex.answers).correct).toBe(true)
          }
          if (ex.type === 'select') {
            expect(ex.options.map((o) => o.text)).toContain(ex.answer)
            expect(new Set(ex.options.map((o) => o.text)).size).toBe(3)
          }
          if (ex.type === 'type') expect(checkAnswer(ex.answers[0], ex.answers, { typos: true }).correct).toBe(true)
        }
      }
    }
  })
})

describe('lesson run', () => {
  it('requeues a wrong answer until it is right', () => {
    const [a, b] = buildLesson(english, english.units[0].lessons[0], seededRng(1))
    let run = startRun([a, b])
    run = nextRun(answerRun(run, false)) // a wrong -> goes to the back
    expect(run.queue.map((e) => e.id)).toEqual([a.id, b.id, a.id])
    run = nextRun(answerRun(run, true)) // b
    expect(runDone(run)).toBe(false)
    run = nextRun(answerRun(run, true)) // a again
    expect(runDone(run)).toBe(true)
    expect(run).toMatchObject({ correct: 2, mistakes: 1, total: 2 })
  })

  it('practice is empty for a brand new learner', () => {
    expect(buildPractice(english, [], [], seededRng(1))).toEqual([])
  })

  it('practice puts mistakes first', () => {
    const ex = buildLesson(english, english.units[0].lessons[0], seededRng(1))
    const p = buildPractice(english, ['en-u1-l1'], [ex[4]], seededRng(2))
    expect(p[0].id).toBe(ex[4].id)
    expect(p.length).toBeGreaterThan(1)
  })
})

describe('store', () => {
  const lesson = (over: Partial<LessonResult> = {}): LessonResult =>
    ({ courseId: 'en-it', lessonId: 'en-u1-l1', practice: false, mistakes: 1, total: 9, ms: 60000, ...over })

  it('gives XP and starts a streak on the first lesson', () => {
    const c = store.completeLesson(store.fresh(), lesson(), at(2026, 3, 1))
    expect(c.xp).toBe(10)
    expect(c.streakExtended).toBe(true)
    expect(c.state.streak).toBe(1)
    expect(c.state.courses['en-it'].completed).toEqual(['en-u1-l1'])
  })

  it('perfect lesson gets a bonus', () => {
    expect(store.completeLesson(store.fresh(), lesson({ mistakes: 0 }), at(2026, 3, 1)).xp).toBe(15)
  })

  it('streak grows on consecutive days, not twice on one day, and breaks after a gap', () => {
    let s = store.completeLesson(store.fresh(), lesson(), at(2026, 3, 1)).state
    s = store.completeLesson(s, lesson(), at(2026, 3, 1, 20)).state
    expect(s.streak).toBe(1)
    s = store.completeLesson(s, lesson(), at(2026, 3, 2)).state
    expect(s.streak).toBe(2)
    expect(store.currentStreak(s, at(2026, 3, 3))).toBe(2) // yesterday still counts
    expect(store.currentStreak(s, at(2026, 3, 4))).toBe(0)
    s = store.completeLesson(s, lesson(), at(2026, 3, 5)).state
    expect(s.streak).toBe(1)
  })

  it('streak crosses a month end and DST', () => {
    let s = store.completeLesson(store.fresh(), lesson(), at(2026, 3, 28, 23)).state
    s = store.completeLesson(s, lesson(), at(2026, 3, 29, 1)).state
    s = store.completeLesson(s, lesson(), at(2026, 3, 30)).state
    s = store.completeLesson(s, lesson(), at(2026, 3, 31)).state
    s = store.completeLesson(s, lesson(), at(2026, 4, 1)).state
    expect(s.streak).toBe(5)
  })

  it('reports the daily goal only when it is crossed', () => {
    let s = { ...store.fresh(), dailyGoal: 20 }
    let c = store.completeLesson(s, lesson(), at(2026, 3, 1))
    expect(c.goalReached).toBe(false)
    s = c.state
    c = store.completeLesson(s, lesson(), at(2026, 3, 1))
    expect(c.goalReached).toBe(true)
    c = store.completeLesson(c.state, lesson(), at(2026, 3, 1))
    expect(c.goalReached).toBe(false)
  })

  it('hearts: lose, refill one per 30 minutes, never above 5', () => {
    const t = at(2026, 3, 1)
    let s = store.fresh(t)
    s = store.loseHeart(s, t)
    s = store.loseHeart(s, t + 1000)
    expect(s.hearts).toBe(3)
    expect(store.msToNextHeart(s, t + 1000)).toBe(store.REFILL_MS - 1000)
    expect(store.refillHearts(s, t + store.REFILL_MS).hearts).toBe(4)
    expect(store.refillHearts(s, t + 10 * store.REFILL_MS).hearts).toBe(5)
  })

  it('hearts cannot go below zero', () => {
    let s = { ...store.fresh(0), hearts: 0, heartsUpdatedAt: 0 }
    s = store.loseHeart(s, 1000)
    expect(s.hearts).toBe(0)
  })

  it('practice gives a heart back and does not count as a lesson', () => {
    const t = at(2026, 3, 1)
    const s = { ...store.fresh(t), hearts: 2, heartsUpdatedAt: t }
    const c = store.completeLesson(s, lesson({ practice: true, lessonId: null }), t + 1000)
    expect(c.state.hearts).toBe(3)
    expect(c.xp).toBe(5)
    expect(c.state.lessonsDone).toBe(0)
  })

  it('only the first unfinished lesson is unlocked', () => {
    const order = ['a', 'b', 'c']
    expect(store.isUnlocked(order, [], 'a')).toBe(true)
    expect(store.isUnlocked(order, [], 'b')).toBe(false)
    expect(store.isUnlocked(order, ['a'], 'b')).toBe(true)
    expect(store.isUnlocked(order, ['a'], 'a')).toBe(true)
  })

  it('mistakes are kept unique and capped', () => {
    const ex = buildLesson(english, english.units[0].lessons[0], seededRng(1))
    let s = store.fresh()
    for (let i = 0; i < 3; i++) s = store.recordMistake(s, 'en-it', ex[0])
    expect(store.progressFor(s, 'en-it').mistakes).toHaveLength(1)
    s = store.clearMistake(s, 'en-it', ex[0].id)
    expect(store.progressFor(s, 'en-it').mistakes).toHaveLength(0)
  })

  it('load survives garbage in storage', () => {
    const mem: Record<string, string> = { [store.KEY]: '{not json' }
    ;(globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => { mem[k] = v },
    }
    expect(store.load(5).hearts).toBe(5)
    mem[store.KEY] = JSON.stringify({ ...store.fresh(0), streak: 4 })
    expect(store.load(5).streak).toBe(4)
  })
})
