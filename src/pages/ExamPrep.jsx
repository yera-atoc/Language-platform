import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useProgressStore from '@store/progressStore'
import useUserStore from '@store/userStore'
import turkishData from '@content/turkish/index.json'

// ── Exam configs per language ────────────────────────────────

const EXAM_CONFIG = {
  turkish: {
    name:     'ТОМЕР',
    fullName: 'Türkçe Yeterlik Sınavı',
    flag:     '🇹🇷',
    color:    '#E74C3C',
    minLevel: 'B1',
    modules: [
      { id: 'listening', icon: '👂', name: 'Аудирование', nametr: 'Dinleme', desc: 'Понимание речи на слух',       unlockLevel: 0, color: '#4ECDC4' },
      { id: 'reading',   icon: '📖', name: 'Чтение',      nametr: 'Okuma',   desc: 'Тексты и понимание прочитанного', unlockLevel: 0, color: '#FFD060' },
      { id: 'writing',   icon: '✍️', name: 'Письмо',      nametr: 'Yazma',   desc: 'Эссе, письма, изложения',      unlockLevel: 2, color: '#8B84FF' },
      { id: 'speaking',  icon: '🗣️', name: 'Говорение',   nametr: 'Konuşma', desc: 'Диалоги и монологи',           unlockLevel: 2, color: '#FF9F43' },
    ],
    tests: [
      { id: 'tomer_a1', title: 'Пробный тест A1', questions: 25, minutes: 20, unlockLevel: 0, file: 'mock_test_a1' },
      { id: 'tomer_a2', title: 'Пробный тест A2', questions: 30, minutes: 25, unlockLevel: 1, file: 'mock_test_a2' },
      { id: 'tomer_b1', title: 'Пробный тест B1', questions: 40, minutes: 35, unlockLevel: 2, file: 'mock_test_b1' },
      { id: 'tomer_full', title: 'Полный экзамен ТОМЕР', questions: 80, minutes: 90, unlockLevel: 3, file: 'mock_test_full' },
    ],
    tips: [
      { icon: '💡', title: 'Структура экзамена', text: 'ТОМЕР состоит из 4 частей: Dinleme (аудирование), Okuma (чтение), Yazma (письмо) и Konuşma (говорение). Каждая часть — 25% итогового балла.' },
      { icon: '🎯', title: 'Проходной балл',     text: 'Для сертификата нужно минимум 60% по каждой части и 70% суммарно. ТОМЕР B1 открывает базовые права при оформлении ВНЖ в Турции.' },
      { icon: '📅', title: 'Где сдать',           text: 'ТОМЕР сдаётся в центрах Türkçe Öğretim Merkezi при университетах Турции. Экзамен проводится онлайн и очно в Анкаре, Стамбуле, Измире.' },
      { icon: '📚', title: 'Как готовиться',      text: 'Завершите все уровни A1–B2 на платформе. Решайте пробные тесты регулярно. Слушайте турецкое радио (TRT) и читайте простые тексты.' },
    ],
  },
}

// ── Helper: completed level index ────────────────────────────

function useCompletedLevelIndex(language) {
  const { getLevelProgress } = useProgressStore()
  const data = turkishData
  const keys = Object.keys(data.levels)
  for (let i = keys.length - 1; i >= 0; i--) {
    const key  = keys[i]
    const total = data.levels[key]?.lessons?.length ?? 20
    if (getLevelProgress(language, key).completed >= total) return i + 1
  }
  return 0
}

// ── Main Component ───────────────────────────────────────────

