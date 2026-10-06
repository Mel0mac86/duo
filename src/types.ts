export interface Word {
  native: string
  target: string
  emoji: string
  /** romanization of the target word (non-Latin scripts) */
  roman?: string
}

export interface Sentence {
  native: string
  target: string
  /** other accepted translations into the target language */
  targetAlts?: string[]
  /** other accepted translations into the native language */
  nativeAlts?: string[]
  /** romanization of the target sentence (non-Latin scripts) */
  roman?: string
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
  /** target written without spaces between words; spaces in the data only split tiles */
  compact?: boolean
  /** target not written in the Latin alphabet: no typing exercise */
  nonLatin?: boolean
  /** target written right to left */
  rtl?: boolean
  units: Unit[]
}

interface ExerciseBase {
  id: string
  lessonId: string
}

export interface SelectExercise extends ExerciseBase {
  type: 'select'
  prompt: string
  options: { text: string; emoji: string; roman?: string }[]
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
  /** romanization of the target sentence shown or spoken */
  roman?: string
  compact?: boolean
}

export interface TypeExercise extends ExerciseBase {
  type: 'type'
  prompt: string
  lang: 'target' | 'native'
  answers: string[]
  compact?: boolean
}

export interface MatchExercise extends ExerciseBase {
  type: 'match'
  pairs: { native: string; target: string; roman?: string }[]
}

export interface SpeakExercise extends ExerciseBase {
  type: 'speak'
  /** target sentence to read aloud */
  prompt: string
  roman?: string
  answers: string[]
  compact?: boolean
}

export type Exercise = SelectExercise | BuildExercise | TypeExercise | MatchExercise | SpeakExercise

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
  /** hearts are optional: off means no limit on mistakes or lessons */
  heartsOn: boolean
  /** speaking exercises, when the device can recognise speech */
  speakOn: boolean
  /** the last missed day the weekly free day covered, 'YYYY-MM-DD' */
  freeDayUsed: string | null
  /** lessons whose tips were already shown */
  tipsSeen: string[]
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
