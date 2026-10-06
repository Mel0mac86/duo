# Architecture: Parlami (a rebuild of Duolingo's core learning loop)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Vite + React 19 + TypeScript | static build, runs anywhere, no server needed for the core loop |
| styling | plain CSS with custom properties from `replica/design/tokens.json` | tokens only, no framework to learn |
| data | `src/lib/store.ts` over `localStorage` | progress is per-device; the same function signatures can be backed by Supabase later |
| content | `src/data/courses.ts`, typed, written fresh | courses ship with the bundle |
| audio | Web Speech API (`speechSynthesis`) + WebAudio beeps | no recorded audio to license; hidden when unsupported |
| tests | Vitest (logic) + Playwright (flows) | |
| hosting | any static host (GitHub Pages, Netlify, Vercel) | `vite build` → `dist/`, relative base |

One app, no backend. Accounts, sync and leagues are the "L" upgrade (see Build order 4).

## Schema

No database yet. The persisted shape (`localStorage["parlami:v1"]`):

```ts
interface SaveState {
  courseId: string | null
  dailyGoal: number            // XP per day: 10 | 20 | 30 | 50
  sound: boolean
  courses: Record<string, {
    completed: string[]        // lesson ids
    mistakes: Exercise[]       // last 20 exercises answered wrong
  }>
  xpByDay: Record<string, number>  // 'YYYY-MM-DD' (local) -> XP
  streak: number
  lastActiveDay: string | null
  hearts: number               // 0..5
  heartsUpdatedAt: number      // ms, refill 1 heart / 30 min
  lessonsDone: number
  perfectLessons: number
}
```

When a server is added, this maps to tables `users`, `progress(user_id, course_id, completed[])`,
`xp_events(user_id, day, xp)`, `mistakes(user_id, exercise jsonb)`.

## API (data layer, `src/lib/store.ts`)

| function | does | flow |
| --- | --- | --- |
| `load()` / `save(state)` | read / write local storage, migrate, repair | all |
| `refillHearts(state, now)` | +1 heart per 30 min up to 5 | F04 |
| `loseHeart(state, now)` | -1 heart, start refill clock | F03, F04 |
| `completeLesson(state, result, now)` | XP, streak, completed list, mistakes, stats | F02 |
| `currentStreak(state, now)` | 0 if yesterday was missed | F02, S08 |
| `isUnlocked(course, done, lessonId)` | first not-completed lesson and all before it | S02 |

Answer checking lives in `src/lib/answers.ts`: normalise (case, punctuation,
accents, apostrophes, spaces), accept alternatives, one-typo tolerance on
answers longer than 4 letters (flagged as "watch the spelling").

## The parts that bite

- days: streak and XP use the learner's *local* date, never UTC
- refresh mid-lesson: lesson restarts, nothing half-saved
- speech synthesis: missing on some browsers, so listen exercises degrade to a
  build exercise with the sentence shown
- requeue: a wrong answer goes to the end of the queue once per exercise;
  the lesson ends only when every exercise has been answered right

## Build order

1. Vertical slice: S02 → S03 (select) → S04, store, one course
2. Must-haves: all exercise types, hearts, streak, XP, onboarding, persistence
3. Should-haves: practice, profile, settings, second course, listen, quit modal
4. Later: accounts + sync (Supabase), leagues
