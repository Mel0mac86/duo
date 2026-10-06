import { test } from '@playwright/test'

// Saves reference screenshots of the clone for replica-diff. Run: SCREENS=1 npx playwright test screens
test.skip(!process.env.SCREENS, 'set SCREENS=1 to capture screenshots')

test('capture screens', async ({ page }, info) => {
  const tag = info.project.name
  const shot = (id: string) => page.screenshot({ path: `replica/clone-screens/${id}-${tag}.png` })
  await page.goto('./')
  await shot('S01')
  await page.getByRole('radio', { name: /Inglese/ }).click()
  await page.getByRole('button', { name: 'Continua' }).click()
  await page.getByRole('button', { name: 'Inizia a imparare' }).click()
  await shot('S02')
  await page.getByRole('button', { name: 'Saluti, da fare' }).click()
  await shot('S03-select')
  await page.locator('.choice').first().click()
  await page.getByRole('button', { name: 'Verifica' }).click()
  await shot('S03-feedback')
  await page.getByRole('button', { name: 'Continua' }).click()
  await page.getByRole('button', { name: 'Esci dalla lezione' }).click()
  await shot('S06')
  await page.getByRole('button', { name: 'Esci', exact: true }).click()
  await page.getByRole('link', { name: 'Profilo' }).click()
  await shot('S08')
  await page.getByRole('link', { name: 'Impostazioni' }).click()
  await shot('S09')
})
