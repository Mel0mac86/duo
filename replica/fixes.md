# Fixes: what users dislike about the original, and what Parlami does about it

Date: 2026-10-06

## Sample size, honestly

**0 verbatim reviews collected.** This session's network blocks the App Store RSS feed,
Google Play, Reddit, change.org and the review aggregators, so `replica/reviews.csv` and
`reviews.py` could not be used. The evidence below comes from **web search results only**:
articles and review analyses that summarise user complaints. Quotes marked "quoted by" were
seen in those secondary sources, not checked against the original review. Treat every theme
as **thin** until it is re-run with real reviews (run `/replica-entrepreneur` from a
machine with open web access, or allow the hosts in the environment's network settings).

## 1. What they hate

| # | problem | evidence (secondary) |
| --- | --- | --- |
| H1 | The 2025 "energy" system: every exercise costs energy, correct or not, so free practice stops after ~15–20 minutes a day. Called the #1 recent complaint theme. | [myengineeringbuddy.com](https://www.myengineeringbuddy.com/blog/duolingo-reviews-pricing-alternatives-what-you-actually-need-to-know-in-2026/), [change.org petition "Hearts, not energy"](https://www.change.org/p/duolingo-hearts-not-energy), [unstar.app June 2026](https://unstar.app/events/duolingo-language-chess-complaints-june-2026) |
| H2 | Gamification over learning: long streaks but cannot hold a conversation; "tap matching words, not speak the language" (quoted by unstar.app). | [unstar.app analysis](https://unstar.app/fr/blog/language-learning-app-reviews-duolingo-babbel-rosetta-stone-2026) |
| H3 | Pushy streak notifications, "6 notifications a day" (quoted by unstar.app). | [unstar.app analysis](https://unstar.app/it/blog/education-learning-app-reviews-what-students-teachers-complain-about-2026) |
| H4 | Too many ads in the free version. | [unstar.app analysis](https://unstar.app/it/blog/education-learning-app-reviews-what-students-teachers-complain-about-2026) |
| H5 | Content quality after the "AI-first" shift: repetitive content, inaccurate translations. | [uxdesign.cc](https://uxdesign.cc/ai-first-did-duolingo-make-a-fatal-mistake-ed610df666d5), [elephas.app](https://elephas.app/blog/duolingo-goes-ai-first-how-the-language-app-is-changing-its-business-cma6apr4p001jg9xiptcvmpg4) |

## 2. What is missing

- Clear explanations of the grammar in a lesson ("lack of clear lessons").
- Real speaking practice.

## 3. What is unsolved

- Learners who want to study as long as they like for free, without a meter stopping them.
- Learners who want to reach conversation, not a streak number.

## Fix plan

| # | fix | size | answers | status |
| --- | --- | --- | --- | --- |
| P1 | No limits: hearts become optional (Settings), lessons never blocked when off | S | H1 | to build |
| P2 | Tips card before each lesson: the grammar of that lesson, in Italian | M | H2, missing explanations | to build |
| P3 | Speaking exercise: say the sentence, checked with the phone's speech recognition, skippable | M | H2 | to build |
| P4 | Gentle streak: one missed day a week does not break it; no notifications, ever | S | H3 | to build |
| P5 | "Segnala un errore" on every answer, opening a prefilled GitHub issue | S | H5 | to build |
| — | No ads, no paywall, no account | — | H4 | already true |

Note on H5: Parlami's own course sentences were written by an AI too and have not been
reviewed by native speakers. P5 is how that gets fixed over time.

## Angle

Options:

1. **Senza limiti.** For learners stopped by an energy meter, Parlami lets you study as long
   as you want, free, without ads. Evidence: H1, H4.
2. **Per parlare davvero.** For learners with a long streak and no conversation, Parlami
   explains each lesson and makes you speak. Evidence: H2.
3. **Senza sensi di colpa.** For learners tired of guilt-trip notifications, Parlami never
   nags. Evidence: H3.

Recommended: **1 + 2**: "Impara quanto vuoi, gratis, e parla davvero."
