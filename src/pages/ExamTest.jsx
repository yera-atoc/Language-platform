import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const testModules = import.meta.glob('../../content/turkish/tomer-prep/*.json')

const FILE_BY_TESTID = {
  tomer_a1:   'mock_test_a1',
  tomer_a2:   'mock_test_a2',
  tomer_b1:   'mock_test_b1',
  tomer_full: 'mock_test_full',
}

export default function ExamTest() {
  const navigate              = useNavigate()
  const { language, testId }  = useParams()
  const [loading, setLoading] = useState(true)
  const [testData, setTestData] = useState(null)
  const [error, setError]     = useState('')
  const [idx, setIdx]         = useState(0)
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [score, setScore]     = useState(0)
  const [done, setDone]       = useState(false)

  const fileBase = FILE_BY_TESTID[testId] ?? null

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(''); setTestData(null)
      if (!fileBase) { setLoading(false); setError('Неизвестный тест.'); return }
      const key    = `../../content/turkish/tomer-prep/${fileBase}.json`
      const loader = testModules[key]
      if (!loader) { setLoading(false); setError('Для этого теста пока нет контента.'); return }
      try {
        const m = await loader()
        if (!cancelled) { setTestData(m.default ?? m); setLoading(false) }
      } catch { if (!cancelled) { setLoading(false); setError('Ошибка загрузки теста.') } }
    }
    load()
    return () => { cancelled = true }
  }, [fileBase])

  useEffect(() => {
    setIdx(0); setSelected(null); setChecked(false); setIsCorrect(null); setScore(0); setDone(false)
  }, [testId])

  const questions = testData?.exercises ?? []
  const total     = questions.length
  const current   = questions[idx]

  const canCheck = useMemo(() => {
    if (!current || checked) return false
    return (current.type === 'multiple_choice' || current.type === 'fill_blank') && selected !== null
  }, [current, selected, checked])

  function check() {
    if (!canCheck) return
    const ok = selected === current.correctAnswer
    setIsCorrect(ok)
    setChecked(true)
    if (ok) setScore(s => s + 1)
  }

  function next() {
    if (idx + 1 >= total) { setDone(true); return }
    setIdx(i => i + 1); setSelected(null); setChecked(false); setIsCorrect(null)
  }

  const back = () => navigate(`/exam`)

  if (loading) return (
    <div style={s.screen}>
      <div style={s.center}><div style={s.spinner} /><p style={s.hint}>Загружаем тест…</p></div>
    </div>
  )

  if (done) {
    const pct = total > 0 ? Math.round(score / total * 100) : 0
    return (
      <div style={s.screen}>
        <div style={s.center}>
          <div style={{ fontSize: 64 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '💪'}</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: '12px 0 4px' }}>
            {pct >= 80 ? 'Отлично!' : pct >= 60 ? 'Хорошо!' : 'Продолжай!'}
          </h1>
          <p style={s.hint}>{score} из {total} правильных · {pct}%</p>
          <div style={{ marginTop: 24, width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button style={s.btn} onClick={back}>← К экзаменам</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.screen}>
      <header style={s.header}>
        <button style={s.backBtn} onClick={back}>✕</button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, background: '#1E2133', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg,#6C63FF,#8B84FF)',
              width: `${total > 0 ? (idx / total) * 100 : 0}%`, transition: 'width .4s ease', borderRadius: 3 }} />
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD060', flexShrink: 0 }}>
          {idx + 1}/{total}
        </span>
      </header>

      {error ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 40 }}>⚠️</p>
          <p style={{ color: '#8890B0', marginTop: 12, lineHeight: 1.6 }}>{error}</p>
          <button style={{ ...s.btn, marginTop: 24 }} onClick={back}>← Назад</button>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>
          {/* Question */}
          <div style={s.card}>
            <p style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.5 }}>{current?.question}</p>
          </div>

          {/* Options */}
          {(current?.type === 'multiple_choice' || current?.type === 'fill_blank') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
              {current.options?.map((opt, i) => {
                const sel   = selected === opt
                const right = checked && opt === current.correctAnswer
                const wrong = checked && sel && opt !== current.correctAnswer
                return (
                  <div key={i} onClick={() => !checked && setSelected(opt)} style={{
                    ...s.option,
                    borderColor: right ? '#4ADE80' : wrong ? '#FF4D6D' : sel ? '#6C63FF' : 'rgba(255,255,255,0.08)',
                    background:  right ? 'rgba(74,222,128,0.08)' : wrong ? 'rgba(255,77,109,0.08)'
                               : sel ? 'rgba(108,99,255,0.08)' : '#141620',
                    cursor: checked ? 'default' : 'pointer',
                  }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0,
                      background: right ? '#4ADE80' : wrong ? '#FF4D6D' : sel ? '#6C63FF' : '#1E2133',
                      color: (right || wrong || sel) ? (right ? '#052012' : '#fff') : '#4A5070' }}>
                      {right ? '✓' : wrong ? '✗' : ['A','B','C','D'][i]}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: right ? '#4ADE80' : wrong ? '#FF4D6D' : '#F0F2FF' }}>
                      {opt}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Feedback */}
          {checked && (
            <div style={{ marginTop: 12, borderRadius: 16, padding: 14,
              border: `1px solid ${isCorrect ? 'rgba(74,222,128,0.25)' : 'rgba(255,77,109,0.25)'}`,
              background: isCorrect ? 'rgba(74,222,128,0.07)' : 'rgba(255,77,109,0.07)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: isCorrect ? '#4ADE80' : '#FF4D6D', marginBottom: 6 }}>
                {isCorrect ? '✅ Правильно!' : '❌ Неверно'}
              </div>
              <div style={{ fontSize: 13, color: '#8890B0', lineHeight: 1.6 }}>{current?.explanation}</div>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {!error && (
        <div style={{ padding: '12px 16px 28px', flexShrink: 0 }}>
          {!checked
            ? <button disabled={!canCheck} onClick={check} style={{ ...s.btn, opacity: canCheck ? 1 : 0.45 }}>
                Проверить
              </button>
            : <button onClick={next} style={{ ...s.btn, background: '#4ADE80', color: '#052012' }}>
                {idx + 1 >= total ? '🎉 Завершить тест' : 'Следующий →'}
              </button>
          }
        </div>
      )}
    </div>
  )
}

const s = {
  screen:  { background: '#08090F', color: '#F0F2FF', minHeight: '100dvh', fontFamily: "'Outfit',sans-serif",
             display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' },
  center:  { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
             justifyContent: 'center', padding: '40px 20px', textAlign: 'center' },
  spinner: { width: 36, height: 36, border: '3px solid rgba(108,99,255,0.2)',
             borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin .7s linear infinite' },
  hint:    { color: '#8890B0', fontSize: 14, marginTop: 10 },
  header:  { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 12px', flexShrink: 0 },
  backBtn: { width: 36, height: 36, borderRadius: 10, background: '#141620',
             border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center',
             justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: '#8890B0',
             fontFamily: 'inherit', flexShrink: 0 },
  card:    { background: '#141620', border: '1px solid rgba(255,255,255,0.08)',
             borderRadius: 18, padding: 16 },
  option:  { border: '1.5px solid', borderRadius: 14, padding: '12px 14px',
             display: 'flex', alignItems: 'center', gap: 11, transition: 'all .12s' },
  btn:     { width: '100%', padding: '15px 20px', borderRadius: 16, border: 'none',
             background: '#6C63FF', color: '#fff', fontSize: 16, fontWeight: 800,
             fontFamily: "'Outfit',sans-serif", cursor: 'pointer' },
}
