import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { allLessons, english } from '../src/data/courses'
import { arabic, chinese, hindi, polish } from '../src/data/languages'
import type { Course } from '../src/types'

// A solver that answers like a learner who knows the course, using only what is on screen.
let course: Course = english
const words = () => allLessons(course).flatMap((l) => l.words)
const sentences = () => allLessons(course).flatMap((l) => l.sentences)
const squash = (t: string) => t.replace(/\s+/g, '')
const tiles = (s: string, locale: string) =>
  s.replace(/[.,!?¡¿;:"。，、！？،؟।]/g, ' ').split(/\s+/).filter(Boolean).map((t, i) => (i === 0 && t !== 'I' ? t.toLocaleLowerCase(locale) : t))

test.beforeEach(() => { course = english })

test.beforeEach(async ({ page }) => {
  // A stand-in for the phone's speech recognition: it "hears" the sentence on screen,
  // or whatever a test puts in window.__say.
  await page.addInitScript(() => {
    class FakeRecognition {
      onresult: ((e: unknown) => void) | null = null
      onerror: ((e: unknown) => void) | null = null
      onend: (() => void) | null = null
      start() {
        setTimeout(() => {
          const w = window as unknown as { __say?: string }
          const said = w.__say ?? document.querySelector('[data-testid=prompt]')?.textContent ?? ''
          this.onresult?.({ results: [[{ transcript: said }]] })
          this.onend?.()
        }, 30)
      }
      abort() {}
    }
    const w = window as unknown as { SpeechRecognition: unknown; webkitSpeechRecognition: unknown }
    w.SpeechRecognition = FakeRecognition
    w.webkitSpeechRecognition = FakeRecognition
  })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('fonts.g')) errors.push(m.text()) })
  // @ts-expect-error stash for afterEach
  page.__errors = errors
})

test.afterEach(async ({ page }) => {
  // @ts-expect-error stash from beforeEach
  expect(page.__errors).toEqual([])
})

async function onboard(page: Page, course = 'Inglese') {
  await page.goto('./')
  await page.getByRole('radio', { name: new RegExp(course) }).click()
  await page.getByRole('button', { name: 'Continua' }).click()
  await page.getByRole('radio', { name: /Tranquillo/ }).click()
  await page.getByRole('button', { name: 'Inizia a imparare' }).click()
}

/** Opens a lesson node, going past the tips page when it is shown. */
async function openLesson(page: Page, name = 'Saluti, da fare') {
  await page.getByRole('button', { name }).click()
  const start = page.getByRole('button', { name: 'Inizia la lezione' })
  if (await start.isVisible({ timeout: 2000 }).catch(() => false)) await start.click()
}

async function enableHearts(page: Page) {
  await page.getByRole('link', { name: 'Impostazioni' }).click()
  await page.getByLabel(/Cuori \(modalità sfida\)/).check()
  await page.getByRole('link', { name: 'Impara' }).click()
}

async function clickTiles(page: Page, answer: string, locale: string) {
  for (const t of tiles(answer, locale)) {
    await page.getByTestId('bank').getByRole('button', { name: t, exact: true }).first().click()
  }
}

