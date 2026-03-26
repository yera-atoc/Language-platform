import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProgressStore from '@store/progressStore'
import useUserStore from '@store/userStore'
import turkishData from '@content/turkish/index.json'
import chineseData from '@content/chinese/index.json'

// ── Language registry ────────────────────────────────────────

const LANG_DATA = {
  turkish: turkishData,
  chinese: chineseData,
}

const LANG_META = {
  turkish: { flag: '🇹🇷', name: 'Турецкий', exam: 'ТОМЕР', color: '#E74C3C' },
  chinese: { flag: '🇨🇳', name: 'Китайский', exam: 'HSK', color: '#E67E22' },
  korean:  { flag: '🇰🇷', name: 'Корейский', exam: 'TOPIK', color: '#3498DB' },
}

const LEVEL_COLORS = {
  a1: '#4ECDC4', a2: '#44CF6C', b1: '#FFD93D', b2: '#FF9F43',
  hsk1: '#FF6B6B', hsk2: '#FFA07A', hsk3: '#FFD700', hsk4: '#98FB98',
}

// ── Main Component ───────────────────────────────────────────

export default function Lessons() {
  const { language = 'turkish', level: levelParam } = useParams()
  // Default level depends on language
  const defaultLevel = language === 'chinese' ? 'hsk1' : 'a1'
  const navigate = useNavigate()

  const { getLevelProgress, getLessonProgress, isLessonUnlocked } = useProgressStore()
  const { xp, streak } = useUserStore()

  const langData = LANG_DATA[language]
  const langMeta = LANG_META[language] ?? { flag: '🌐', name: language, exam: '—', color: '#6C63FF' }

  const levelKeys  = langData ? Object.keys(langData.levels) : []
  const [activeLevel, setActiveLevel] = useState(levelParam ?? defaultLevel)

  const levelInfo  = langData?.levels?.[activeLevel]
  const lessons    = levelInfo?.lessons ?? []
  const levelColor = LEVEL_COLORS[activeLevel] ?? '#6C63FF'

  // Progress for current level
  const { completed } = getLevelProgress(language, activeLevel)
  const total          = lessons.length
  const pct            = total > 0 ? Math.round((completed / total) * 100) : 0

  // Is a level tab unlocked?
  function isLevelUnlocked(key) {
    const idx = levelKeys.indexOf(key)
    if (idx === 0) return true
    const prevKey     = levelKeys[idx - 1]
    const prevLessons = langData?.levels?.[prevKey]?.lessons?.length ?? 0
    return getLevelProgress(language, prevKey).completed >= prevLessons
  }

  // Overall accuracy from completed lessons
  const avgAccuracy = (() => {
    const scores = lessons
      .map((l, i) => getLessonProgress(language, activeLevel, l.id)?.score)
      .filter(Boolean)
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  })()

  return (
    <div style={s.screen}>
      <div style={s.bgGrid} />

      {/* ── Header ── */}
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <div style={{ flex: 1 }}>
          <div style={s.headerLang}>
            {langMeta.flag} {langMeta.name} · {langMeta.exam}
          </div>
          <div style={s.headerTitle}>
            Уровень {activeLevel.toUpperCase()}
          </div>
        </div>
        <span style={{ fontSize: 24 }}>🎯</span>
      </header>

      {/* ── Level tabs ── */}
      <div style={s.tabs}>
        {levelKeys.map(key => {
          const unlocked = isLevelUnlocked(key)
          const isActive = key === activeLevel
          const color    = LEVEL_COLORS[key] ?? '#6C63FF'
          return (
            <div
              key={key}
              onClick={() => unlocked && setActiveLevel(key)}
              style={{
                ...s.tab,
                borderColor:  isActive ? `${color}80` : 'rgba(255,255,255,0.07)',
                background:   isActive ? `${color}18` : '#1A1F35',
                color:        isActive ? color : '#555E80',
                opacity:      unlocked ? 1 : 0.4,
                cursor:       unlocked ? 'pointer' : 'not-allowed',
              }}
            >
              {key.toUpperCase()}{!unlocked && ' 🔒'}
            </div>
          )
        })}
      </div>

      {/* ── Progress banner ── */}
      <div style={{ ...s.banner, borderColor: `${levelColor}30`, background: `linear-gradient(135deg,${levelColor}10,rgba(108,99,255,0.06))` }}>
        <div style={s.bannerTop}>
          <span style={{ ...s.bannerLabel, color: levelColor }}>
            Прогресс {activeLevel.toUpperCase()}
          </span>
          <span style={s.bannerCount}>{completed} / {total} уроков</span>
        </div>
        <div style={s.barTrack}>
          <div style={{ ...s.barFill, width: `${pct}%`, background: `linear-gradient(90deg,${levelColor},${levelColor}99)` }} />
        </div>
        <div style={s.bannerStats}>
          <BannerStat label="XP"      value={xp}                           />
          <BannerStat label="Точность" value={avgAccuracy ? `${avgAccuracy}%` : '—'} />
          <BannerStat label="Серия"   value={`🔥 ${streak}`}              />
        </div>
      </div>

      {/* ── Lessons list ── */}
      <div style={s.list}>
        {lessons.map((lesson, idx) => {
          const prog    = getLessonProgress(language, activeLevel, lesson.id)
          const done    = !!prog?.completed
          const unlocked = isLessonUnlocked(language, activeLevel, idx)
          const isCurrent = !done && unlocked

          return (
            <LessonRow
              key={lesson.id}
              lesson={lesson}
              index={idx}
              done={done}
              unlocked={unlocked}
              isCurrent={isCurrent}
              score={prog?.score ?? null}
              levelColor={levelColor}
              onClick={() => {
                if (unlocked) navigate(`/lesson/${language}/${activeLevel}/${lesson.id}`)
              }}
            />
          )
        })}

        {lessons.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#555E80' }}>
            Уроки для этого уровня скоро появятся
          </div>
        )}
      </div>

      <div style={{ height: 80 }} />

      {/* ── Bottom nav ── */}
      <BottomNav active="lessons" onNavigate={tab => {
        if (tab === 'home')     navigate('/')
        if (tab === 'progress') navigate('/progress')
        if (tab === 'profile')  navigate('/profile')
      }} />
    </div>
  )
}

