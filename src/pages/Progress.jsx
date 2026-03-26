import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'
import turkishData from '@content/turkish/index.json'
import chineseData from '@content/chinese/index.json'

// ── Constants ────────────────────────────────────────────────

const LANG_LIST = [
  { code: 'turkish', flag: '🇹🇷', name: 'Турецкий', data: turkishData },
  { code: 'chinese', flag: '🇨🇳', name: 'Китайский', data: chineseData },
]

const LEVEL_COLORS = {
  a1: '#4ECDC4', a2: '#44CF6C', b1: '#FFD93D', b2: '#FF9F43',
}

const WEEK_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// XP needed per level
const XP_PER_LEVEL = 1000

// ── Main Component ───────────────────────────────────────────

export default function Progress() {
  const navigate = useNavigate()
  const { xp, level, streak, lives } = useUserStore()
  const { progress, getLevelProgress, getLessonProgress } = useProgressStore()

  // XP within current level
  const xpInLevel   = xp % XP_PER_LEVEL
  const xpPct       = Math.round((xpInLevel / XP_PER_LEVEL) * 100)
  const xpToNext    = XP_PER_LEVEL - xpInLevel
  const levelName   = level <= 2 ? 'Новичок' : level <= 5 ? 'Ученик' : level <= 9 ? 'Знаток' : 'Эксперт'

  // Total lessons completed across all languages
  const totalLessons = useMemo(() => {
    let count = 0
    LANG_LIST.forEach(({ code, data }) => {
      Object.keys(data.levels).forEach(levelKey => {
        count += getLevelProgress(code, levelKey).completed
      })
    })
    return count
  }, [progress, getLevelProgress])

  // Average accuracy across all completed lessons
  const avgAccuracy = useMemo(() => {
    const scores = []
    LANG_LIST.forEach(({ code, data }) => {
      Object.keys(data.levels).forEach(levelKey => {
        const lessons = data.levels[levelKey].lessons ?? []
        lessons.forEach(l => {
          const p = getLessonProgress(code, levelKey, l.id)
          if (p?.score) scores.push(p.score)
        })
      })
    })
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  }, [progress, getLessonProgress])

  // Estimated study time (avg 3min per lesson)
  const studyMinutes = totalLessons * 3
  const studyLabel   = studyMinutes < 60
    ? `${studyMinutes}м`
    : `${(studyMinutes / 60).toFixed(1)}ч`

  // Streak calendar: last 28 days
  const today    = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const calDays  = Array.from({ length: 28 }, (_, i) => {
    const daysAgo = 27 - i
    if (daysAgo === 0) return 'today'
    return daysAgo < streak ? 'done' : 'empty'
  })

  // Simulated weekly XP for chart (last 7 days)
  const weekXP = useMemo(() => {
    const base = [0, 0, 0, 0, 0, 0, 0]
    for (let i = 0; i < Math.min(streak, 7); i++) {
      const idx = 6 - i
      base[idx] = Math.round(40 + Math.random() * 80)
    }
    return base
  }, [streak])
  const maxWeekXP = Math.max(...weekXP, 1)

  return (
    <div style={s.screen}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes barGrow{from{width:0}to{width:var(--target-w)}}
        @keyframes countUp{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
      `}</style>
      <div style={s.bgGrid} />

      {/* ── Header ── */}
      <header style={s.header}>
        <div>
          <h1 style={s.title}>Прогресс</h1>
          <div style={s.subtitle}>
            {LANG_LIST.map(l => `${l.flag} ${l.name}`).join(' · ')}
          </div>
        </div>
      </header>

      {/* ── XP card ── */}
      <div style={s.xpCard}>
        <div style={s.xpTop}>
          <span style={s.xpLevel}>Уровень {level} · {levelName}</span>
          <span style={s.xpNext}>до ур. {level + 1}: {xpToNext} XP</span>
        </div>
        <div style={s.xpNum}>{xp.toLocaleString()}</div>
        <div style={s.xpLbl}>опыт (XP)</div>
        <div style={s.xpTrack}>
          <div style={{ ...s.xpFill, width: `${xpPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#555E80' }}>
          <span>0</span>
          <span style={{ color: '#FFD060', fontWeight: 700 }}>{xpInLevel} / {XP_PER_LEVEL} XP</span>
          <span>{XP_PER_LEVEL}</span>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div style={s.statsGrid}>
        <StatCard icon="🔥" value={streak}        label="Стрик дней"     color="#FF7043" />
        <StatCard icon="📖" value={totalLessons}   label="Уроков пройдено" color="#4ECDC4" />
        <StatCard icon="🎯" value={`${avgAccuracy}%`} label="Точность"    color="#4ADE80" />
        <StatCard icon="⏱️" value={studyLabel}     label="Время учёбы"   color="#8B84FF" />
      </div>

      {/* ── Week activity chart ── */}
      <SectionHead title="Активность за неделю" />
      <div style={s.weekChart}>
        {weekXP.map((val, i) => {
          const h = val > 0 ? Math.max(8, Math.round((val / maxWeekXP) * 72)) : 4
          const isToday = i === 6
          const hasData = val > 0
          return (
            <div key={i} style={s.weekCol}>
              <div style={s.barWrap}>
                <div style={{
                  ...s.bar,
                  height: h,
                  background: isToday
                    ? 'linear-gradient(180deg,#8B84FF,#6C63FF)'
                    : hasData
                    ? 'linear-gradient(180deg,#FF9060,#FF7043)'
                    : '#232840',
                  boxShadow: isToday ? '0 2px 8px rgba(108,99,255,.4)' : 'none',
                }} />
              </div>
              <div style={{ ...s.dayLbl, color: isToday ? '#8B84FF' : '#555E80' }}>
                {WEEK_LABELS[i]}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Level progress ── */}
      <SectionHead title="Прогресс по уровням" />
      <div style={s.levelList}>
        {LANG_LIST.map(({ code, flag, name, data }) =>
          Object.entries(data.levels).map(([key, lvl], idx) => {
            const { completed } = getLevelProgress(code, key)
            const total  = lvl.lessons?.length ?? 20
            const pct    = Math.round((completed / total) * 100)
            const color  = LEVEL_COLORS[key] ?? '#6C63FF'
            const locked = idx > 0 && (() => {
              const prevKey     = Object.keys(data.levels)[idx - 1]
              const prevTotal   = data.levels[prevKey]?.lessons?.length ?? 20
              return getLevelProgress(code, prevKey).completed < prevTotal
            })()
            return (
              <div key={key} style={{ ...s.levelRow, opacity: locked ? 0.4 : 1 }}>
                <div style={s.levelRowTop}>
                  <span style={{ ...s.levelName, color }}>{lvl.title}</span>
                  <span style={s.levelCount}>
                    {locked ? '🔒' : `${completed} / ${total}`}
                  </span>
                </div>
                <div style={s.lbarTrack}>
                  <div style={{ ...s.lbarFill, width: `${pct}%`, background: color }} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Streak calendar ── */}
      <SectionHead title="Календарь — последние 28 дней" />
      <div style={s.cal}>
        {calDays.map((type, i) => (
          <div key={i} style={{
            ...s.calDay,
            background:
              type === 'today' ? '#FF7043'
            : type === 'done'  ? 'rgba(255,112,67,0.22)'
            : '#232840',
            color:
              type === 'today' ? 'white'
            : type === 'done'  ? '#FF7043'
            : '#555E80',
          }}>
            {type === 'today' ? '★' : ''}
          </div>
        ))}
      </div>

      <div style={{ height: 80 }} />

      {/* ── Bottom nav ── */}
      <BottomNav active="progress" onNavigate={tab => {
        if (tab === 'home')    navigate('/')
        if (tab === 'lessons') navigate('/lessons/turkish/a1')
        if (tab === 'profile') navigate('/profile')
      }} />
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function StatCard({ icon, value, label, color }) {
  return (
    <div style={s.statCard}>
      <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>{icon}</span>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
        {value}
      </div>
      <div style={s.statLbl}>{label}</div>
    </div>
  )
}

function SectionHead({ title }) {
  return (
    <div style={s.sectionHead}>
      <span style={s.sectionTitle}>{title}</span>
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
          <span style={{ fontSize: 22, filter: active === item.id ? 'drop-shadow(0 0 6px rgba(139,132,255,.7))' : 'none' }}>
            {item.icon}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: active === item.id ? '#8B84FF' : '#555E80' }}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  )
}

// ── Styles ───────────────────────────────────────────────────

const s = {
  screen:     { background: '#080B14', color: '#F0F2FF', minHeight: '100vh', fontFamily: "'Outfit',sans-serif", position: 'relative' },
  bgGrid:     { position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(108,99,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' },
  header:     { maxWidth: 420, margin: '0 auto', padding: '16px 20px 14px', position: 'relative', zIndex: 10 },
  title:      { fontSize: 22, fontWeight: 800, marginBottom: 2 },
  subtitle:   { fontSize: 13, color: '#555E80' },

  xpCard:     { maxWidth: 420, margin: '0 auto 14px', padding: '18px', borderRadius: 20, border: '1px solid rgba(108,99,255,0.25)', background: 'linear-gradient(135deg,rgba(108,99,255,0.14),rgba(139,132,255,0.07))', position: 'relative', zIndex: 10, marginLeft: 20, marginRight: 20 },
  xpTop:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  xpLevel:    { fontSize: 12, fontWeight: 700, color: '#8B84FF', textTransform: 'uppercase', letterSpacing: '.8px' },
  xpNext:     { fontSize: 12, color: '#555E80' },
  xpNum:      { fontSize: 38, fontWeight: 800, color: '#FFD060', fontFamily: "'DM Mono',monospace", lineHeight: 1 },
  xpLbl:      { fontSize: 12, color: '#555E80', marginTop: 3 },
  xpTrack:    { height: 8, background: '#232840', borderRadius: 4, overflow: 'hidden', marginTop: 14 },
  xpFill:     { height: '100%', background: 'linear-gradient(90deg,#6C63FF,#FFD060)', borderRadius: 4, transition: 'width .8s ease' },

  statsGrid:  { maxWidth: 420, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px 4px', position: 'relative', zIndex: 10 },
  statCard:   { background: '#1A1F35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 14 },
  statLbl:    { fontSize: 11, color: '#555E80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.6px', marginTop: 4 },

  sectionHead:{ maxWidth: 420, margin: '0 auto', padding: '16px 20px 10px', position: 'relative', zIndex: 10 },
  sectionTitle:{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#555E80' },

  weekChart:  { maxWidth: 420, margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: 6, height: 88, padding: '0 20px', position: 'relative', zIndex: 10 },
  weekCol:    { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  barWrap:    { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' },
  bar:        { width: '100%', borderRadius: '5px 5px 2px 2px', minHeight: 4, transition: 'height .4s ease' },
  dayLbl:     { fontSize: 10, fontWeight: 600 },

  levelList:  { maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px', position: 'relative', zIndex: 10 },
  levelRow:   { background: '#1A1F35', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px' },
  levelRowTop:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  levelName:  { fontSize: 13, fontWeight: 700 },
  levelCount: { fontSize: 12, color: '#555E80' },
  lbarTrack:  { height: 6, background: '#232840', borderRadius: 3, overflow: 'hidden' },
  lbarFill:   { height: '100%', borderRadius: 3, transition: 'width .8s ease' },

  cal:        { maxWidth: 420, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, padding: '0 20px', position: 'relative', zIndex: 10 },
  calDay:     { aspectRatio: 1, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 },

  nav:        { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: '#0D1120ee', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '10px 0 16px', zIndex: 100, backdropFilter: 'blur(12px)' },
  navItem:    { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '4px 0' },
}