/** Answers the exercise on screen. `wrong` deliberately fails it. Returns false if there is none. */
async function answer(page: Page, wrong = false): Promise<boolean> {
  const title = (await page.locator('.ex-title').textContent({ timeout: 5000 }).catch(() => null)) ?? ''
  if (!title) return false
  if (title === 'Prima di iniziare') {
    await page.getByRole('button', { name: 'Inizia la lezione' }).click()
    return answer(page, wrong)
  }

  if (title === 'Leggi ad alta voce') {
    if (wrong) await page.evaluate(() => { (window as unknown as { __say?: string }).__say = 'zzz qqq www' })
    await page.getByRole('button', { name: 'Tocca e parla' }).click()
    await expect(page.getByText(/Hai detto/)).toBeVisible()
    await page.evaluate(() => { delete (window as unknown as { __say?: string }).__say })
  } else if (title.startsWith('Quale di questi')) {
    const native = title.match(/«(.+)»/)![1]
    const target = words().find((w) => w.native === native)!.target
    const options = page.locator('.choice')
    const right = page.getByText(target, { exact: true })
    if (wrong) await options.filter({ hasNot: right }).first().click()
    else await options.filter({ has: right }).first().click()
  } else if (title === 'Abbina le coppie') {
    const left = page.getByRole('group', { name: 'Italiano' }).getByRole('button')
    const n = await left.count()
    for (let i = 0; i < n; i++) {
      const b = left.nth(i)
      const native = (await b.textContent())!.trim()
      const target = words().find((w) => w.native === native)!.target
      await b.click()
      await page.getByRole('group', { name: course.title }).getByRole('button').filter({ has: page.getByText(target, { exact: true }) }).click()
    }
    await expect(page.getByRole('button', { name: 'Continua' })).toBeVisible()
    return true
  } else if (title === 'Scrivi ciò che senti') {
    await page.getByRole('button', { name: 'Non posso ascoltare ora' }).click().catch(() => {})
    const text = (await page.getByTestId('listen-text').textContent())!.trim()
    const heard = sentences().find((x) => squash(x.target) === squash(text))!.target
    if (wrong) await page.getByTestId('bank').getByRole('button').first().click()
    else await clickTiles(page, heard, course.targetLang)
  } else if (title === 'Traduci questa frase') {
    const prompt = (await page.getByTestId('prompt').textContent())!.trim()
    const toTarget = sentences().find((x) => x.native === prompt)
    const sentence = toTarget ? toTarget.target : sentences().find((x) => squash(x.target) === squash(prompt))!.native
    if (wrong) await page.getByTestId('bank').getByRole('button').last().click()
    else await clickTiles(page, sentence, toTarget ? course.targetLang : course.nativeLang)
  } else if (title.startsWith('Scrivi in')) {
    const prompt = (await page.getByTestId('prompt').textContent())!.trim()
    const s = sentences().find((x) => x.native === prompt)!
    await page.getByLabel('La tua traduzione').fill(wrong ? 'banana' : s.target.toLowerCase().replace(/[.!?]/g, ''))
  }
  await page.getByRole('button', { name: 'Verifica' }).click()
  await expect(page.getByRole('heading', { name: wrong ? /Risposta corretta/ : /Ottimo|Perfetto|Esatto|Bravissimo|Ben fatto/ })).toBeVisible()
  return true
}

async function finishLesson(page: Page) {
  for (let i = 0; i < 30; i++) {
    if (!(await answer(page))) break
    await page.getByRole('button', { name: 'Continua' }).click()
    if (await page.getByText(/Lezione (perfetta|completata)|Ripasso completato/).isVisible()) return
  }
  await expect(page.getByText(/Lezione (perfetta|completata)|Ripasso completato/)).toBeVisible()
}