// ── LessonRow ────────────────────────────────────────────────

function LessonRow({ lesson, index, done, unlocked, isCurrent, score, levelColor, onClick }) {
  const [pressed, setPressed] = useState(false)

  const statusIcon = done ? '✅' : isCurrent ? '▶' : '🔒'
  const dotStyle   = done
    ? { background: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.3)' }
    : isCurrent
    ? { background: `${levelColor}18`, borderColor: `${levelColor}55`, boxShadow: `0 0 12px ${levelColor}33` }
    : { background: '#232840', borderColor: 'rgba(255,255,255,0.07)' }

  return (
    <div
      onClick={onClick}
      onMouseDown={() => unlocked && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        ...s.row,
        opacity:   unlocked ? 1 : 0.45,
        cursor:    unlocked ? 'pointer' : 'not-allowed',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        transition: 'transform 0.12s ease',
      }}
    >
      {/* Status dot */}
      <div style={{ ...s.dot, ...dotStyle }}>
        <span style={{ fontSize: done ? 18 : isCurrent ? 16 : 14 }}>{statusIcon}</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.rowNum}>Урок {index + 1}</div>
        <div style={{ ...s.rowTitle, color: isCurrent ? '#F0F2FF' : done ? '#F0F2FF' : '#8890B0' }}>
          {lesson.title}
        </div>
        <div style={s.rowSub}>
          {done ? '5 упражнений · Пройден'
          : isCurrent ? 'Нажми чтобы начать'
          : 'Заблокировано'}
        </div>
      </div>

      {/* Right */}
      <div style={s.rowRight}>
        {score !== null ? (
          <>
            <ScoreBadge score={score} />
            <div style={s.xpSmall}>+{lesson.xp} XP</div>
          </>
        ) : isCurrent ? (
          <div style={{ ...s.xpBadge, color: '#FFD060', background: 'rgba(255,208,96,0.12)' }}>
            +{lesson.xp} XP
          </div>
        ) : (
          <span style={{ fontSize: 14, color: '#555E80' }}>🔒</span>
        )}
      </div>

      {/* Active indicator line */}
      {isCurrent && (
        <div style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 28, background: levelColor, borderRadius: '0 3px 3px 0',
        }} />
      )}
    </div>
  )
}

