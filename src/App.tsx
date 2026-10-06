import { useCallback, useEffect, useState } from 'react'
import { allLessons, findLesson, getCourse } from './data/courses'
import { buildLesson, buildPractice, seededRng } from './lib/lesson'
import type { Run } from './lib/lesson'
import * as store from './lib/store'
import type { Completion } from './lib/store'
import type { Exercise, LessonResult, SaveState } from './types'
import { Onboarding } from './screens/Onboarding'
import { Learn } from './screens/Learn'
import { Lesson } from './screens/Lesson'
import { Complete } from './screens/Complete'
import { Profile } from './screens/Profile'
import { Settings } from './screens/Settings'
import { OutOfHearts } from './screens/OutOfHearts'
import { TopBar, TabBar } from './components/Chrome'
import type { Tab } from './components/Chrome'
import { sfx } from './lib/sound'
import { useNow } from './lib/useNow'

type Route =
  | { name: 'tab' }
  | { name: 'lesson'; lessonId: string | null; exercises: Exercise[]; startedAt: number; seed: number }
  | { name: 'complete'; completion: Completion; result: LessonResult }
  | { name: 'no-hearts' }

function readTab(): Tab {
  const h = location.hash.replace(/^#\/?/, '')
  return h === 'profile' || h === 'settings' ? h : 'learn'
}

export default function App() {
  const [state, setState] = useState<SaveState>(() => store.load())
  const [route, setRoute] = useState<Route>({ name: 'tab' })
  const [tab, setTab] = useState<Tab>(readTab)
  const now = useNow(1000)

  const update = useCallback((fn: (s: SaveState) => SaveState) => {
    setState((prev) => {
      const next = fn(prev)
      store.save(next)
      return next
    })
  }, [])

  useEffect(() => {
    const onHash = () => setTab(readTab())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // hearts refill while the app is open
  useEffect(() => {
    if (state.hearts < store.MAX_HEARTS && store.msToNextHeart(state, now) === 0) update((s) => store.refillHearts(s, now))
  }, [now, state, update])

  const course = getCourse(state.courseId)

  if (!course) {
    return (
      <Onboarding
        initialGoal={state.dailyGoal}
        onDone={(courseId, dailyGoal) => update((s) => ({ ...s, courseId, dailyGoal }))}
      />
    )
  }

  const progress = store.progressFor(state, course.id)

  const startLesson = (lessonId: string) => {
    const lesson = findLesson(course, lessonId)
    if (!lesson) return
    if (store.refillHearts(state, Date.now()).hearts <= 0) {
      setRoute({ name: 'no-hearts' })
      return
    }
    const seed = Date.now()
    const exercises = buildLesson(course, lesson, seededRng(seed))
    setRoute({ name: 'lesson', lessonId, exercises, startedAt: Date.now(), seed })
  }

  const startPractice = () => {
    const seed = Date.now()
    const exercises = buildPractice(course, progress.completed, progress.mistakes, seededRng(seed))
    if (!exercises.length) return
    setRoute({ name: 'lesson', lessonId: null, exercises, startedAt: Date.now(), seed })
  }

  const go = (t: Tab) => {
    location.hash = `/${t}`
    setTab(t)
    setRoute({ name: 'tab' })
  }

  if (route.name === 'lesson') {
    const practice = route.lessonId === null
    const finish = (run: Run) => {
      const result: LessonResult = {
        courseId: course.id,
        lessonId: route.lessonId,
        practice,
        mistakes: run.mistakes,
        total: run.total,
        ms: Date.now() - route.startedAt,
      }
      const completion = store.completeLesson(state, result, Date.now())
      update(() => completion.state)
      if (state.sound) sfx.done()
      setRoute({ name: 'complete', completion, result })
    }
    return (
      <Lesson
        key={route.seed}
        course={course}
        exercises={route.exercises}
        practice={practice}
        hearts={state.hearts}
        sound={state.sound}
        onWrong={(ex) => update((s) => {
          const marked = store.recordMistake(s, course.id, ex)
          return practice ? marked : store.loseHeart(marked, Date.now())
        })}
        onRight={(ex) => { if (practice) update((s) => store.clearMistake(s, course.id, ex.id)) }}
        onFinish={finish}
        onQuit={() => setRoute({ name: 'tab' })}
        onOutOfHearts={() => setRoute({ name: 'no-hearts' })}
      />
    )
  }

  if (route.name === 'complete') {
    return (
      <Complete
        completion={route.completion}
        result={route.result}
        streak={store.currentStreak(route.completion.state, now)}
        onContinue={() => go('learn')}
      />
    )
  }

  const openLessons = allLessons(course).map((l) => l.id)
  const canPractice = progress.mistakes.length > 0 || progress.completed.length > 0

  return (
    <div className="shell">
      <TopBar
        course={course}
        streak={store.currentStreak(state, now)}
        xp={store.totalXp(state)}
        hearts={state.hearts}
        onCourse={() => go('settings')}
      />
      <main className="page" id="main">
        {tab === 'learn' && (
          <Learn
            course={course}
            completed={progress.completed}
            order={openLessons}
            xpToday={store.xpToday(state, now)}
            dailyGoal={state.dailyGoal}
            mistakes={progress.mistakes.length}
            canPractice={canPractice}
            onStart={startLesson}
            onPractice={startPractice}
          />
        )}
        {tab === 'profile' && <Profile state={state} course={course} now={now} />}
        {tab === 'settings' && (
          <Settings
            state={state}
            onChange={(patch) => update((s) => ({ ...s, ...patch }))}
            onReset={() => {
              update(() => store.fresh())
              go('learn')
            }}
          />
        )}
      </main>
      <TabBar tab={tab} onTab={go} />
      {route.name === 'no-hearts' && (
        <OutOfHearts
          msLeft={store.msToNextHeart(state, now)}
          hearts={state.hearts}
          canPractice={canPractice}
          onPractice={startPractice}
          onClose={() => setRoute({ name: 'tab' })}
        />
      )}
    </div>
  )
}
