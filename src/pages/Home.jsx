import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '@store/userStore'
import { LivesDisplay } from '@components/ui/NoLivesModal'
import useProgressStore from '@store/progressStore'
import turkishData from '@content/turkish/index.json'

// ── Data ─────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'turkish',  flag: '🇹🇷', name: 'Турецкий',   exam: 'ТОМЕР', color: '#E74C3C', phase: 1, data: turkishData },
  { code: 'chinese',  flag: '🇨🇳', name: 'Китайский',  exam: 'HSK',   color: '#E67E22', phase: 2 },
  { code: 'korean',   flag: '🇰🇷', name: 'Корейский',  exam: 'TOPIK', color: '#3498DB', phase: 2 },
  { code: 'arabic',   flag: '🇸🇦', name: 'Арабский',   exam: '—',     color: '#27AE60', phase: 3 },
  { code: 'spanish',  flag: '🇪🇸', name: 'Испанский',  exam: 'DELE',  color: '#F39C12', phase: 3 },
  { code: 'italian',  flag: '🇮🇹', name: 'Итальянский',exam: 'CILS',  color: '#8E44AD', phase: 3 },
  { code: 'japanese', flag: '🇯🇵', name: 'Японский',   exam: 'JLPT',  color: '#E91E63', phase: 3 },
]

const LEVEL_COLORS = { a1: '#4ECDC4', a2: '#44CF6C', b1: '#FFD93D', b2: '#FF9F43', c1: '#FF6B6B', c2: '#A29BFE' }

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

// ── Main Component ───────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const { xp, level, streak, lives, maxLives } = useUserStore()
  const { getLevelProgress } = useProgressStore()
  const [activeLang, setActiveLang] = useState('turkish')

  const langMeta = LANGUAGES.find(l => l.code === activeLang)
  const levelKeys = langMeta?.data ? Object.keys(langMeta.data.levels) : []

  // Find next uncompleted lesson
  const findContinueLesson = () => {
    const lessons = langMeta?.data?.levels?.a1?.lessons
    if (!lessons) return null
    const { completed } = getLevelProgress(activeLang, 'a1')
    const idx = Math.min(completed, lessons.length - 1)
    return { ...lessons[idx], levelKey: 'a1', index: idx }
  }

  const continueLesson = findContinueLesson()
  const a1Lessons = langMeta?.data?.levels?.a1?.lessons ?? []
  const a1Progress = getLevelProgress(activeLang, 'a1')
  const a1Pct = a1Lessons.length > 0
    ? Math.round((a1Progress.completed / a1Lessons.length) * 100)
    : 0

  // Streak week
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const streakDays = WEEK_DAYS.map((d, i) => ({
    label: d[0],
    done: streak > 0 && i < todayIdx,
    today: i === todayIdx,
  }))

  return (
    <div style={s.app}>
      <div style={s.bgGrid} />
      <div style={s.bgGlow} />

      {/* ── Top bar ── */}
      <header style={s.topbar}>
        <div style={s.logo}>lang<span style={{ color: '#8B84FF' }}>.</span></div>
        <div style={s.statsRow}>
          <StatPill color="#FFD060" icon="⚡" value={xp} />
          <StatPill color="#FF7043" icon="🔥" value={streak} />
          <LivesDisplay />
        </div>
      </header>

      {/* ── Streak card ── */}
      <div style={s.streakCard}>
        <span style={{ fontSize: 28 }}>🔥</span>
        <div style={{ flex: 1 }}>
          <div style={s.metaLabel}>Текущий стрик</div>
          <div style={s.streakValue}>{streak} {pluralDays(streak)}</div>
          <div style={s.streakSub}>Не останавливайся!</div>
        </div>
        <div style={s.streakDays}>
          {streakDays.map((d, i) => (
            <div key={i} style={{ ...s.sDay, ...(d.done ? s.sDayDone : {}), ...(d.today ? s.sDayToday : {}) }}>
              {d.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Languages ── */}
      <SectionHead title="Языки" action="Все →" />
      <div style={s.langScroll}>
        {LANGUAGES.map(lang => {
          const prog = lang.phase === 1 ? getLevelProgress(lang.code, 'a1') : { completed: 0 }
          const total = lang.data?.levels?.a1?.lessons?.length ?? 20
          const pct = Math.round((prog.completed / total) * 100)
          return (
            <LangCard
              key={lang.code}
              lang={lang}
              pct={pct}
              completed={prog.completed}
              total={total}
              active={activeLang === lang.code}
              onClick={() => lang.phase === 1 && setActiveLang(lang.code)}
            />
          )
        })}
      </div>

      {/* ── Continue lesson ── */}
      {continueLesson && (
        <>
          <SectionHead title="Продолжить" />
          <div
            style={s.continueCard}
            onClick={() => navigate(`/lesson/${activeLang}/a1/${continueLesson.id}`)}
          >
            <div style={s.continueTop}>
              <div style={{ ...s.continueIcon, background: `linear-gradient(135deg,${langMeta.color},${langMeta.color}99)` }}>
                {langMeta.flag}
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.metaLabel}>{langMeta.name} · A1</div>
                <div style={s.continueTitle}>{continueLesson.title}</div>
              </div>
              <button
                style={s.continueBtn}
                onClick={e => { e.stopPropagation(); navigate(`/lesson/${activeLang}/a1/${continueLesson.id}`) }}
              >
                Идти
              </button>
            </div>
            <ProgressBar pct={a1Pct} />
          </div>
        </>
      )}

      {/* ── Level path ── */}
      {levelKeys.length > 0 && (
        <>
          <SectionHead
            title={`Программа — ${langMeta.name}`}
            action={`${a1Lessons.length * levelKeys.length} уроков`}
          />
          <div style={s.levelPath}>
            {levelKeys.map((key, idx) => {
              const lvl = langMeta.data.levels[key]
              const prog = getLevelProgress(activeLang, key)
              const prevKey = levelKeys[idx - 1]
              const prevLessons = prevKey ? (langMeta.data.levels[prevKey]?.lessons?.length ?? 20) : 0
              const prevDone = idx === 0 || getLevelProgress(activeLang, prevKey).completed >= prevLessons
              const locked = !prevDone
              const total = lvl.lessons?.length ?? 20
              const pct = Math.round((prog.completed / total) * 100)
              return (
                <LevelRow
                  key={key}
                  levelKey={key}
                  level={lvl}
                  pct={pct}
                  completed={prog.completed}
                  total={total}
                  locked={locked}
                  active={!locked && pct > 0 && pct < 100}
                  onClick={() => !locked && navigate(`/lessons/${activeLang}/${key}`)}
                />
              )
            })}
          </div>
        </>
      )}

      <div style={{ height: 100 }} />

      {/* ── Bottom nav ── */}
      <BottomNav
        active="home"
        onNavigate={tab => {
          if (tab === 'lessons')  navigate(`/lessons/${activeLang}/a1`)
          if (tab === 'progress') navigate('/progress')
          if (tab === 'profile')  navigate('/profile')
        }}
      />
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────

function StatPill({ color, icon, value }) {
  return (
    <div style={{ ...s.statPill, color }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span>{value}</span>
    </div>
  )
}

function LivesPill({ lives, max }) {
  return (
    <div style={s.statPill}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: 12, opacity: i < lives ? 1 : 0.2 }}>❤️</span>
      ))}
    </div>
  )
}

