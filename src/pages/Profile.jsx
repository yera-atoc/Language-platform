import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/app/firebase'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'
import turkishData from '@content/turkish/index.json'

// ── Badge definitions ─────────────────────────────────────────

const BADGES = [
  { id: 'first_lesson',    icon: '🌱', name: 'Первый шаг',     condition: (stats) => stats.totalLessons >= 1  },
  { id: 'streak_3',        icon: '🔥', name: '3 дня подряд',   condition: (stats) => stats.streak >= 3        },
  { id: 'perfect_lesson',  icon: '⭐', name: 'Идеальный',      condition: (stats) => stats.hasPerfect         },
  { id: 'lessons_5',       icon: '📖', name: '5 уроков',       condition: (stats) => stats.totalLessons >= 5  },
  { id: 'a1_complete',     icon: '🏆', name: 'A1 пройден',     condition: (stats) => stats.a1Complete         },
  { id: 'streak_7',        icon: '💎', name: '7 дней подряд',  condition: (stats) => stats.streak >= 7        },
  { id: 'lessons_10',      icon: '🚀', name: '10 уроков',      condition: (stats) => stats.totalLessons >= 10 },
  { id: 'accuracy_100',    icon: '🎯', name: '100% точность',  condition: (stats) => stats.hasPerfect         },
  { id: 'xp_500',          icon: '⚡', name: '500 XP',         condition: (stats) => stats.xp >= 500          },
  { id: 'xp_1000',         icon: '💫', name: '1000 XP',        condition: (stats) => stats.xp >= 1000         },
  { id: 'streak_30',       icon: '👑', name: '30 дней подряд', condition: (stats) => stats.streak >= 30       },
  { id: 'all_languages',   icon: '🌍', name: 'Полиглот',       condition: () => false                         },
]

// ── Achievement definitions ───────────────────────────────────

const ACHIEVEMENTS = [
  {
    id: 'first_lesson',
    icon: '🎉', title: 'Первый урок',
    desc: 'Пройди первый урок',
    xp: 50,
    progress: (stats) => Math.min(stats.totalLessons, 1),
    total: 1,
  },
  {
    id: 'streak_7',
    icon: '🔥', title: '7 дней подряд',
    desc: 'Занимайся 7 дней без пропуска',
    xp: 150,
    progress: (stats) => Math.min(stats.streak, 7),
    total: 7,
  },
  {
    id: 'a1_complete',
    icon: '📚', title: 'Мастер A1',
    desc: 'Пройди все 20 уроков A1',
    xp: 500,
    progress: (stats) => stats.a1Completed,
    total: 20,
  },
  {
    id: 'accuracy_perfect',
    icon: '🎯', title: 'Снайпер',
    desc: 'Пройди 3 урока с 100% точностью',
    xp: 200,
    progress: (stats) => Math.min(stats.perfectCount, 3),
    total: 3,
  },
  {
    id: 'xp_500',
    icon: '⚡', title: '500 XP',
    desc: 'Набери 500 очков опыта',
    xp: 100,
    progress: (stats) => Math.min(stats.xp, 500),
    total: 500,
  },
  {
    id: 'lessons_10',
    icon: '🚀', title: 'Десятка',
    desc: 'Пройди 10 уроков',
    xp: 200,
    progress: (stats) => Math.min(stats.totalLessons, 10),
    total: 10,
  },
]

// ── Settings items ────────────────────────────────────────────

const SETTINGS = [
  { id: 'notifications', icon: '🔔', label: 'Уведомления'       },
  { id: 'theme',         icon: '🌙', label: 'Тёмная тема'       },
  { id: 'language',      icon: '🌐', label: 'Язык интерфейса'   },
  { id: 'password',      icon: '🔒', label: 'Изменить пароль'   },
]

// ── Main Component ────────────────────────────────────────────

