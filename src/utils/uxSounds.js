import useAudioStore from '@store/audioStore'

let audioCtx = null

function getAudioCtx() {
  if (audioCtx) return audioCtx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  audioCtx = new AC()
  return audioCtx
}

function beep({ freq, duration = 0.12, type = 'sine', gain = 0.18, ramp = 0.02 } = {}) {
  const ctx = getAudioCtx()
  if (!ctx) return
  ctx.resume?.().catch(() => {})
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const g   = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(gain, now + ramp)
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + duration + 0.02)
}

export function playUXSound(kind) {
  const { soundsEnabled, volume } = useAudioStore.getState()
  if (!soundsEnabled) return
  const gain = 0.08 + volume * 0.18

  switch (kind) {
    case 'correct':
      beep({ freq: 880, duration: 0.11, gain, ramp: 0.015 })
      break
    case 'wrong':
      beep({ freq: 196, duration: 0.16, gain, ramp: 0.02, type: 'square' })
      break
    case 'timeUp':
      beep({ freq: 440, duration: 0.14, gain, ramp: 0.02, type: 'triangle' })
      break
    case 'lifeLost':
      beep({ freq: 220, duration: 0.18, gain, ramp: 0.02 })
      break
    case 'reward':
      beep({ freq: 659, duration: 0.10, gain, ramp: 0.015 })
      setTimeout(() => beep({ freq: 988, duration: 0.14, gain, ramp: 0.015 }), 80)
      setTimeout(() => beep({ freq: 1318, duration: 0.18, gain, ramp: 0.015 }), 180)
      break
    case 'tap':
      beep({ freq: 520, duration: 0.06, gain: Math.max(0.05, gain * 0.7), ramp: 0.01 })
      break
    case 'levelUp':
      beep({ freq: 523, duration: 0.12, gain, ramp: 0.01 })
      setTimeout(() => beep({ freq: 659, duration: 0.12, gain, ramp: 0.01 }), 100)
      setTimeout(() => beep({ freq: 784, duration: 0.12, gain, ramp: 0.01 }), 200)
      setTimeout(() => beep({ freq: 1046, duration: 0.25, gain, ramp: 0.01 }), 320)
      break
    default:
      break
  }
}