function SectionHead({ title, action }) {
  return (
    <div style={s.sectionHead}>
      <span style={s.sectionTitle}>{title}</span>
      {action && <span style={s.sectionLink}>{action}</span>}
    </div>
  )
}

function LangCard({ lang, pct, completed, total, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...s.langCard,
        background: `linear-gradient(145deg,${lang.color}18,${lang.color}08)`,
        borderColor: active ? `${lang.color}55` : 'rgba(255,255,255,0.07)',
        boxShadow: active ? `0 4px 24px ${lang.color}25` : 'none',
        cursor: lang.phase === 1 ? 'pointer' : 'default',
        opacity: lang.phase > 1 ? 0.65 : 1,
      }}
    >
      {lang.phase > 1 && <div style={s.langBadge}>ф{lang.phase}</div>}
      <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{lang.flag}</span>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{lang.name}</div>
      <div style={s.langExam}>{lang.exam}</div>
      <div style={s.langBar}>
        <div style={{ height: '100%', width: `${pct}%`, background: lang.color, borderRadius: 2, transition: 'width .6s ease' }} />
      </div>
      <div style={s.langPct}>{lang.phase === 1 ? `${completed}/${total}` : 'Скоро'}</div>
    </div>
  )
}

function LevelRow({ levelKey, level, pct, completed, total, locked, active, onClick }) {
  const color = LEVEL_COLORS[levelKey] ?? '#8B84FF'
  return (
    <div
      onClick={onClick}
      style={{
        ...s.levelRow,
        opacity: locked ? 0.4 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        borderColor: active ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.07)',
        background: active ? 'rgba(108,99,255,0.06)' : '#1A1F35',
      }}
    >
      <div style={{ ...s.levelDot, background: `${color}22`, color }}>
        {levelKey.toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color }}>{level.title}</div>
        <div style={{ fontSize: 12, color: '#8890B0', marginTop: 2 }}>
          {locked
            ? `Нужно ${level.xpRequired?.toLocaleString() ?? '???'} XP`
            : `${completed} из ${total} уроков`}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        {locked ? (
          <span style={{ fontSize: 15, color: '#555E80' }}>🔒</span>
        ) : (
          <>
            <span style={{ fontSize: 11, color: '#555E80', fontWeight: 600 }}>{pct}%</span>
            <div style={s.miniBar}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .6s ease' }} />
            </div>
          </>
        )}
      </div>
      {active && <div style={s.levelActiveLine} />}
    </div>
  )
}

