// Speech through the browser's own voices, and short synthesized tones. No recorded audio.

let ctx: AudioContext | null = null

function tone(freqs: number[], step = 0.09) {
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime
    freqs.forEach((f, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = 'triangle'
      osc.frequency.value = f
      gain.gain.setValueAtTime(0.0001, t0 + i * step)
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + i * step + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * step + step * 1.6)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(t0 + i * step)
      osc.stop(t0 + i * step + step * 1.8)
    })
  } catch {
    // no audio available
  }
}

export const sfx = {
  correct: () => tone([660, 880]),
  wrong: () => tone([300, 220], 0.12),
  done: () => tone([523, 659, 784, 1047], 0.1),
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
}

export function speak(text: string, lang: string, slow = false): void {
  if (!canSpeak()) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = slow ? 0.6 : 0.95
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(lang.slice(0, 2)))
  if (voice) u.voice = voice
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}
