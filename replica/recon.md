# Recon map: Duolingo (web + mobile)

Scope: the core learning loop — pick a course, follow a path of lessons, answer
short exercises, earn XP, keep a streak, lose hearts on mistakes, review mistakes.
For: Italian speakers learning English (first course) and Spanish (second course).
Date: 2026-10-06

Clean-room note: this map describes *what the app does and how a user moves
through it*, from public knowledge of the product (marketing site, help center,
store listings, public walkthroughs). No code, assets, copy, mascot, sounds or
course content of the original were used. All course sentences in the clone
are written fresh.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | marketing site | https://www.duolingo.com | positioning, core loop |
| 2 | help center | https://support.duolingo.com | hearts, streaks, XP, leagues, practice |
| 3 | App Store listing | https://apps.apple.com/app/id570060128 | key screens, pitch |
| 4 | Google Play listing | https://play.google.com/store/apps/details?id=com.duolingo | key screens |
| 5 | public walkthrough videos | (YouTube, "Duolingo first lesson") | lesson flow click by click |

No screenshots of the original were saved (`replica/screens/` is empty), so the
layout diff in replica-diff is not run; parity is feature-based only.

## Core loop

Do a 2–3 minute lesson every day: answer a dozen bite-sized exercises, earn XP,
keep the streak alive.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Onboarding | first launch | pick the course and a daily goal | course cards, goal options, primary button | first run |
| S02 | Learn path | home tab | units with a vertical path of lesson nodes | top bar (course, streak, XP, hearts), unit header, lesson node, bottom nav | locked, current, completed, unit done, course done |
| S03 | Lesson | tap the current node → start | run one lesson of exercises | progress bar, hearts, exercise body, check footer, feedback sheet | unanswered, answered, correct, wrong, last exercise |
| S04 | Lesson complete | end of lesson | reward and stats | XP earned, accuracy, time, streak flame, continue | first lesson of the day (streak +1), perfect lesson |
| S05 | Out of hearts | 0 hearts during a lesson or when opening a lesson | stop and offer a way back | modal, refill timer, practice button | — |
| S06 | Quit lesson | close button in a lesson | confirm losing progress | modal, keep going / quit | — |
| S07 | Practice | practice button on the path | review past mistakes, regain a heart | same as S03 | no mistakes yet (empty) |
| S08 | Profile | profile tab | stats and achievements | stat tiles, 7-day XP chart, achievement list | new user (empty), active user |
| S09 | Settings | gear on profile | daily goal, sound, course, reset | toggles, radio list, danger button | — |
| S10 | Leaderboard | leagues tab | weekly ranking against other learners | ranked list | needs other real users |

## Flows

```
F01 First lesson (new learner)
    S01 pick course -> S01 pick goal -> S02 -> S03 (n exercises) -> S04 -> S02
    happy path clicks: 3 to start the lesson
    edge: refresh mid-onboarding, refresh mid-lesson (lesson restarts)

F02 Daily lesson (returning learner)
    S02 tap current node -> S03 -> S04 (streak +1 if first today) -> S02 (next node unlocked)
    edge: streak broken (a day missed), day boundary while in lesson

F03 Answer an exercise
    S03 choose/type/tap -> Check -> feedback (correct | wrong + right answer) -> Continue
    edge: check disabled until an answer exists, wrong answer requeued at end,
          typos / case / punctuation forgiven, accents

F04 Run out of hearts
    S03 wrong answer at 1 heart -> S05 -> S07 practice (+1 heart) | wait for refill -> S02

F05 Review mistakes
    S02 practice -> S07 -> S04 (+heart)
    edge: no mistakes yet

F06 Check progress
    S02 -> S08 -> S09 change goal / switch course / reset
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary, secondary, ghost, danger, success | default, hover, active (pressed), focus, disabled | all |
| Choice card | text, emoji+text | default, selected, correct, wrong, disabled | S03 |
| Word tile | bank, answer | default, used (ghost), focus | S03 |
| Match tile | — | default, selected, matched, wrong flash | S03 |
| Progress bar | lesson, goal | 0–100% | S03, S02, S08 |
| Lesson node | — | locked, current, completed | S02 |
| Stat chip | streak, XP, hearts, gems | active, inactive | S02, S03 |
| Feedback sheet | correct, wrong | — | S03 |
| Modal | info, confirm | open/closed | S05, S06 |
| Bottom nav | 3–5 tabs | active | S02, S08 |

## Inferred data model

```
Course      id, from_lang, to_lang, title, units[]
            evidence: course picker, help center "switch courses"   confidence: high
Unit        id, title, description, lessons[]
            evidence: path headers                                   confidence: high
Lesson      id, title, exercises[]                                   confidence: high
Exercise    type (select | build | type | match | listen), prompt, answer(s), options
            evidence: walkthroughs                                   confidence: high
Progress    user, course_id, completed lesson ids, xp per day, streak, last active day,
            hearts, hearts_updated_at, mistakes[], daily_goal
            evidence: profile, help center "hearts", "streaks"       confidence: medium
```

Relationships: Course 1-n Unit 1-n Lesson 1-n Exercise; User 1-n Progress (one per course).

## Feature matrix

See `features.csv`. Counted: must 17, should 8, could 3. Skipped on purpose: 5.

## Out of scope (cannot or should not be cloned)

- the course content itself (their sentences, audio recordings, illustrations, mascot)
- the network: leagues and friends need real other users
- AI video call / Max features (licensed models + their prompts)
- in-app currency store and ads (business model, not learning)
- the Duolingo English Test (a certified exam)

## Size

Screens 10, flows 6, entities 5. Hard parts: answer checking that forgives
typos and accents, the requeue logic for wrong answers, streak/day-boundary
math, speech synthesis availability. Size: M as a web app with local storage;
L with accounts, sync and leagues.
