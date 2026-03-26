import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLives } from '@hooks/useLives'
import { MAX_LIVES } from '@store/userStore'

// ── NoLivesModal ─────────────────────────────────────────────

/**
 * Shows when lives === 0.
 * Parent decides when to render it (e.g. at start of Lesson).
 *
 * Props:
 *   onClose()   — called when modal is dismissed (user waits or restores)
 *   onPractice  — optional: called when user picks practice mode
 */
export default function NoLivesModal({ onClose, onPractice }) {
  const navigate = useNavigate()
  const {
    lives,
    nextLifeFormatted,
    fullRestoreFormatted,
    regenPct,
    restoreCost,
    canAffordRestore,
    restoreWithXP,
    isFullyRestored,
  } = useLives()

  const [restored, setRestored] = useState(false)

  function handleRestoreXP() {
    const ok = restoreWithXP()
    if (ok) { setRestored(true); setTimeout(onClose, 1200) }
  }

  // Auto-dismiss once a life regenerates
  if (lives > 0 && !restored) {
    return (
      <div style={s.overlay}>
        <div style={s.card}>
          <span style={s.bigIcon}>❤️</span>
          <h2 style={s.title}>Жизнь восстановлена!</h2>
          <p style={s.sub}>Теперь у тебя {lives} из {MAX_LIVES} жизней</p>
          <button style={s.btnPrimary} onClick={onClose}>Продолжить →</button>
        </div>
      </div>
    )
  }

  if (restored) {
    return (
      <div style={s.overlay}>
        <div style={s.card}>
          <span style={s.bigIcon}>🎉</span>
          <h2 style={s.title}>Жизни восстановлены!</h2>
          <p style={s.sub}>Потрачено {restoreCost} XP — все 5 жизней возвращены</p>
          <div style={{ ...s.spinner, margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        {/* Icon + title */}
        <span style={s.bigIcon}>💔</span>
        <h2 style={s.title}>Жизни закончились!</h2>
        <p style={s.sub}>Подожди немного или попрактикуйся без ограничений</p>

        {/* Regen timer */}
        <div style={s.timerCard}>
          <div style={s.timerLabel}>Следующая жизнь через</div>
          <div style={s.timerNum}>{nextLifeFormatted}</div>
          <div style={s.regenTrack}>
            <div style={{ ...s.regenFill, width: `${regenPct}%` }} />
          </div>
          <div style={s.timerSub}>Полное восстановление: {fullRestoreFormatted}</div>
        </div>

        {/* Action buttons */}
        <div style={s.btnRow}>
          <button style={s.btnSecondary} onClick={() => navigate('/')}>
            ← На главную
          </button>
          <button
            style={{ ...s.btnGold, opacity: canAffordRestore ? 1 : 0.4 }}
            disabled={!canAffordRestore}
            onClick={handleRestoreXP}
          >
            💎 {restoreCost} XP
          </button>
        </div>
        {!canAffordRestore && (
          <div style={s.noXpHint}>Не хватает XP — пройди ещё уроки!</div>
        )}

        {/* Practice options */}
        <div style={s.divider} />
        <div style={s.optionsLabel}>Пока ждёшь — попрактикуйся:</div>
        <div style={s.options}>
          <PracticeOption
            icon="📝"
            title="Режим практики"
            sub="Без таймера и без жизней"
            badge="Бесплатно"
            badgeColor="#4ADE80"
            onClick={onPractice}
          />
          <PracticeOption
            icon="🔁"
            title="Повторить урок"
            sub="Улучши прошлый результат"
            badge="Бесплатно"
            badgeColor="#4ADE80"
            onClick={() => navigate(-1)}
          />
        </div>
      </div>
    </div>
  )
}

// ── LivesDisplay ─────────────────────────────────────────────

/**
 * Compact lives display with regen timer — use in topbar.
 * Shows hearts + countdown when not full.
 */
export function LivesDisplay({ onClick }) {
  const {
    lives, maxLives, isFullyRestored,
    nextLifeFormatted, regenPct,
  } = useLives()

  return (
    <div onClick={onClick} style={{ ...s.livesDisplay, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={s.heartsRow}>
        {Array.from({ length: maxLives }).map((_, i) => (
          <span key={i} style={{ fontSize: 14, opacity: i < lives ? 1 : 0.2, transition: 'opacity .3s' }}>
            ❤️
          </span>
        ))}
      </div>
      {!isFullyRestored && (
        <div style={s.regenMini}>
          <div style={s.regenMiniTrack}>
            <div style={{ ...s.regenMiniFill, width: `${regenPct}%` }} />
          </div>
          <span style={s.regenMiniTime}>{nextLifeFormatted}</span>
        </div>
      )}
    </div>
  )
}

// ── PracticeOption ────────────────────────────────────────────

function PracticeOption({ icon, title, sub, badge, badgeColor, onClick }) {
  return (
    <div onClick={onClick} style={s.optionRow}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#555E80', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: `${badgeColor}18`, color: badgeColor }}>
        {badge}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────

const s = {
  overlay:       { position: 'fixed', inset: 0, background: 'rgba(8,11,20,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' },
  card:          { background: '#1A1F35', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 24, padding: '28px 24px', maxWidth: 360, width: '100%', fontFamily: "'Outfit',sans-serif", color: '#F0F2FF', textAlign: 'center' },
  bigIcon:       { fontSize: 56, lineHeight: 1, display: 'block', marginBottom: 14 },
  title:         { fontSize: 20, fontWeight: 800, marginBottom: 6 },
  sub:           { fontSize: 14, color: '#8890B0', lineHeight: 1.5, marginBottom: 20 },
  timerCard:     { background: '#232840', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 16, padding: '14px 18px', marginBottom: 16 },
  timerLabel:    { fontSize: 12, color: '#555E80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 },
  timerNum:      { fontSize: 32, fontWeight: 800, color: '#FF4D6D', fontFamily: "'DM Mono',monospace" },
  regenTrack:    { height: 5, background: '#1A1F35', borderRadius: 3, overflow: 'hidden', margin: '10px 0 6px' },
  regenFill:     { height: '100%', background: 'linear-gradient(90deg,#FF4D6D,#FF9F43)', borderRadius: 3, transition: 'width .5s linear' },
  timerSub:      { fontSize: 12, color: '#555E80' },
  btnRow:        { display: 'flex', gap: 10, marginBottom: 6 },
  btnPrimary:    { width: '100%', padding: 14, borderRadius: 14, border: 'none', background: '#6C63FF', color: 'white', fontSize: 15, fontWeight: 800, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' },
  btnSecondary:  { flex: 1, padding: 12, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)', background: '#232840', color: '#8890B0', fontSize: 14, fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: 'pointer' },
  btnGold:       { flex: 1, padding: 12, borderRadius: 14, border: 'none', background: '#FFD060', color: '#1A1200', fontSize: 14, fontWeight: 800, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', transition: 'opacity .15s' },
  noXpHint:      { fontSize: 12, color: '#555E80', marginBottom: 4 },
  divider:       { height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0 12px' },
  optionsLabel:  { fontSize: 12, fontWeight: 700, color: '#555E80', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 8, textAlign: 'left' },
  options:       { display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' },
  optionRow:     { display: 'flex', alignItems: 'center', gap: 12, background: '#232840', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '11px 14px', cursor: 'pointer', transition: 'background .15s' },
  spinner:       { width: 24, height: 24, border: '2.5px solid rgba(255,255,255,0.2)', borderTopColor: '#4ADE80', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  livesDisplay:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  heartsRow:     { display: 'flex', gap: 2 },
  regenMini:     { display: 'flex', alignItems: 'center', gap: 5 },
  regenMiniTrack:{ width: 36, height: 3, background: '#232840', borderRadius: 2, overflow: 'hidden' },
  regenMiniFill: { height: '100%', background: '#FF4D6D', borderRadius: 2, transition: 'width .5s linear' },
  regenMiniTime: { fontSize: 10, color: '#FF4D6D', fontFamily: "'DM Mono',monospace", fontWeight: 700 },
}
