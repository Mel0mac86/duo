import type { CourseProgress, Exercise, LessonResult, SaveState } from '../types'

export const KEY = 'parlami:v1'
export const MAX_HEARTS = 5
export const REFILL_MS = 30 * 60 * 1000
export const LESSON_XP = 10
export const PERFECT_BONUS = 5
export const PRACTICE_XP = 5
const MAX_MISTAKES = 20

export function fresh(now = Date.now()): SaveState {
  return {
    version: 1,
    courseId: null,
    dailyGoal: 20,
    sound: true,
    courses: {},
    xpByDay: {},
    streak: 0,
    lastActiveDay: null,
    hearts: MAX_HEARTS,
    heartsUpdatedAt: now,
    heartsOn: false,
    speakOn: true,
    freeDayUsed: null,
    tipsSeen: [],
    lessonsDone: 0,
    perfectLessons: 0,
  }
}

/** The learner's local calendar day, 'YYYY-MM-DD'. Streaks follow local midnight, not UTC. */
export function dayKey(ms: number): string {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n, 12).getTime())
}

export function load(now = Date.now()): SaveState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh(now)
    const data = JSON.parse(raw)
    if (!data || data.version !== 1) return fresh(now)
    return refillHearts({ ...fresh(now), ...data }, now)
  } catch {
    return fresh(now)
  }
}

export function save(state: SaveState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // storage full or blocked: progress lives in memory for this visit
  }
}

export function progressFor(state: SaveState, courseId: string): CourseProgress {
  return state.courses[courseId] ?? { completed: [], mistakes: [] }
}

export function refillHearts(state: SaveState, now: number): SaveState {
  if (state.hearts >= MAX_HEARTS) return state
  const gained = Math.floor((now - state.heartsUpdatedAt) / REFILL_MS)
  if (gained <= 0) return state
  const hearts = Math.min(MAX_HEARTS, state.hearts + gained)
  return { ...state, hearts, heartsUpdatedAt: hearts >= MAX_HEARTS ? now : state.heartsUpdatedAt + gained * REFILL_MS }
}

export function msToNextHeart(state: SaveState, now: number): number {
  if (state.hearts >= MAX_HEARTS) return 0
  return Math.max(0, state.heartsUpdatedAt + REFILL_MS - now)
}

export function loseHeart(state: SaveState, now: number): SaveState {
  const s = refillHearts(state, now)
  if (s.hearts <= 0) return s
  return { ...s, hearts: s.hearts - 1, heartsUpdatedAt: s.hearts >= MAX_HEARTS ? now : s.heartsUpdatedAt }
}

export function recordMistake(state: SaveState, courseId: string, ex: Exercise): SaveState {
  const p = progressFor(state, courseId)
  const mistakes = [...p.mistakes.filter((m) => m.id !== ex.id), ex].slice(-MAX_MISTAKES)
  return { ...state, courses: { ...state.courses, [courseId]: { ...p, mistakes } } }
}

export function clearMistake(state: SaveState, courseId: string, exId: string): SaveState {
  const p = progressFor(state, courseId)
  if (!p.mistakes.some((m) => m.id === exId)) return state
  return { ...state, courses: { ...state.courses, [courseId]: { ...p, mistakes: p.mistakes.filter((m) => m.id !== exId) } } }
}

/** One missed day per 7 days does not break the streak. */
export function freeDayAvailable(state: SaveState, now: number): boolean {
  return !state.freeDayUsed || state.freeDayUsed <= addDays(dayKey(now), -7)
}

/** Whether the streak is alive today, and whether that needs the free day (one day missed). */
function streakStatus(state: SaveState, now: number): 'alive' | 'free-day' | 'broken' {
  if (!state.lastActiveDay) return 'broken'
  const today = dayKey(now)
  if (state.lastActiveDay === today || state.lastActiveDay === addDays(today, -1)) return 'alive'
  if (state.lastActiveDay === addDays(today, -2) && freeDayAvailable(state, now)) return 'free-day'
  return 'broken'
}

export function currentStreak(state: SaveState, now: number): number {
  return streakStatus(state, now) === 'broken' ? 0 : state.streak
}

export function xpToday(state: SaveState, now: number): number {
  return state.xpByDay[dayKey(now)] ?? 0
}

export function totalXp(state: SaveState): number {
  return Object.values(state.xpByDay).reduce((a, b) => a + b, 0)
}

export function lessonXp(result: LessonResult): number {
  if (result.practice) return PRACTICE_XP
  return LESSON_XP + (result.mistakes === 0 ? PERFECT_BONUS : 0)
}

export interface Completion {
  state: SaveState
  xp: number
  streakExtended: boolean
  /** the weekly free day kept the streak alive */
  usedFreeDay: boolean
  goalReached: boolean
}

export function completeLesson(state: SaveState, result: LessonResult, now: number): Completion {
  const today = dayKey(now)
  const xp = lessonXp(result)
  const before = xpToday(state, now)
  const streak = currentStreak(state, now)
  const streakExtended = state.lastActiveDay !== today
  const usedFreeDay = streakExtended && streakStatus(state, now) === 'free-day'
  const p = progressFor(state, result.courseId)
  const completed = result.lessonId && !p.completed.includes(result.lessonId) ? [...p.completed, result.lessonId] : p.completed
  let next: SaveState = {
    ...state,
    courses: { ...state.courses, [result.courseId]: { ...p, completed } },
    xpByDay: { ...state.xpByDay, [today]: before + xp },
    streak: streakExtended ? streak + 1 : streak,
    lastActiveDay: today,
    freeDayUsed: usedFreeDay ? addDays(today, -1) : state.freeDayUsed,
    lessonsDone: state.lessonsDone + (result.practice ? 0 : 1),
    perfectLessons: state.perfectLessons + (!result.practice && result.mistakes === 0 ? 1 : 0),
  }
  if (result.practice) {
    next = refillHearts(next, now)
    if (next.hearts < MAX_HEARTS) next = { ...next, hearts: next.hearts + 1, heartsUpdatedAt: next.hearts + 1 >= MAX_HEARTS ? now : next.heartsUpdatedAt }
  }
  return { state: next, xp, streakExtended, usedFreeDay, goalReached: before < state.dailyGoal && before + xp >= state.dailyGoal }
}

/** The lessons a learner can open: every completed one plus the first one not done yet. */
export function isUnlocked(order: string[], completed: string[], lessonId: string): boolean {
  if (completed.includes(lessonId)) return true
  const firstOpen = order.find((id) => !completed.includes(id))
  return firstOpen === lessonId
}

export interface Achievement {
  id: string
  title: string
  detail: string
  done: boolean
}

export function achievements(state: SaveState, now: number): Achievement[] {
  const xp = totalXp(state)
  const best = Math.max(state.streak, currentStreak(state, now))
  return [
    { id: 'first', title: 'Si parte!', detail: 'Completa la tua prima lezione', done: state.lessonsDone >= 1 },
    { id: 'streak3', title: 'Costanza', detail: 'Raggiungi una serie di 3 giorni', done: best >= 3 },
    { id: 'streak7', title: 'Settimana piena', detail: 'Raggiungi una serie di 7 giorni', done: best >= 7 },
    { id: 'xp100', title: 'Cento punti', detail: 'Guadagna 100 XP', done: xp >= 100 },
    { id: 'xp500', title: 'Cinquecento', detail: 'Guadagna 500 XP', done: xp >= 500 },
    { id: 'perfect5', title: 'Senza errori', detail: 'Completa 5 lezioni perfette', done: state.perfectLessons >= 5 },
  ]
}