// ── Small helpers ────────────────────────────────────────────

function ScoreBadge({ score }) {
  const color = score >= 90 ? '#4ADE80' : score >= 70 ? '#FFD060' : '#FF7043'
  return (
    <div style={{ ...s.xpBadge, color, background: `${color}18` }}>{score}%</div>
  )
}

function BannerStat({ label, value }) {
  return (
    <div style={{ fontSize: 12, color: '#8890B0' }}>
      {label}: <span style={{ color: '#F0F2FF', fontWeight: 700 }}>{value}</span>
    </div>
  )
}

function BottomNav({ active, onNavigate }) {
  const items = [
    { id: 'home',     icon: '🏠', label: 'Главная' },
    { id: 'lessons',  icon: '📖', label: 'Уроки'   },
    { id: 'progress', icon: '📊', label: 'Прогресс'},
    { id: 'ranking',  icon: '🏆', label: 'Рейтинг' },
    { id: 'profile',  icon: '👤', label: 'Профиль' },
  ]
  return (
    <nav style={s.nav}>
      {items.map(item => (
        <div key={item.id} onClick={() => onNavigate(item.id)} style={s.navItem}>
          <span style={{
            fontSize: 22,
            filter: active === item.id ? 'drop-shadow(0 0 6px rgba(139,132,255,.7))' : 'none',
          }}>
            {item.icon}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px',
            color: active === item.id ? '#8B84FF' : '#555E80',
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  )
}

// ── Styles ───────────────────────────────────────────────────

const s = {
  screen:      { background: '#080B14', color: '#F0F2FF', minHeight: '100vh', fontFamily: "'Outfit',sans-serif", position: 'relative' },
  bgGrid:      { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(108,99,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' },
  header:      { maxWidth: 420, margin: '0 auto', padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10 },
  backBtn:     { width: 36, height: 36, borderRadius: 10, background: '#1A1F35', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, color: '#8890B0', fontFamily: 'inherit', flexShrink: 0 },
  headerLang:  { fontSize: 11, fontWeight: 700, color: '#555E80', textTransform: 'uppercase', letterSpacing: '.8px' },
  headerTitle: { fontSize: 20, fontWeight: 800, marginTop: 2 },
  tabs:        { maxWidth: 420, margin: '0 auto', display: 'flex', gap: 8, padding: '0 20px 16px', overflowX: 'auto', scrollbarWidth: 'none', position: 'relative', zIndex: 10 },
  tab:         { flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1.5px solid', transition: 'all .15s', letterSpacing: '.3px' },
  banner:      { maxWidth: 420, margin: '0 auto 4px', padding: '14px 16px', borderRadius: 18, border: '1px solid', position: 'relative', zIndex: 10, marginLeft: 20, marginRight: 20 },
  bannerTop:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  bannerLabel: { fontSize: 12, fontWeight: 700 },
  bannerCount: { fontSize: 12, color: '#8890B0' },
  barTrack:    { height: 6, background: '#232840', borderRadius: 3, overflow: 'hidden' },
  barFill:     { height: '100%', borderRadius: 3, transition: 'width .8s ease' },
  bannerStats: { display: 'flex', gap: 16, marginTop: 10 },
  list:        { maxWidth: 420, margin: '8px auto 0', padding: '0 20px', position: 'relative', zIndex: 10 },
  row:         { display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' },
  dot:         { width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid', transition: 'all .15s' },
  rowNum:      { fontSize: 10, fontWeight: 700, color: '#555E80', textTransform: 'uppercase', letterSpacing: '.6px' },
  rowTitle:    { fontSize: 14, fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  rowSub:      { fontSize: 12, color: '#555E80', marginTop: 2 },
  rowRight:    { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  xpBadge:    { fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8 },
  xpSmall:    { fontSize: 11, color: '#555E80' },
  nav:         { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: '#0D1120ee', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '10px 0 16px', zIndex: 100, backdropFilter: 'blur(12px)' },
  navItem:     { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '4px 0' },
}