test('F01 a new learner finishes the first lesson: XP, streak, next lesson unlocked', async ({ page }) => {
  await onboard(page)
  await expect(page.getByRole('button', { name: 'Saluti, da fare' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Persone, bloccata' })).toBeDisabled()
  await expect(page.getByTestId('goal')).toHaveText('0 / 10 XP')

  await page.getByRole('button', { name: 'Saluti, da fare' }).click()
  await finishLesson(page)
  await expect(page.getByRole('heading', { name: 'Lezione perfetta!' })).toBeVisible()
  await expect(page.getByTestId('earned-xp')).toHaveText('+15')
  await expect(page.getByTestId('streak-up')).toContainText('Serie di 1 giorno')

  await page.getByRole('button', { name: 'Continua' }).click()
  await expect(page.getByRole('button', { name: 'Saluti, completata' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Persone, da fare' })).toBeEnabled()
  await expect(page.getByTestId('xp')).toContainText('15')
  await expect(page.getByTestId('streak')).toContainText('1')

  // progress survives a reload
  await page.reload()
  await expect(page.getByRole('button', { name: 'Persone, da fare' })).toBeEnabled()
  await expect(page.getByTestId('goal')).toHaveText('10 / 10 XP')
})

test('F03 with hearts on, a wrong answer costs a heart and comes back later', async ({ page }) => {
  await onboard(page)
  await enableHearts(page)
  await openLesson(page)
  await expect(page.getByTestId('lesson-hearts')).toContainText('5')
  await answer(page, true)
  await expect(page.getByTestId('lesson-hearts')).toContainText('4')
  await page.getByRole('button', { name: 'Continua' }).click()
  await finishLesson(page)
  await expect(page.getByRole('heading', { name: 'Lezione completata!' })).toBeVisible()
  await expect(page.getByTestId('earned-xp')).toHaveText('+10')
  await page.getByRole('button', { name: 'Continua' }).click()
  // the mistake is now in practice
  await expect(page.getByText('1 errori da rivedere')).toBeVisible()
})

test('F03 Check is disabled until there is an answer; Enter checks', async ({ page }) => {
  await onboard(page)
  await openLesson(page)
  await expect(page.getByRole('button', { name: 'Verifica' })).toBeDisabled()
  await page.keyboard.press('1')
  await expect(page.getByRole('button', { name: 'Verifica' })).toBeEnabled()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Continua' })).toBeVisible()
})

test('F04 out of hearts: blocked, then practice gives one back', async ({ page }) => {
  await onboard(page)
  await enableHearts(page)
  await openLesson(page)
  // matching pairs cannot be failed, so keep answering wrong until the hearts run out
  for (let i = 0; i < 10 && !(await page.getByRole('dialog').isVisible()); i++) {
    await answer(page, true)
    await page.getByRole('button', { name: 'Continua' }).click()
  }
  await expect(page.getByRole('dialog', { name: 'Cuori esauriti' })).toBeVisible()
  await expect(page.getByTestId('refill')).toHaveText(/^(29|30):\d\d$/)
  await page.getByRole('button', { name: 'Più tardi' }).click()
  await expect(page.getByTestId('hearts')).toContainText('0')

  // a lesson cannot start with no hearts
  await page.getByRole('button', { name: 'Saluti, da fare' }).click()
  await expect(page.getByRole('dialog', { name: 'Cuori esauriti' })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: /Ripassa/ }).click()
  await finishLesson(page)
  await expect(page.getByRole('heading', { name: 'Ripasso completato!' })).toBeVisible()
  await page.getByRole('button', { name: 'Continua' }).click()
  await expect(page.getByTestId('hearts')).toContainText('1')
})

test('F02 quitting a lesson asks first and keeps nothing', async ({ page }) => {
  await onboard(page)
  await openLesson(page)
  await page.getByRole('button', { name: 'Esci dalla lezione' }).click()
  await page.getByRole('button', { name: 'Continua la lezione' }).click()
  await expect(page.locator('.ex-title')).toBeVisible()
  await page.getByRole('button', { name: 'Esci dalla lezione' }).click()
  await page.getByRole('button', { name: 'Esci', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saluti, da fare' })).toBeVisible()
  await expect(page.getByTestId('xp')).toContainText('0')
})

test('F06 profile, settings: switch course, change goal, reset', async ({ page }) => {
  await onboard(page)
  await page.getByRole('link', { name: 'Profilo' }).click()
  await expect(page.getByRole('heading', { name: 'Il tuo profilo' })).toBeVisible()
  await expect(page.getByTestId('total-xp')).toHaveText('0')
  await page.getByRole('link', { name: 'Impostazioni' }).click()
  await page.getByRole('radio', { name: /Spagnolo/ }).click()
  await page.getByRole('radio', { name: /Intenso/ }).click()
  await page.getByRole('link', { name: 'Impara' }).click()
  await expect(page.getByRole('heading', { name: /Unità 2: Intorno a me/ })).toBeVisible()
  await expect(page.getByTestId('goal')).toHaveText('0 / 50 XP')
  await page.getByRole('link', { name: 'Impostazioni' }).click()
  await page.getByRole('button', { name: 'Azzera i progressi' }).click()
  await page.getByRole('button', { name: 'Azzera', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Che lingua vuoi imparare?' })).toBeVisible()
})

test('typed answers forgive case and punctuation', async ({ page }) => {
  await onboard(page)
  await openLesson(page)
  // walk to the typing exercise
  for (let i = 0; i < 12; i++) {
    const title = await page.locator('.ex-title').textContent()
    if (title?.startsWith('Scrivi in')) break
    await answer(page)
    await page.getByRole('button', { name: 'Continua' }).click()
  }
  await expect(page.locator('.ex-title')).toHaveText('Scrivi in inglese')
  await page.getByLabel('La tua traduzione').fill('GOOD NIGHT mum')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /Ottimo|Perfetto|Esatto|Bravissimo|Ben fatto/ })).toBeVisible()
})

for (const c of [polish, chinese, arabic, hindi]) {
  test(`a full first lesson in ${c.title}`, async ({ page }) => {
    course = c
    await onboard(page, c.title)
    await page.getByRole('button', { name: 'Saluti, da fare' }).click()
    await finishLesson(page)
    await expect(page.getByRole('heading', { name: 'Lezione perfetta!' })).toBeVisible()
    await page.getByRole('button', { name: 'Continua' }).click()
    await expect(page.getByRole('button', { name: 'Persone, da fare' })).toBeEnabled()
  })
}

test('P1 hearts are off by default: mistakes never stop you', async ({ page }) => {
  await onboard(page)
  await expect(page.getByTestId('hearts')).toHaveCount(0)
  await openLesson(page)
  await expect(page.getByTestId('lesson-hearts')).toHaveCount(0)
  for (let i = 0; i < 7; i++) {
    await answer(page, true)
    await page.getByRole('button', { name: 'Continua' }).click()
  }
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await finishLesson(page)
  await expect(page.getByRole('heading', { name: 'Lezione completata!' })).toBeVisible()
})

test('P2 tips show before a new lesson, once, and stay one tap away', async ({ page }) => {
  await onboard(page)
  await page.getByRole('button', { name: 'Saluti, da fare' }).click()
  await expect(page.getByRole('heading', { name: 'Prima di iniziare' })).toBeVisible()
  await expect(page.getByText(/My name is/)).toBeVisible()
  await page.getByRole('button', { name: 'Inizia la lezione' }).click()
  await page.getByRole('button', { name: 'Suggerimenti della lezione' }).click()
  await expect(page.getByRole('dialog', { name: 'Suggerimenti' })).toBeVisible()
  await page.getByRole('button', { name: 'Ho capito' }).click()
  await page.getByRole('button', { name: 'Esci dalla lezione' }).click()
  await page.getByRole('button', { name: 'Esci', exact: true }).click()
  // second time: straight into the exercises
  await page.getByRole('button', { name: 'Saluti, da fare' }).click()
  await expect(page.getByRole('heading', { name: 'Prima di iniziare' })).toHaveCount(0)
  await expect(page.locator('.ex-title')).toContainText('Quale di questi')
})

test('P3 speaking: right, wrong and skip', async ({ page }) => {
  await onboard(page)
  await openLesson(page)
  for (let i = 0; i < 12; i++) {
    if ((await page.locator('.ex-title').textContent()) === 'Leggi ad alta voce') break
    await answer(page)
    await page.getByRole('button', { name: 'Continua' }).click()
  }
  await expect(page.locator('.ex-title')).toHaveText('Leggi ad alta voce')
  await answer(page, true)
  await page.getByRole('button', { name: 'Continua' }).click()
  // the sentence comes back; this time skip it
  await expect(page.locator('.ex-title')).toHaveText('Leggi ad alta voce')
  await page.getByRole('button', { name: 'Non posso parlare ora' }).click()
  await expect(page.getByRole('heading', { name: /Nessun problema/ })).toBeVisible()
})

test('P5 every answer can be reported as a content error', async ({ page }) => {
  await onboard(page)
  await openLesson(page)
  await answer(page, true)
  const link = page.getByRole('link', { name: 'Segnala un errore' })
  await expect(link).toHaveAttribute('href', /github\.com\/Mel0mac86\/duo\/issues\/new\?title=.*en-u1-l1/)
  await expect(link).toHaveAttribute('target', '_blank')
})
