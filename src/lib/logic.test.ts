import { describe, expect, it } from 'vitest'
import { checkAnswer, checkSpoken, normalize, toTiles } from './answers'
import { tipsFor } from '../data/tips'
import { answerRun, buildLesson, buildPractice, nextRun, runDone, seededRng, startRun } from './lesson'
import * as store from './store'
import { allLessons, courses, english } from '../data/courses'
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
    for (const course of courses) {
      for (const lesson of allLessons(course)) {
        const exercises = buildLesson(course, lesson, seededRng(7))
        expect(exercises).toHaveLength(9)
        for (const ex of exercises) {
          if (ex.type === 'build' || ex.type === 'listen') {
            const locale = ex.lang === 'target' ? course.targetLang : course.nativeLang
            const built = toTiles(ex.answers[0]).map((t, i) => (i === 0 && t !== 'I' ? t.toLocaleLowerCase(locale) : t))
            for (const t of built) expect(ex.tiles, `${course.id} ${ex.id}`).toContain(t)
            expect(checkAnswer(built.join(' '), ex.answers, { compact: ex.compact }).correct, `${course.id} ${ex.id}`).toBe(true)
          }
          if (ex.type === 'select') {
            expect(ex.options.map((o) => o.text)).toContain(ex.answer)
            expect(new Set(ex.options.map((o) => o.text)).size).toBe(3)
          }
          if (ex.type === 'type') {
            expect(course.nonLatin).toBeFalsy()
            expect(checkAnswer(ex.answers[0], ex.answers, { typos: true }).correct).toBe(true)
          }
        }
      }
    }
  })

  it('has many courses, each with unique word answers and romanization where the script is not Latin', () => {
    expect(courses.length).toBeGreaterThanOrEqual(15)
    expect(new Set(courses.map((c) => c.id)).size).toBe(courses.length)
    for (const course of courses) {
      const words = allLessons(course).flatMap((l) => l.words)
      expect(new Set(words.map((w) => w.target)).size, course.id).toBe(words.length)
      if (course.nonLatin) for (const w of words) expect(w.roman, `${course.id} ${w.target}`).toBeTruthy()
    }
  })
})

describe('scripts and languages', () => {
  it('Chinese and Japanese answers ignore the tile spaces', () => {
    expect(checkAnswer('我吃苹果', ['我 吃 苹果 。'], { compact: true })).toMatchObject({ correct: true, expected: '我吃苹果。' })
    expect(checkAnswer('私 は りんご を 食べます', ['私 は りんご を 食べます 。'], { compact: true }).correct).toBe(true)
    expect(checkAnswer('我吃面包', ['我 吃 苹果 。'], { compact: true }).correct).toBe(false)
  })
  it('Polish, German and Turkish special letters count as accents', () => {
    expect(checkAnswer('jablko jest czerwone', ['Jabłko jest czerwone.'])).toMatchObject({ correct: true, note: 'accent' })
    expect(checkAnswer('das pferd ist gross', ['Das Pferd ist groß.'])).toMatchObject({ correct: true, note: 'accent' })
    expect(checkAnswer('iyi geceler anne', ['İyi geceler, anne.'])).toMatchObject({ correct: true, note: null })
  })
  it('Romanian accepts both comma and cedilla letters', () => {
    expect(checkAnswer('Mulţumesc, la revedere', ['Mulțumesc, la revedere.'])).toMatchObject({ correct: true, note: null })
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
    expect(store.currentStreak(s, at(2026, 3, 4))).toBe(2) // one missed day: the weekly free day
    expect(store.currentStreak(s, at(2026, 3, 5))).toBe(0)
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

describe('fixes from user feedback', () => {
  const lesson = (over: Partial<LessonResult> = {}): LessonResult =>
    ({ courseId: 'en-it', lessonId: 'en-u1-l1', practice: false, mistakes: 1, total: 9, ms: 60000, ...over })

  it('hearts are off by default', () => {
    expect(store.fresh().heartsOn).toBe(false)
  })

  it('one missed day a week keeps the streak (free day)', () => {
    let s = store.completeLesson(store.fresh(), lesson(), at(2026, 3, 1)).state
    s = store.completeLesson(s, lesson(), at(2026, 3, 2)).state
    // 3 March missed
    expect(store.currentStreak(s, at(2026, 3, 4))).toBe(2)
    const c = store.completeLesson(s, lesson(), at(2026, 3, 4))
    expect(c.usedFreeDay).toBe(true)
    expect(c.state.streak).toBe(3)
    expect(c.state.freeDayUsed).toBe('2026-03-03')
    s = c.state
    // a second miss within the week breaks it
    expect(store.freeDayAvailable(s, at(2026, 3, 6))).toBe(false)
    expect(store.currentStreak(s, at(2026, 3, 6))).toBe(0)
    // a week later the free day is back
    expect(store.freeDayAvailable(s, at(2026, 3, 10))).toBe(true)
  })

  it('two missed days in a row break the streak even with a free day', () => {
    const s = store.completeLesson(store.fresh(), lesson(), at(2026, 3, 1)).state
    expect(store.currentStreak(s, at(2026, 3, 4))).toBe(0)
  })

  it('a lesson has a speaking exercise only when asked, and practice never has one', () => {
    const l = english.units[0].lessons[0]
    expect(buildLesson(english, l, seededRng(3)).some((e) => e.type === 'speak')).toBe(false)
    const withSpeak = buildLesson(english, l, seededRng(3), { speak: true })
    expect(withSpeak).toHaveLength(10)
    expect(withSpeak.at(-1)!.type).toBe('speak')
    expect(buildPractice(english, ['en-u1-l1'], [], seededRng(4)).some((e) => e.type === 'speak')).toBe(false)
  })

  it('spoken answers forgive what speech recognition gets slightly wrong', () => {
    expect(checkSpoken(['the cat drinks milk'], ['The cat drinks milk.']).correct).toBe(true)
    expect(checkSpoken(['the cut drinks milk'], ['The cat drinks milk.']).correct).toBe(true)
    expect(checkSpoken(['something else entirely'], ['The cat drinks milk.']).correct).toBe(false)
    expect(checkSpoken(['猫喝牛奶'], ['猫 喝 牛奶 。'], true).correct).toBe(true)
    expect(checkSpoken(['nope', 'The cat drinks milk'], ['The cat drinks milk.']).correct).toBe(true)
  })

  it('every lesson of every course has tips', () => {
    for (const course of courses) {
      for (const l of allLessons(course)) expect(tipsFor(l.id).length, l.id).toBeGreaterThan(0)
    }
  })
})