export default function Profile() {
  const navigate  = useNavigate()
  const { xp, level, streak, lives, user, profile, reset } = useUserStore()
  const { progress, getLevelProgress, getLessonProgress } = useProgressStore()
  const [loggingOut, setLoggingOut] = useState(false)

  // Compute stats for badges/achievements
  const a1Data    = turkishData.levels.a1
  const a1Lessons = a1Data?.lessons ?? []
  const a1Progress = getLevelProgress('turkish', 'a1')

  const scores = a1Lessons
    .map(l => getLessonProgress('turkish', 'a1', l.id)?.score)
    .filter(Boolean)

  const avgAccuracy  = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0
  const perfectCount = scores.filter(s => s === 100).length
  const hasPerfect   = perfectCount > 0
  const a1Complete   = a1Progress.completed >= a1Lessons.length && a1Lessons.length > 0
  const totalLessons = a1Progress.completed

  const stats = { xp, streak, totalLessons, hasPerfect, perfectCount, a1Complete, a1Completed: a1Progress.completed }

  const earnedBadges = BADGES.filter(b => b.condition(stats)).length

  // Avatar initials
  const displayName = profile?.displayName ?? user?.displayName ?? 'Student'
  const initials    = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const joinDate    = profile?.createdAt
    ? new Date(profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' })
    : ''

  // Sign out
  async function handleSignOut() {
    setLoggingOut(true)
    try {
      await signOut(auth)
      reset()
      navigate('/auth')
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div style={s.screen}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.07)}100%{transform:scale(1)}}
      `}</style>
      <div style={s.bgGrid} />

      {/* ── Avatar section ── */}
      <div style={s.avatarSection}>
        <div style={s.avatar}>{initials}</div>
        <h2 style={s.username}>{displayName}</h2>
        <div style={s.userSub}>
          {user?.email}
          {joinDate && ` · с ${joinDate}`}
        </div>
        <div style={s.levelPill}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFD060' }}>
            ⚡ Уровень {level}
          </span>
          <span style={{ fontSize: 12, color: '#555E80' }}>
            · {level <= 2 ? 'Новичок' : level <= 5 ? 'Ученик' : level <= 9 ? 'Знаток' : 'Эксперт'}
          </span>
        </div>
      </div>

      {/* ── Mini stats row ── */}
      <div style={s.miniRow}>
        <MiniStat value={xp}              label="XP"        color="#FFD060" />
        <MiniStat value={`🔥 ${streak}`}  label="Стрик"     color="#FF7043" />
        <MiniStat value={totalLessons}    label="Уроков"    color="#4ECDC4" />
        <MiniStat value={`${avgAccuracy}%`} label="Точность" color="#4ADE80" />
      </div>

      {/* ── Badges ── */}
      <SectionHead title="Бейджи" count={`${earnedBadges} / ${BADGES.length}`} />
      <div style={s.badgesGrid}>
        {BADGES.map(badge => {
          const earned = badge.condition(stats)
          return (
            <div key={badge.id} style={{
              ...s.badgeItem,
              borderColor:  earned ? 'rgba(255,208,96,0.3)' : 'rgba(255,255,255,0.07)',
              background:   earned ? 'rgba(255,208,96,0.07)' : '#1A1F35',
              opacity:      earned ? 1 : 0.35,
              filter:       earned ? 'none' : 'grayscale(0.7)',
            }}>
              <span style={{ fontSize: 26, lineHeight: 1 }}>{badge.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: earned ? '#FFD060' : '#8890B0', textAlign: 'center', lineHeight: 1.3 }}>
                {badge.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Achievements ── */}
      <SectionHead title="Достижения" />
      <div style={s.achieveList}>
        {ACHIEVEMENTS.map(a => {
          const prog  = a.progress(stats)
          const pct   = Math.round((prog / a.total) * 100)
          const done  = prog >= a.total
          return (
            <div key={a.id} style={{
              ...s.achieveRow,
              borderColor: done ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.07)',
              background:  done ? 'rgba(74,222,128,0.04)' : '#1A1F35',
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: '#555E80', marginTop: 2 }}>{a.desc}</div>
                {!done && (
                  <div style={s.achieveBar}>
                    <div style={{ ...s.achieveBarFill, width: `${pct}%` }} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                <div style={s.xpBadge}>+{a.xp} XP</div>
                {done
                  ? <span style={{ fontSize: 16 }}>✅</span>
                  : <span style={{ fontSize: 11, color: '#555E80', fontFamily: "'DM Mono',monospace" }}>{prog}/{a.total}</span>
                }
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Settings ── */}
      <SectionHead title="Настройки" />
      <div style={s.settingsList}>
        {SETTINGS.map(item => (
          <div key={item.id} style={s.settingRow}>
            <span style={{ fontSize: 18, width: 32, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{item.label}</span>
            <span style={{ fontSize: 14, color: '#555E80' }}>›</span>
          </div>
        ))}

        {/* Sign out */}
        <div
          onClick={handleSignOut}
          style={{ ...s.settingRow, cursor: 'pointer' }}
        >
          <span style={{ fontSize: 18, width: 32, textAlign: 'center' }}>
            {loggingOut ? '⏳' : '📤'}
          </span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#FF4D6D' }}>
            {loggingOut ? 'Выходим…' : 'Выйти'}
          </span>
          <span style={{ fontSize: 14, color: '#555E80' }}>›</span>
        </div>
      </div>

      <div style={{ height: 80 }} />

      {/* ── Bottom nav ── */}
      <BottomNav active="profile" onNavigate={tab => {
        if (tab === 'home')     navigate('/')
        if (tab === 'lessons')  navigate('/lessons/turkish/a1')
        if (tab === 'progress') navigate('/progress')
      }} />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function MiniStat({ value, label, color }) {
  return (
    <div style={s.miniStat}>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'DM Mono',monospace" }}>{value}</div>
      <div style={{ fontSize: 10, color: '#555E80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 3 }}>{label}</div>
    </div>
  )
}

function SectionHead({ title, count }) {
  return (
    <div style={s.sectionHead}>
      <span style={s.sectionTitle}>{title}</span>
      {count && <span style={{ fontSize: 12, color: '#555E80' }}>{count}</span>}
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

// ── Styles ────────────────────────────────────────────────────

const s = {
  screen:       { background: '#080B14', color: '#F0F2FF', minHeight: '100vh', fontFamily: "'Outfit',sans-serif", position: 'relative' },
  bgGrid:       { position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(108,99,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' },

  avatarSection:{ maxWidth: 420, margin: '0 auto', padding: '28px 20px 20px', textAlign: 'center', position: 'relative', zIndex: 10 },
  avatar:       { width: 84, height: 84, borderRadius: '50%', margin: '0 auto 12px', background: 'linear-gradient(135deg,#6C63FF,#8B84FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, border: '3px solid rgba(108,99,255,0.4)', boxShadow: '0 0 24px rgba(108,99,255,0.25)' },
  username:     { fontSize: 20, fontWeight: 800 },
  userSub:      { fontSize: 13, color: '#555E80', marginTop: 3 },
  levelPill:    { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,208,96,0.1)', border: '1px solid rgba(255,208,96,0.22)', borderRadius: 20, padding: '5px 14px', marginTop: 10 },

  miniRow:      { maxWidth: 420, margin: '0 auto', display: 'flex', padding: '0 20px 4px', gap: 10, position: 'relative', zIndex: 10 },
  miniStat:     { flex: 1, background: '#1A1F35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 8px', textAlign: 'center' },

  sectionHead:  { maxWidth: 420, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 10px', position: 'relative', zIndex: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#555E80' },

  badgesGrid:   { maxWidth: 420, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, padding: '0 20px', position: 'relative', zIndex: 10 },
  badgeItem:    { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px', borderRadius: 14, border: '1px solid', transition: 'all .15s' },

  achieveList:  { maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px', position: 'relative', zIndex: 10 },
  achieveRow:   { display: 'flex', alignItems: 'center', gap: 12, border: '1px solid', borderRadius: 14, padding: '12px 14px' },
  achieveBar:   { height: 4, background: '#232840', borderRadius: 2, overflow: 'hidden', marginTop: 6, width: '100%' },
  achieveBarFill:{ height: '100%', background: '#4ADE80', borderRadius: 2, transition: 'width .6s ease' },
  xpBadge:      { fontSize: 11, fontWeight: 700, color: '#FFD060', background: 'rgba(255,208,96,0.1)', padding: '2px 7px', borderRadius: 7 },

  settingsList: { maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 6, padding: '0 20px', position: 'relative', zIndex: 10 },
  settingRow:   { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: '#1A1F35', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, cursor: 'pointer', transition: 'background .15s' },

  nav:          { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: '#0D1120ee', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '10px 0 16px', zIndex: 100, backdropFilter: 'blur(12px)' },
  navItem:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '4px 0' },
}
