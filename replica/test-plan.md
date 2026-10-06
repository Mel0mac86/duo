# Test plan: Parlami

Automated: `npm test` (Vitest, 25 cases on answers, lesson queue, streak, hearts, storage)
and `npm run e2e` (Playwright, 7 flows × desktop 1440px + mobile Pixel 7 = 14 runs).
Every e2e spec fails on any page error or console error.

| case | what | how |
| --- | --- | --- |
| F01-H1 | new learner: pick course and goal, finish lesson 1, perfect bonus, streak 1, lesson 2 unlocks, survives reload | e2e |
| F02-H1 | quit a lesson: confirm modal, "keep going" returns, "quit" keeps no XP | e2e |
| F02-E1 | streak across days, same day twice, a missed day, month end and DST | unit |
| F03-H1 | Check disabled until an answer, keys 1–3 pick, Enter checks | e2e |
| F03-N1 | wrong answer: −1 heart, correct answer shown, exercise comes back, no perfect bonus, saved to practice | e2e + unit |
| F03-E1 | typed answer: case, punctuation, contractions, accents (flagged), one typo in a long word (flagged); short-word errors rejected | e2e + unit |
| F03-E2 | every generated exercise in both courses is answerable from its own tiles / options | unit |
| F04-H1 | 0 hearts: modal with refill timer, lessons blocked, practice gives +1 heart | e2e |
| F04-E1 | hearts refill 1 per 30 min, cap 5, never below 0 | unit |
| F05-E1 | practice with no history is empty (no button shown) | unit |
| F06-H1 | profile stats, switch course, change goal, reset everything | e2e |
| X-E1 | corrupt local storage loads a fresh state instead of crashing | unit |

Manual (not automatable here): speech voices on real devices, sound effects audible, iOS Safari safe areas.