export default function ExamPrep() {
  const { language = 'turkish' } = useParams()
  const navigate     = useNavigate()
  const config       = EXAM_CONFIG[language] ?? EXAM_CONFIG.turkish
  const completedIdx = useCompletedLevelIndex(language)
  const { getLevelProgress } = useProgressStore()

  // Readiness: proportion of A1 lessons done × 100, capped at 100
  const a1Lessons = turkishData.levels.a1?.lessons?.length ?? 20
  const a1Done    = getLevelProgress(language, 'a1').completed
  const readiness = Math.round((a1Done / a1Lessons) * 100)

  // Best scores per test (stored in localStorage as quick mock)
  const [scores] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`exam-scores-${language}`) ?? '{}') } catch { return {} }
  })

  function startTest(test) {
    if (test.unlockLevel > completedIdx) return
    navigate(`/exam-test/${language}/${test.id}`)
  }

  return (
    <div style={s.screen}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={s.bgGrid} />

      {/* ── Header ── */}
      <header style={s.header}>
        <button style={s.backBtn} onClick={() => navigate(-1)}>←</button>
        <div style={{ flex: 1 }}>
          <div style={s.headerTitle}>Подготовка к {config.name}</div>
          <div style={s.headerSub}>{config.fullName}</div>
        </div>
        <span style={{ fontSize: 24 }}>{config.flag}</span>
      </header>

      {/* ── Exam hero ── */}
      <div style={{ ...s.hero, borderColor: `${config.color}44`, background: `linear-gradient(135deg,${config.color}1A,${config.color}08)` }}>
        <div style={s.heroTop}>
          <span style={{ fontSize: 40 }}>🎓</span>
          <div>
            <div style={s.heroName}>{config.name}</div>
            <div style={{ ...s.heroExam, color: config.color }}>Уровень {config.minLevel} и выше</div>
          </div>
        </div>
        <div style={s.heroStats}>
          <HeroStat label="Готовность"    value={`${readiness}%`}        color="#FF9F43" />
          <HeroStat label="Пробных тестов" value={`${Object.keys(scores).length} / ${config.tests.length}`} />
          <HeroStat label="Лучший балл"   value={Object.values(scores).length > 0 ? `${Math.max(...Object.values(scores))}%` : '—'} color="#4ADE80" />
        </div>
        <div style={s.readinessTrack}>
          <div style={{ ...s.readinessFill, width: `${readiness}%` }} />
        </div>
        <div style={s.readinessLabels}>
          <span>Начинающий</span>
          <span>Готов к {config.name} {config.minLevel}</span>
        </div>
      </div>

      {/* ── Modules ── */}
      <SectionHead title={`Навыки ${config.name}`} />
      <div style={s.modulesGrid}>
        {config.modules.map(mod => {
          const unlocked = completedIdx >= mod.unlockLevel
          return (
            <div key={mod.id} style={{ ...s.moduleCard, opacity: unlocked ? 1 : 0.5, cursor: unlocked ? 'pointer' : 'not-allowed' }}>
              {!unlocked && <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 13 }}>🔒</span>}
              <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>{mod.icon}</span>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{mod.name}</div>
              <div style={{ fontSize: 12, color: '#555E80', lineHeight: 1.4 }}>{mod.nametr} · {mod.desc}</div>
              <div style={s.modBar}>
                <div style={{ height: '100%', width: unlocked ? `${Math.min(readiness, 100)}%` : '0%', background: mod.color, borderRadius: 2, transition: 'width .8s ease' }} />
              </div>
              <div style={{ fontSize: 11, color: '#555E80', marginTop: 5 }}>
                {unlocked ? `${Math.min(readiness, 100)}% готовности` : `Нужен уровень ${['A1','A2','B1','B2'][mod.unlockLevel]}`}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Practice tests ── */}
      <SectionHead title="Пробные тесты" />
      <div style={s.testList}>
        {config.tests.map(test => {
          const unlocked  = completedIdx >= test.unlockLevel
          const bestScore = scores[test.id] ?? null
          const done      = bestScore !== null
          return (
            <div
              key={test.id}
              onClick={() => startTest(test)}
              style={{ ...s.testRow, opacity: unlocked ? 1 : 0.45, cursor: unlocked ? 'pointer' : 'not-allowed' }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>{done ? '✅' : '📝'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{test.title}</div>
                <div style={{ fontSize: 12, color: '#555E80', marginTop: 2 }}>
                  {test.questions} вопросов · ~{test.minutes} мин
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                {!unlocked
                  ? <TestBadge type="locked" text={`🔒 ${['A1','A2','B1','B2'][test.unlockLevel]}`} />
                  : done
                  ? <><TestBadge type="done" text="Пройден" /><span style={{ fontSize: 11, color: '#555E80' }}>Лучший: {bestScore}%</span></>
                  : <TestBadge type="new" text="Доступен" />
                }
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Tips ── */}
      <SectionHead title={`Советы по ${config.name}`} />
      <div style={s.tipsList}>
        {config.tips.map((tip, i) => (
          <div key={i} style={s.tipRow}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{tip.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: '#8890B0', lineHeight: 1.6 }}>{tip.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 80 }} />

      {/* ── Bottom nav ── */}
      <BottomNav onNavigate={tab => {
        if (tab === 'home')     navigate('/')
        if (tab === 'lessons')  navigate('/lessons/turkish/a1')
        if (tab === 'progress') navigate('/progress')
        if (tab === 'profile')  navigate('/profile')
      }} />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function SectionHead({ title }) {
  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '16px 20px 10px', position: 'relative', zIndex: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#555E80' }}>
        {title}
      </span>
    </div>
  )
}

function HeroStat({ label, value, color }) {
  return (
    <div style={{ fontSize: 12, color: '#555E80' }}>
      {label}: <span style={{ color: color ?? '#F0F2FF', fontWeight: 700 }}>{value}</span>
    </div>
  )
}

function TestBadge({ type, text }) {
  const styles = {
    locked: { background: '#232840',                    color: '#555E80' },
    new:    { background: 'rgba(108,99,255,0.18)',       color: '#8B84FF' },
    done:   { background: 'rgba(74,222,128,0.12)',       color: '#4ADE80' },
  }
  return (
    <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 7, ...styles[type] }}>
      {text}
    </div>
  )
}

function BottomNav({ onNavigate }) {
  const items = [
    { id: 'home',     icon: '🏠', label: 'Главная' },
    { id: 'lessons',  icon: '📖', label: 'Уроки'   },
    { id: 'progress', icon: '📊', label: 'Прогресс'},
    { id: 'ranking',  icon: '🏆', label: 'Рейтинг' },
    { id: 'profile',  icon: '👤', label: 'Профиль' },
  ]
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 420, background: '#0D1120ee', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', padding: '10px 0 16px', zIndex: 100, backdropFilter: 'blur(12px)' }}>
      {items.map(item => (
        <div key={item.id} onClick={() => onNavigate(item.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '4px 0' }}>
          <span style={{ fontSize: 22 }}>{item.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: '#555E80' }}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  )
}

// ── Styles ────────────────────────────────────────────────────

const s = {
  screen:         { background: '#080B14', color: '#F0F2FF', minHeight: '100vh', fontFamily: "'Outfit',sans-serif", position: 'relative' },
  bgGrid:         { position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(108,99,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(108,99,255,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' },
  header:         { maxWidth: 420, margin: '0 auto', padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10 },
  backBtn:        { width: 36, height: 36, borderRadius: 10, background: '#1A1F35', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 15, color: '#8890B0', fontFamily: 'inherit', flexShrink: 0 },
  headerTitle:    { fontSize: 20, fontWeight: 800 },
  headerSub:      { fontSize: 12, color: '#555E80', marginTop: 2 },

  hero:           { maxWidth: 420, margin: '0 auto 4px', padding: 20, borderRadius: 20, border: '1px solid', position: 'relative', zIndex: 10, marginLeft: 20, marginRight: 20, overflow: 'hidden' },
  heroTop:        { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 },
  heroName:       { fontSize: 18, fontWeight: 800 },
  heroExam:       { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginTop: 2 },
  heroStats:      { display: 'flex', gap: 16, flexWrap: 'wrap' },
  readinessTrack: { height: 8, background: '#232840', borderRadius: 4, overflow: 'hidden', marginTop: 14 },
  readinessFill:  { height: '100%', background: 'linear-gradient(90deg,#E74C3C,#FF9F43)', borderRadius: 4, transition: 'width .8s ease' },
  readinessLabels:{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555E80', marginTop: 5 },

  modulesGrid:    { maxWidth: 420, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px', position: 'relative', zIndex: 10 },
  moduleCard:     { background: '#1A1F35', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 16, position: 'relative', overflow: 'hidden', transition: 'all .15s' },
  modBar:         { height: 4, background: '#232840', borderRadius: 2, overflow: 'hidden', marginTop: 10 },

  testList:       { maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px', position: 'relative', zIndex: 10 },
  testRow:        { display: 'flex', alignItems: 'center', gap: 12, background: '#1A1F35', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '13px 14px', transition: 'all .15s' },

  tipsList:       { maxWidth: 420, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px', position: 'relative', zIndex: 10 },
  tipRow:         { display: 'flex', gap: 12, background: '#1A1F35', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 14px' },
}
