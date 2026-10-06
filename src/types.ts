export interface Word {
  native: string
  target: string
  emoji: string
}

export interface Sentence {
  native: string
  target: string
  /** other accepted translations into the target language */
  targetAlts?: string[]
  /** other accepted translations into the native language */
  nativeAlts?: string[]
}

export interface LessonDef {
  id: string
  title: string
  words: Word[]
  sentences: Sentence[]
}

export interface Unit {
  id: string
  title: string
  description: string
  lessons: LessonDef[]
}

export interface Course {
  id: string
  /** BCP-47 tag used for speech synthesis and the `lang` attribute */
  targetLang: string
  nativeLang: string
  title: string
  targetName: string
  flag: string
  units: Unit[]
}

interface ExerciseBase {
  id: string
  lessonId: string
}

export interface SelectExercise extends ExerciseBase {
  type: 'select'
  prompt: string
  options: { text: string; emoji: string }[]
  answer: string
}

export interface BuildExercise extends ExerciseBase {
  type: 'build' | 'listen'
  /** sentence shown to the learner (empty for listen) */
  prompt: string
  /** what gets spoken (listen) */
  audio?: string
  /** language the learner builds in */
  lang: 'target' | 'native'
  tiles: string[]
  answers: string[]
}

export interface TypeExercise extends ExerciseBase {
  type: 'type'
  prompt: string
  lang: 'target' | 'native'
  answers: string[]
}

export interface MatchExercise extends ExerciseBase {
  type: 'match'
  pairs: { native: string; target: string }[]
}

export type Exercise = SelectExercise | BuildExercise | TypeExercise | MatchExercise

export interface CourseProgress {
  completed: string[]
  mistakes: Exercise[]
}

export interface SaveState {
  version: 1
  courseId: string | null
  dailyGoal: number
  sound: boolean
  courses: Record<string, CourseProgress>
  xpByDay: Record<string, number>
  streak: number
  lastActiveDay: string | null
  hearts: number
  heartsUpdatedAt: number
  lessonsDone: number
  perfectLessons: number
}

export interface LessonResult {
  courseId: string
  lessonId: string | null
  practice: boolean
  mistakes: number
  total: number
  ms: number
}