function ProgressBar({ pct }) {
  return (
    <div style={s.progressRow}>
      <div style={s.progressTrack}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#6C63FF,#8B84FF)', borderRadius: 3, transition: 'width .6s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#8890B0', minWidth: 32 }}>{pct}%</span>
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
    <nav style={s.bottomNav}>
      {items.map(item => (
        <div key={item.id} onClick={() => onNavigate(item.id)} style={s.navItem}>
          <span style={{ fontSize: 22, filter: active === item.id ? 'drop-shadow(0 0 6px rgba(139,132,255,0.7))' : 'none' }}>
            {item.icon}
          </span>
          <span style={{ ...s.navLabel, color: active === item.id ? '#8B84FF' : '#555E80' }}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function pluralDays(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'день'
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'дня'
  return 'дней'
}

// ── Styles ───────────────────────────────────────────────────

const s = {
  app:          { maxWidth: 420, margin: '0 auto', minHeight: '100vh', fontFamily: "'Outfit',sans-serif", position: 'relative', paddingBottom: 80, background: '#080B14', color: '#F0F2FF' },
  bgGrid:       { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, backgroundImage: 'linear-gradient(rgba(108,99,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px' },
  bgGlow:       { position: 'fixed', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse,rgba(108,99,255,0.10) 0%,transparent 70%)' },
  topbar:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', position: 'relative', zIndex: 10 },
  logo:         { fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  statsRow:     { display: 'flex', alignItems: 'center', gap: 8 },
  statPill:     { display: 'flex', alignItems: 'center', gap: 4, background: '#1A1F35', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '5px 10px', fontSize: 13, fontWeight: 700 },
  streakCard:   { margin: '8px 20px 0', background: 'linear-gradient(135deg,#1A1220,#1F1530)', border: '1px solid rgba(255,112,67,0.2)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10 },
  metaLabel:    { fontSize: 11, color: '#555E80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' },
  streakValue:  { fontSize: 20, fontWeight: 800, color: '#FF7043', lineHeight: 1.2 },
  streakSub:    { fontSize: 12, color: '#8890B0', marginTop: 1 },
  streakDays:   { display: 'flex', gap: 4 },
  sDay:         { width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#555E80', background: '#232840', border: '1px solid rgba(255,255,255,0.07)' },
  sDayDone:     { background: 'rgba(255,112,67,0.18)', color: '#FF7043', borderColor: 'rgba(255,112,67,0.3)' },
  sDayToday:    { background: '#FF7043', color: 'white', borderColor: '#FF7043' },
  sectionHead:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 10px', position: 'relative', zIndex: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#555E80' },
  sectionLink:  { fontSize: 12, color: '#8B84FF', fontWeight: 600, cursor: 'pointer' },
  langScroll:   { display: 'flex', gap: 12, padding: '0 20px 4px', overflowX: 'auto', scrollbarWidth: 'none', position: 'relative', zIndex: 10 },
  langCard:     { flexShrink: 0, width: 128, borderRadius: 18, padding: '14px 12px', border: '1.5px solid', position: 'relative', overflow: 'hidden', transition: 'all .2s' },
  langBadge:    { position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', background: '#6C63FF', color: 'white', padding: '2px 6px', borderRadius: 5 },
  langExam:     { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', padding: '2px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.08)', color: '#8890B0', display: 'inline-block', marginBottom: 10 },
  langBar:      { height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden', marginBottom: 5 },
  langPct:      { fontSize: 11, color: '#555E80' },
  continueCard: { margin: '4px 20px 0', background: '#1A1F35', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 16, position: 'relative', zIndex: 10, cursor: 'pointer' },
  continueTop:  { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  continueIcon: { width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  continueTitle:{ fontSize: 14, fontWeight: 700, marginTop: 2 },
  continueBtn:  { background: '#6C63FF', color: 'white', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
  progressRow:  { display: 'flex', alignItems: 'center', gap: 10 },
  progressTrack:{ flex: 1, height: 6, background: '#232840', borderRadius: 3, overflow: 'hidden' },
  levelPath:    { display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 20px 0', position: 'relative', zIndex: 10 },
  levelRow:     { display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: '12px 14px', border: '1px solid', position: 'relative', overflow: 'hidden', transition: 'all .15s' },
  levelDot:     { width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 },
  levelActiveLine: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 3, background: '#6C63FF', borderRadius: '0 16px 16px 0' },
  miniBar:      { width: 60, height: 4, background: '#232840', borderRadius: 2, overflow: 'hidden' },
  bottomNav:    { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: '#0D1120ee', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '10px 0 16px', zIndex: 100, backdropFilter: 'blur(12px)' },
  navItem:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '4px 0' },
  navLabel:     { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
}
