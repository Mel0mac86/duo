import type { ReactNode } from 'react'
import type { Course } from '../types'

export type Tab = 'learn' | 'profile' | 'settings'

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 4h24a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6H18l-8 7v-7H8a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6z" fill="var(--accent)" />
      <circle cx="13" cy="17" r="3" fill="var(--on-accent)" />
      <circle cx="20" cy="17" r="3" fill="var(--on-accent)" />
      <circle cx="27" cy="17" r="3" fill="var(--xp)" />
    </svg>
  )
}

export function TopBar(props: { course: Course; streak: number; xp: number; hearts: number | null; onCourse: () => void }) {
  const { course, streak, xp, hearts, onCourse } = props
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="chip" onClick={onCourse} aria-label={`Corso: ${course.title}. Cambia corso`}>
          <span className="emoji" aria-hidden="true">{course.flag}</span>
        </button>
        <span className={`chip flame${streak ? '' : ' off'}`} title="Serie di giorni" data-testid="streak">
          <span className="emoji" aria-hidden="true">🔥</span>
          <span className="sr-only">Serie:</span>
          {streak}
        </span>
        <span className="chip xp" title="XP totali" data-testid="xp">
          <span className="emoji" aria-hidden="true">⭐</span>
          <span className="sr-only">XP totali:</span>
          {xp}
        </span>
        {hearts !== null && <span className="chip heart" title="Cuori" data-testid="hearts">
          <span className="emoji" aria-hidden="true">❤️</span>
          <span className="sr-only">Cuori:</span>
          {hearts}
        </span>}
      </div>
    </header>
  )
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'learn', label: 'Impara', emoji: '🏡' },
  { id: 'profile', label: 'Profilo', emoji: '🙂' },
  { id: 'settings', label: 'Impostazioni', emoji: '⚙️' },
]

export function TabBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Sezioni">
      {TABS.map((t) => (
        <a
          key={t.id}
          href={`#/${t.id}`}
          aria-current={tab === t.id ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault()
            onTab(t.id)
          }}
        >
          <span className="emoji" aria-hidden="true">{t.emoji}</span>
          {t.label}
        </a>
      ))}
    </nav>
  )
}

export function Modal({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label={label}>
        {children}
      </div>
    </div>
  )
}
