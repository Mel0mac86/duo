// Answer checking: forgive case, punctuation, contractions, accents and small typos.

const CONTRACTIONS: [RegExp, string][] = [
  [/\bi'm\b/g, 'i am'],
  [/\b(you|we|they)'re\b/g, '$1 are'],
  [/\b(he|she|it|that|where|what|who|there)'s\b/g, '$1 is'],
  [/\b(i|you|we|they)'ve\b/g, '$1 have'],
  [/\b(i|you|he|she|we|they)'d\b/g, '$1 would'],
  [/\b(i|you|he|she|it|we|they)'ll\b/g, '$1 will'],
  [/\blet's\b/g, 'let us'],
  [/\bcan't\b/g, 'cannot'],
  [/\bwon't\b/g, 'will not'],
  [/\b(do|does|did|is|are|was|were|has|have|had|should|would|could)n't\b/g, '$1 not'],
  [/\bcan not\b/g, 'cannot'],
]

const PUNCTUATION = /[.,!?¡¿;:"“”«»()…\-–—/。，、！？：；「」『』・،؟؛।॥]/g
const TILE_PUNCTUATION = /[.,!?¡¿;:"“”«»()…。，、！？：；「」『』،؟؛।॥]/g

const COMBINING_MARKS = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g')
const DOTTED_I = new RegExp(`i${String.fromCharCode(0x307)}`, 'g')

// letters that do not decompose into a base letter plus an accent
const SPECIAL: Record<string, string> = { 'ł': 'l', 'ß': 'ss', 'ø': 'o', 'đ': 'd', 'æ': 'ae', 'œ': 'oe', 'ı': 'i' }

export function stripAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[łßøđæœı]/g, (c) => SPECIAL[c])
}

export function normalize(text: string): string {
  let t = text
    .normalize('NFC')
    .toLowerCase()
    .replace(DOTTED_I, 'i') // Turkish capital dotted I lowercases to i + combining dot
    .replace(/ş/g, 'ș') // Romanian: cedilla and comma-below are both typed
    .replace(/ţ/g, 'ț')
    .replace(/[’‘`´]/g, "'")
  for (const [re, to] of CONTRACTIONS) t = t.replace(re, to)
  return t
    .replace(PUNCTUATION, ' ')
    .replace(/'/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

export type Verdict =
  | { correct: true; note: null | 'accent' | 'typo' | 'skip'; expected: string }
  | { correct: false; note: null; expected: string }

/** One misspelt word is forgiven per four words, only in words of five letters or more. */
function closeEnough(input: string, answer: string): boolean {
  const a = input.split(' ')
  const b = answer.split(' ')
  if (a.length !== b.length) return false
  let typos = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue
    if (b[i].length < 5 || levenshtein(a[i], b[i]) > 1) return false
    typos++
  }
  return typos <= Math.max(1, Math.floor(b.length / 4))
}

/** Chinese and Japanese data marks tiles with spaces; the text shown drops them. */
export function compactText(text: string): string {
  return text.replace(/\s+/g, '')
}

export function checkAnswer(
  input: string,
  answers: string[],
  opts: { typos?: boolean; compact?: boolean } = {},
): Verdict {
  const norm = (t: string) => (opts.compact ? normalize(t).replace(/ /g, '') : normalize(t))
  const show = (t: string) => (opts.compact ? compactText(t) : t)
  const expected = show(answers[0])
  const given = norm(input)
  if (!given) return { correct: false, note: null, expected }
  const normed = answers.map(norm)
  if (normed.includes(given)) return { correct: true, note: null, expected }
  const bare = stripAccents(given)
  const match = answers.find((_, i) => stripAccents(normed[i]) === bare)
  if (match) return { correct: true, note: 'accent', expected: show(match) }
  if (opts.typos && !opts.compact) {
    const near = answers.find((_, i) => closeEnough(bare, stripAccents(normed[i])))
    if (near) return { correct: true, note: 'typo', expected: near }
  }
  return { correct: false, note: null, expected }
}

/** Splits a sentence into word-bank tiles, keeping apostrophes and hyphens inside words. */
export function toTiles(sentence: string): string[] {
  return sentence.replace(TILE_PUNCTUATION, ' ').split(/\s+/).filter(Boolean)
}

/**
 * Spoken answers: speech recognition makes its own small mistakes, so any of its guesses
 * that is within 25% of an accepted answer (by edit distance) counts.
 */
export function checkSpoken(heard: string[], answers: string[], compact?: boolean): Verdict {
  const norm = (t: string) => stripAccents(compact ? normalize(t).replace(/ /g, '') : normalize(t))
  const expected = compact ? compactText(answers[0]) : answers[0]
  for (const h of heard) {
    const v = checkAnswer(h, answers, { typos: true, compact })
    if (v.correct) return v
    const said = norm(h)
    for (const a of answers) {
      const want = norm(a)
      if (want && levenshtein(said, want) <= Math.floor(want.length / 4)) return { correct: true, note: 'typo', expected }
    }
  }
  return { correct: false, note: null, expected }
}
