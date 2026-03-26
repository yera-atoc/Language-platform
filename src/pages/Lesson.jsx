import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'
import { syncNow } from '@hooks/useFirestoreSync'

// ── Lesson loader ─────────────────────────────────────────────
function useLessonData(language, level, lessonId) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    import(`../../content/${language}/${level}/${lessonId}.json`)
      .then(m => { setData(m.default); setLoading(false) })
      .catch(() => { setData(null); setLoading(false) })
  }, [language, level, lessonId])
  return { data, loading }
}

// ── TTS Audio ─────────────────────────────────────────────────
function speak(text, language) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const langMap = { turkish: 'tr-TR', chinese: 'zh-CN', english: 'en-US' }
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = langMap[language] || 'tr-TR'
  utt.rate = 0.85
  window.speechSynthesis.speak(utt)
}

// ── Audio Button ──────────────────────────────────────────────
function AudioBtn({ text, language, size = 36, color = '#6C63FF' }) {
  const [playing, setPlaying] = useState(false)
  const handle = () => {
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return }
    setPlaying(true)
    speak(text, language)
    setTimeout(() => setPlaying(false), (text.length * 120) + 500)
  }
  return (
    <button onClick={handle} style={{
      width: size, height: size, borderRadius: '50%', border: 'none',
      background: playing ? color : `${color}22`,
      color: playing ? '#fff' : color,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, flexShrink: 0, transition: 'all .15s',
      boxShadow: playing ? `0 0 12px ${color}55` : 'none',
    }}>
      {playing ? '⏸' : '🔊'}
    </button>
  )
}

// ── Constants ─────────────────────────────────────────────────
const TIMER_SEC = 30
const CIRC      = 2 * Math.PI * 26  // r=26
const LETTERS   = ['A', 'B', 'C', 'D']
const STEPS     = [
  { id: 'intro',     icon: '🎯', label: 'Цели'       },
  { id: 'grammar',   icon: '📖', label: 'Грамматика' },
  { id: 'vocab',     icon: '🃏', label: 'Слова'      },
  { id: 'dialogue',  icon: '💬', label: 'Диалог'     },
  { id: 'exercises', icon: '✏️', label: 'Практика'   },
]

// ── XP Burst animation ────────────────────────────────────────
function xpBurst(text = '+10 XP') {
  const el = document.createElement('div')
  el.textContent = text
  el.style.cssText = `position:fixed;top:42%;left:50%;transform:translate(-50%,-50%);
    font-size:24px;font-weight:900;color:#FFD060;pointer-events:none;z-index:9999;
    font-family:'Outfit',sans-serif;text-shadow:0 2px 10px #00000055;
    animation:xpPop .9s ease forwards`
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 900)
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Lesson() {
  const { language, level, lessonId } = useParams()
  const navigate                      = useNavigate()
  const { data, loading }             = useLessonData(language, level, lessonId)
  const { addXP, loseLife, lives, updateStreak } = useUserStore()
  const { completeLesson }            = useProgressStore()

  const [step, setStep]           = useState(0)
  const [stepAnim, setStepAnim]   = useState('in')
  const [exIndex, setExIndex]     = useState(0)
  const [selected, setSelected]   = useState(null)
  const [matchState, setMatchState] = useState({})
  const [matchLeft, setMatchLeft] = useState(null)
  const [checked, setChecked]     = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [correctCount, setCCount] = useState(0)
  const [showComplete, setComplete] = useState(false)
  const [timeLeft, setTimeLeft]   = useState(TIMER_SEC)
  const [flipped, setFlipped]     = useState({})
  const [flippedVocab, setFlippedVocab] = useState({})

  const timerRef  = useRef(null)
  const startRef  = useRef(Date.now())
  const shuffRef  = useRef(null)

  const exercises = data?.exercises ?? []
  const current   = exercises[exIndex]

  // Animate step transitions
  const goStep = useCallback((n) => {
    setStepAnim('out')
    setTimeout(() => { setStep(n); setStepAnim('in') }, 220)
  }, [])

  // Timer
  const stopTimer  = useCallback(() => clearInterval(timerRef.current), [])
  const startTimer = useCallback(() => {
    stopTimer(); setTimeLeft(TIMER_SEC)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { stopTimer(); return 0 } return t - 1 })
    }, 1000)
  }, [stopTimer])

  useEffect(() => {
    if (timeLeft === 0 && !checked) { setChecked(true); setIsCorrect(false); loseLife() }
  }, [timeLeft, checked, loseLife])

  useEffect(() => {
    if (step === 4 && !showComplete && current) startTimer()
    return stopTimer
  }, [exIndex, step, showComplete]) // eslint-disable-line

  useEffect(() => {
    if (current?.type === 'match_pairs') {
      shuffRef.current = [...(current.pairs || [])].sort(() => Math.random() - 0.5)
    }
  }, [exIndex, current])

  // Exercise logic
  const canCheck = (() => {
    if (!current || checked) return false
    if (current.type === 'multiple_choice' || current.type === 'fill_blank') return selected !== null
    if (current.type === 'match_pairs') return Object.keys(matchState).length === (current.pairs?.length ?? 0)
    return false
  })()

  function checkAnswer() {
    if (!canCheck) return
    stopTimer(); setChecked(true)
    let ok = false
    if (current.type === 'multiple_choice' || current.type === 'fill_blank') ok = selected === current.correctAnswer
    if (current.type === 'match_pairs') ok = current.pairs?.every(p => matchState[p.left] === p.right)
    setIsCorrect(ok)
    if (ok) { setCCount(c => c + 1); xpBurst() } else loseLife()
  }

  function nextExercise() {
    if (exIndex + 1 >= exercises.length) return finishLesson()
    setExIndex(i => i + 1)
    setSelected(null); setMatchState({}); setMatchLeft(null)
    setChecked(false); setIsCorrect(null)
  }

  function finishLesson() {
    stopTimer()
    const elapsed = Math.round((Date.now() - startRef.current) / 1000)
    const finalOk = correctCount + (checked && isCorrect ? 1 : 0)
    const score   = exercises.length > 0 ? Math.round(finalOk / exercises.length * 100) : 0
    const xp      = score >= 80 ? (data?.xpReward ?? 60) : Math.round((data?.xpReward ?? 60) * 0.5)
    addXP(xp); updateStreak(); completeLesson(language, level, lessonId, score)
    const uid = useUserStore.getState().user?.uid
    if (uid) syncNow(uid).catch(() => {})
    setComplete({ elapsed, finalOk, score, xp })
  }

  function handleMatchLeft(w)  { if (checked) return; setMatchLeft(x => x === w ? null : w) }
  function handleMatchRight(r) {
    if (checked || !matchLeft) return
    setMatchState(p => ({ ...p, [matchLeft]: r })); setMatchLeft(null)
  }

  // Derived
  const timerPct    = timeLeft / TIMER_SEC
  const timerColor  = timeLeft <= 10 ? '#FF4D6D' : timeLeft <= 20 ? '#FFD060' : '#4ADE80'
  const dashOffset  = CIRC * (1 - timerPct)
  const exPct       = exercises.length > 0 ? (exIndex / exercises.length) * 100 : 0
  const langFlag    = language === 'turkish' ? '🇹🇷' : language === 'chinese' ? '🇨🇳' : '🌐'

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <Page><div style={css.center}><Spinner /></div></Page>
  )
  if (!data) return (
    <Page><div style={css.center}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
      <p style={{ color: 'var(--t2)', marginBottom: 24 }}>Урок не найден</p>
      <Btn variant="ghost" onClick={() => navigate(-1)}>← Назад</Btn>
    </div></Page>
  )

  // ── Completion screen ─────────────────────────────────────────
  if (showComplete) {
    const { elapsed, finalOk, score, xp } = showComplete
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1
    return (
      <Page>
        <div style={css.completeWrap}>
          <div style={{ fontSize: 72, animation: 'popIn .4s ease' }}>
            {score >= 80 ? '🏆' : score >= 60 ? '⭐' : '💪'}
          </div>
          <h1 style={css.completeTitle}>
            {score >= 80 ? 'Отлично!' : score >= 60 ? 'Хорошо!' : 'Продолжай!'}
          </h1>
          <div style={css.starsRow}>
            {[1,2,3].map(i => (
              <span key={i} style={{ fontSize: 32, opacity: i <= stars ? 1 : 0.2,
                animation: i <= stars ? `starPop .3s ${i*0.1}s ease both` : 'none' }}>⭐</span>
            ))}
          </div>
          <div style={css.statsGrid}>
            <StatCard icon="⚡" label="XP" value={`+${xp}`} color="#FFD060" />
            <StatCard icon="✅" label="Верно" value={`${finalOk}/${exercises.length}`} color="#4ADE80" />
            <StatCard icon="⏱️" label="Время" value={`${mins}:${String(secs).padStart(2,'0')}`} color="#8B84FF" />
            <StatCard icon="🎯" label="Точность" value={`${score}%`} color="#FF6B9D" />
          </div>

          {data.summary && (
            <div style={css.summaryBox}>
              <div style={css.summaryHead}>📝 {data.summary.title}</div>
              {data.summary.points?.map((pt, i) => (
                <div key={i} style={css.summaryRow}>
                  <span style={{ color: '#4ADE80', marginRight: 8, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{pt}</span>
                </div>
              ))}
              {data.summary.next_lesson && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--t3)',
                  borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  → {data.summary.next_lesson}
                </div>
              )}
            </div>
          )}

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn variant="success" onClick={() => navigate(-1)}>← К урокам</Btn>
            <Btn variant="ghost" onClick={() => {
              setStep(0); setExIndex(0); setSelected(null); setMatchState({})
              setMatchLeft(null); setChecked(false); setIsCorrect(null)
              setCCount(0); setComplete(false); setFlipped({}); setFlippedVocab({})
              startRef.current = Date.now()
            }}>🔄 Повторить урок</Btn>
          </div>
        </div>
      </Page>
    )
  }

  // ── Header ────────────────────────────────────────────────────
  const header = (
    <header style={css.header}>
      <button style={css.closeBtn} onClick={() => navigate(-1)}>✕</button>
      <div style={{ flex: 1 }}>
        <div style={css.progTrack}>
          <div style={{ ...css.progBar,
            width: step < 4 ? `${(step / STEPS.length) * 100}%` : `${exPct}%` }} />
        </div>
      </div>
      <div style={css.livesRow}>
        {Array.from({ length: 5 }).map((_,i) => (
          <span key={i} style={{ fontSize: 14, filter: i < lives ? 'none' : 'grayscale(1)', opacity: i < lives ? 1 : 0.3 }}>❤️</span>
        ))}
      </div>
    </header>
  )

  // ── Step nav ──────────────────────────────────────────────────
  const stepNav = (
    <div style={css.stepNav}>
      {STEPS.map((st, i) => {
        const done   = i < step
        const active = i === step
        return (
          <div key={st.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              ...css.stepDot,
              background: done ? '#4ADE80' : active ? '#6C63FF' : 'var(--s2)',
              color: done ? '#052012' : active ? '#fff' : 'var(--t3)',
              boxShadow: active ? '0 0 0 4px rgba(108,99,255,0.2)' : 'none',
              transform: active ? 'scale(1.1)' : 'scale(1)',
            }}>
              {done ? '✓' : st.icon}
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '.5px', color: active ? '#8B84FF' : 'var(--t3)' }}>
              {st.label}
            </span>
          </div>
        )
      })}
    </div>
  )

  const animStyle = {
    animation: stepAnim === 'in'
      ? 'slideIn .22s cubic-bezier(.22,1,.36,1) both'
      : 'slideOut .18s ease both'
  }

  // ─────────────────────────────────────────────────────────────
  // STEP 0 — INTRO
  // ─────────────────────────────────────────────────────────────
  if (step === 0) return (
    <Page>
      {header}{stepNav}
      <div style={{ ...css.scroll, ...animStyle }}>
        <div style={css.langBadge}>{langFlag} {language === 'turkish' ? 'Турецкий' : 'Китайский'} · {level.toUpperCase()}</div>
        <h1 style={css.lessonTitle}>{data.title}</h1>
        <div style={css.introCard}>
          <AudioBtn text={data.intro?.text?.slice(0, 200) || data.title} language={language} color="#8B84FF" />
          <p style={css.introText}>{data.intro?.text}</p>
        </div>
        {data.intro?.goals?.length > 0 && (
          <div style={css.goalsCard}>
            <div style={css.goalsHead}>🎯 Цели урока</div>
            {data.intro.goals.map((g, i) => (
              <div key={i} style={css.goalRow}>
                <div style={css.goalNum}>{i + 1}</div>
                <span style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.5 }}>{g}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 24 }} />
        <Btn variant="primary" onClick={() => goStep(1)}>Начать урок →</Btn>
        <div style={{ height: 32 }} />
      </div>
    </Page>
  )

  // ─────────────────────────────────────────────────────────────
  // STEP 1 — GRAMMAR
  // ─────────────────────────────────────────────────────────────
  if (step === 1) return (
    <Page>
      {header}{stepNav}
      <div style={{ ...css.scroll, ...animStyle }}>
        {data.grammar?.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 20 }}>
            <div style={css.sectionTag}>Грамматика {gi + 1}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <h2 style={{ ...css.sectionTitle, flex: 1 }}>{g.title}</h2>
              <AudioBtn text={g.title + '. ' + g.explanation} language="ru-RU" color="#4ADE80" />
            </div>
            <div style={css.grammarCard}>
              <p style={css.grammarText}>{g.explanation}</p>
              {g.table?.rows?.length > 0 && (
                <div style={css.tableWrap}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>{g.table.headers?.map((h, hi) => (
                        <th key={hi} style={css.th}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {g.table.rows.map((row, ri) => (
                        <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{
                              ...css.td,
                              color: ci === 0 ? '#8B84FF' : 'var(--t2)',
                              fontWeight: ci === 0 ? 700 : 400,
                            }}>
                              {cell}
                              {ci === 0 && (
                                <button onClick={() => speak(cell, language)} style={css.miniAudio}>🔊</button>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {g.note && (
                <div style={css.noteBox}>
                  <span style={{ fontSize: 18 }}>💡</span>
                  <span style={{ fontSize: 13, color: '#FFD060', lineHeight: 1.6 }}>{g.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div style={{ height: 24 }} />
        <Btn variant="primary" onClick={() => goStep(2)}>Слова →</Btn>
        <div style={{ height: 32 }} />
      </div>
    </Page>
  )

  // ─────────────────────────────────────────────────────────────
  // STEP 2 — VOCABULARY
  // ─────────────────────────────────────────────────────────────
  if (step === 2) return (
    <Page>
      {header}{stepNav}
      <div style={{ ...css.scroll, ...animStyle }}>
        <div style={css.sectionTag}>Словарь урока</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={css.sectionTitle}>{data.vocabulary?.length} слов</h2>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>Нажми — увидишь пример</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.vocabulary?.map((v, i) => {
            const open = flippedVocab[i]
            return (
              <div key={i} onClick={() => setFlippedVocab(f => ({ ...f, [i]: !f[i] }))}
                style={{
                  ...css.vocabCard,
                  background: open ? 'rgba(108,99,255,0.08)' : 'var(--s1)',
                  borderColor: open ? 'rgba(108,99,255,0.3)' : 'var(--border)',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Audio button - stop propagation so it doesn't flip card */}
                  <div onClick={e => { e.stopPropagation(); speak(v.tr?.split(' ')[0] || v.tr, language) }}
                    style={css.vocabAudio}>🔊</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={css.vocabWord}>{v.tr}</div>
                    <div style={css.vocabPronun}>{v.pronunciation}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={css.vocabRu}>{v.ru}</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{open ? '▲' : '▼'}</div>
                  </div>
                </div>
                {open && (
                  <div style={css.vocabExample}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div onClick={e => { e.stopPropagation(); speak(v.example_tr, language) }}
                        style={{ ...css.vocabAudio, width: 26, height: 26, fontSize: 12, flexShrink: 0 }}>🔊</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#8B84FF', marginBottom: 3, lineHeight: 1.4 }}>
                          {v.example_tr}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.4 }}>{v.example_ru}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Listen all button */}
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--s1)',
          border: '1px solid var(--border)', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🎧</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Слушать все слова</div>
            <div style={{ fontSize: 12, color: 'var(--t3)' }}>Нажми 🔊 у каждого слова</div>
          </div>
        </div>

        <div style={{ height: 24 }} />
        <Btn variant="primary" onClick={() => goStep(3)}>Диалог →</Btn>
        <div style={{ height: 32 }} />
      </div>
    </Page>
  )

  // ─────────────────────────────────────────────────────────────
  // STEP 3 — DIALOGUE
  // ─────────────────────────────────────────────────────────────
  if (step === 3) return (
    <Page>
      {header}{stepNav}
      <div style={{ ...css.scroll, ...animStyle }}>
        <div style={css.sectionTag}>Диалог</div>
        <h2 style={css.sectionTitle}>{data.dialogue?.title}</h2>
        {data.dialogue?.context && (
          <div style={css.contextBadge}>
            📍 {data.dialogue.context}
          </div>
        )}

        {/* Listen full dialogue button */}
        <button onClick={() => {
          const lines = data.dialogue?.lines || []
          let i = 0
          const sayNext = () => {
            if (i >= lines.length) return
            const utt = new SpeechSynthesisUtterance(lines[i].tr)
            utt.lang = language === 'turkish' ? 'tr-TR' : 'zh-CN'
            utt.rate = 0.8
            utt.onend = () => { i++; setTimeout(sayNext, 400) }
            window.speechSynthesis.speak(utt)
          }
          window.speechSynthesis.cancel()
          sayNext()
        }} style={css.listenAllBtn}>
          <span>▶️</span>
          <span>Слушать весь диалог</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {data.dialogue?.lines?.map((line, i) => {
            const isRight = i % 2 !== 0
            return (
              <div key={i}>
                <div style={{ ...css.bubbleRow, flexDirection: isRight ? 'row-reverse' : 'row' }}>
                  <div style={css.avatar}>{isRight ? '🧑' : '👤'}</div>
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginBottom: 3,
                      textAlign: isRight ? 'right' : 'left', paddingLeft: isRight ? 0 : 2, paddingRight: isRight ? 2 : 0
                    }}>{line.speaker}</div>
                    <div style={{
                      ...css.bubble,
                      background: isRight ? 'rgba(108,99,255,0.12)' : 'var(--s1)',
                      borderColor: isRight ? 'rgba(108,99,255,0.3)' : 'var(--border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={css.bubbleTr}>{line.tr}</div>
                          <div style={css.bubbleRu}>{line.ru}</div>
                        </div>
                        <div onClick={() => speak(line.tr, language)} style={{ ...css.vocabAudio, width: 28, height: 28, fontSize: 12, flexShrink: 0 }}>🔊</div>
                      </div>
                    </div>
                    {line.note && (
                      <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5,
                        paddingLeft: isRight ? 0 : 2, paddingRight: isRight ? 2 : 0,
                        lineHeight: 1.5 }}>
                        💡 {line.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {data.cultural_note && (
          <div style={css.culturalCard}>
            <div style={css.culturalTitle}>🌍 {data.cultural_note.title}</div>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{data.cultural_note.text}</p>
          </div>
        )}

        <div style={{ height: 24 }} />
        <Btn variant="primary" onClick={() => goStep(4)}>Практика →</Btn>
        <div style={{ height: 32 }} />
      </div>
    </Page>
  )

  // ─────────────────────────────────────────────────────────────
  // STEP 4 — EXERCISES
  // ─────────────────────────────────────────────────────────────
  const timerDash = CIRC * (1 - timerPct)

  return (
    <Page>
      {header}{stepNav}

      {/* Timer + question counter */}
      <div style={css.exTopBar}>
        <div style={css.timerWrap}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="30" cy="30" r="26" fill="none" stroke="var(--s2)" strokeWidth="4" />
            <circle cx="30" cy="30" r="26" fill="none" stroke={timerColor} strokeWidth="4"
              strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={timerDash}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke .4s' }} />
          </svg>
          <div style={css.timerNum}>
            <span style={{ fontSize: 18, fontWeight: 800, color: timerColor, lineHeight: 1 }}>{timeLeft}</span>
            <span style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase' }}>сек</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4 }}>
            Вопрос {exIndex + 1} из {exercises.length}
          </div>
          <div style={{ height: 6, background: 'var(--s2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#6C63FF', borderRadius: 3,
              width: `${(exIndex / exercises.length) * 100}%`, transition: 'width .4s ease' }} />
          </div>
          <div style={{ marginTop: 6 }}>
            <span style={css.typeBadge}>
              {current?.type === 'multiple_choice' ? '📋 Выбор' :
               current?.type === 'fill_blank' ? '✏️ Заполни' : '🔗 Соедини'}
            </span>
          </div>
        </div>
      </div>

      {/* Question card */}
      <div style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
        <div style={css.qCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <p style={{ flex: 1, fontSize: 15, fontWeight: 700, lineHeight: 1.5, color: 'var(--t1)' }}>
              {current?.question}
            </p>
            {current?.question && (
              <AudioBtn text={current.question} language="ru-RU" size={32} color="#8B84FF" />
            )}
          </div>
          {current?.hint && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--t3)', lineHeight: 1.5,
              padding: '8px 12px', background: 'rgba(255,208,96,0.08)', borderRadius: 10,
              border: '1px solid rgba(255,208,96,0.2)' }}>
              💡 {current.hint}
            </div>
          )}
        </div>

        {/* Options — multiple choice / fill blank */}
        {(current?.type === 'multiple_choice' || current?.type === 'fill_blank') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {current.options?.map((opt, i) => {
              const sel   = selected === opt
              const right = checked && opt === current.correctAnswer
              const wrong = checked && sel && opt !== current.correctAnswer
              return (
                <div key={i} onClick={() => !checked && setSelected(opt)}
                  style={{
                    ...css.option,
                    borderColor: right ? '#4ADE80' : wrong ? '#FF4D6D' : sel ? '#6C63FF' : 'var(--border)',
                    background:  right ? 'rgba(74,222,128,0.08)' : wrong ? 'rgba(255,77,109,0.08)' : sel ? 'rgba(108,99,255,0.08)' : 'var(--s1)',
                    transform: sel && !checked ? 'translateX(4px)' : 'none',
                    cursor: checked ? 'default' : 'pointer',
                  }}>
                  <div style={{
                    ...css.optBadge,
                    background: right ? '#4ADE80' : wrong ? '#FF4D6D' : sel ? '#6C63FF' : 'var(--s2)',
                    color: right ? '#052012' : wrong || sel ? '#fff' : 'var(--t3)',
                  }}>
                    {right ? '✓' : wrong ? '✗' : LETTERS[i]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--t1)' }}>{opt}</span>
                  </div>
                  {(right || wrong) && (
                    <AudioBtn text={opt} language={language} size={28} color={right ? '#4ADE80' : '#FF4D6D'} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Match pairs */}
        {current?.type === 'match_pairs' && shuffRef.current && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {current.pairs?.map(p => {
                const sel    = matchLeft === p.left
                const paired = matchState[p.left] !== undefined
                const ok     = checked && matchState[p.left] === p.right
                const fail   = checked && paired && matchState[p.left] !== p.right
                return (
                  <div key={p.left} onClick={() => !paired && handleMatchLeft(p.left)}
                    style={{
                      ...css.matchCell,
                      borderColor: ok ? '#4ADE80' : fail ? '#FF4D6D' : sel ? '#6C63FF' : paired ? 'rgba(108,99,255,0.4)' : 'var(--border)',
                      background: ok ? 'rgba(74,222,128,0.08)' : fail ? 'rgba(255,77,109,0.08)' : sel ? 'rgba(108,99,255,0.12)' : 'var(--s1)',
                      cursor: paired || checked ? 'default' : 'pointer',
                    }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ok ? '#4ADE80' : 'var(--t1)', textAlign: 'center' }}>{p.left}</span>
                    {paired && <span style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{matchState[p.left]}</span>}
                  </div>
                )
              })}
            </div>
            {/* Right column - shuffled */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shuffRef.current.map(p => {
                const taken = Object.values(matchState).includes(p.right)
                return (
                  <div key={p.right} onClick={() => !taken && !checked && handleMatchRight(p.right)}
                    style={{
                      ...css.matchCell,
                      borderColor: taken ? 'rgba(108,99,255,0.3)' : 'var(--border)',
                      background: taken ? 'rgba(108,99,255,0.06)' : 'var(--s1)',
                      opacity: taken ? 0.5 : 1,
                      cursor: taken || checked ? 'default' : 'pointer',
                    }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: taken ? 'var(--t3)' : 'var(--t1)', textAlign: 'center' }}>{p.right}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        {checked && (
          <div style={{
            ...css.feedback,
            background: isCorrect ? 'rgba(74,222,128,0.07)' : 'rgba(255,77,109,0.07)',
            borderColor: isCorrect ? 'rgba(74,222,128,0.25)' : 'rgba(255,77,109,0.25)',
          }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>
                {isCorrect ? '✅' : timeLeft === 0 ? '⏱️' : '❌'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4,
                  color: isCorrect ? '#4ADE80' : '#FF4D6D' }}>
                  {isCorrect ? 'Правильно! +10 XP' : timeLeft === 0 ? 'Время вышло!' : 'Неверно'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 }}>
                  {current?.explanation}
                </div>
                {current?.correctAnswer && !isCorrect && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--t3)' }}>Правильный ответ:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#4ADE80' }}>{current.correctAnswer}</span>
                    <AudioBtn text={current.correctAnswer} language={language} size={26} color="#4ADE80" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>

      {/* CTA */}
      <div style={css.ctaBar}>
        {!checked
          ? <Btn variant="primary" disabled={!canCheck} onClick={checkAnswer}>Проверить</Btn>
          : <Btn variant="success" onClick={nextExercise}>
              {exIndex + 1 >= exercises.length ? '🎉 Завершить урок' : 'Следующий →'}
            </Btn>
        }
      </div>
    </Page>
  )
}

// ── Sub-components ────────────────────────────────────────────
function Page({ children }) {
  return (
    <div style={{
      background: 'var(--bg)', color: 'var(--t1)', minHeight: '100dvh',
      fontFamily: "'Outfit', sans-serif", display: 'flex', flexDirection: 'column',
      maxWidth: 480, margin: '0 auto', position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        :root {
          --bg:#08090F; --s1:#141620; --s2:#1E2133; --s3:#262A40;
          --t1:#F0F2FF; --t2:#8890B0; --t3:#4A5070;
          --border:rgba(255,255,255,0.08); --border2:rgba(255,255,255,0.14);
          --accent:#6C63FF; --accent2:#8B84FF;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideIn  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-10px)} }
        @keyframes xpPop    { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-80%) scale(1.2)} 100%{opacity:0;transform:translate(-50%,-120%) scale(.8)} }
        @keyframes popIn    { from{transform:scale(0.3) rotate(-20deg);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes starPop  { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 0 }
      `}</style>
      {children}
    </div>
  )
}

function Btn({ variant = 'primary', disabled, onClick, children }) {
  const variants = {
    primary: { bg: disabled ? 'var(--s3)' : '#6C63FF', color: disabled ? 'var(--t3)' : '#fff', shadow: disabled ? 'none' : '0 4px 20px rgba(108,99,255,.35)' },
    success: { bg: '#4ADE80', color: '#052012', shadow: '0 4px 20px rgba(74,222,128,.3)' },
    ghost:   { bg: 'var(--s2)', color: 'var(--t2)', shadow: 'none' },
  }
  const v = variants[variant]
  return (
    <button disabled={disabled} onClick={onClick} style={{
      width: '100%', padding: '15px 20px', borderRadius: 16, border: 'none',
      background: v.bg, color: v.color, fontSize: 16, fontWeight: 800,
      fontFamily: "'Outfit', sans-serif", cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: v.shadow, transition: 'all .15s', letterSpacing: '.2px',
    }}>
      {children}
    </button>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'var(--s1)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '14px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '.5px', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function Spinner() {
  return <div style={{ width: 36, height: 36, border: '3px solid rgba(108,99,255,.2)',
    borderTopColor: '#6C63FF', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
}

// ── CSS ───────────────────────────────────────────────────────
const css = {
  header:    { display:'flex', alignItems:'center', gap:12, padding:'14px 16px 10px', flexShrink:0 },
  closeBtn:  { width:36, height:36, borderRadius:10, background:'var(--s1)',
    border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', fontSize:14, color:'var(--t2)', fontFamily:'inherit', flexShrink:0 },
  progTrack: { height:6, background:'var(--s2)', borderRadius:3, overflow:'hidden' },
  progBar:   { height:'100%', background:'linear-gradient(90deg,#6C63FF,#8B84FF)', borderRadius:3, transition:'width .5s ease' },
  livesRow:  { display:'flex', gap:2, flexShrink:0 },
  stepNav:   { display:'flex', justifyContent:'space-around', padding:'8px 16px 12px', flexShrink:0 },
  stepDot:   { width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center',
    justifyContent:'center', fontSize:13, fontWeight:700, transition:'all .2s', cursor:'default' },
  scroll:    { flex:1, overflowY:'auto', padding:'0 16px' },
  center:    { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    flex:1, padding:40, gap:12 },
  langBadge: { display:'inline-block', fontSize:12, fontWeight:600, color:'#8B84FF',
    background:'rgba(108,99,255,0.1)', border:'1px solid rgba(108,99,255,0.2)',
    borderRadius:20, padding:'4px 12px', marginBottom:10 },
  lessonTitle: { fontSize:22, fontWeight:800, marginBottom:16, lineHeight:1.3, color:'var(--t1)' },
  introCard: { background:'var(--s1)', border:'1px solid var(--border2)', borderRadius:18,
    padding:18, marginBottom:14, display:'flex', gap:12, alignItems:'flex-start' },
  introText: { fontSize:14, color:'var(--t2)', lineHeight:1.8, flex:1 },
  goalsCard: { background:'rgba(108,99,255,0.05)', border:'1px solid rgba(108,99,255,0.15)',
    borderRadius:18, padding:16, marginBottom:14 },
  goalsHead: { fontSize:13, fontWeight:700, color:'#8B84FF', marginBottom:12 },
  goalRow:   { display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 },
  goalNum:   { width:22, height:22, borderRadius:'50%', background:'#6C63FF', color:'#fff',
    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, marginTop:1 },
  sectionTag: { fontSize:11, fontWeight:700, color:'#8B84FF', textTransform:'uppercase',
    letterSpacing:'.8px', marginBottom:6 },
  sectionTitle: { fontSize:18, fontWeight:800, marginBottom:12, lineHeight:1.3, color:'var(--t1)' },
  grammarCard: { background:'var(--s1)', border:'1px solid var(--border)', borderRadius:18, padding:16, marginBottom:10 },
  grammarText: { fontSize:14, color:'var(--t2)', lineHeight:1.8, marginBottom:14 },
  tableWrap: { overflowX:'auto', marginBottom:12, borderRadius:12, border:'1px solid var(--border)' },
  th: { background:'rgba(108,99,255,0.12)', color:'#8B84FF', fontWeight:700, padding:'9px 12px',
    textAlign:'left', borderBottom:'1px solid rgba(108,99,255,0.2)', whiteSpace:'nowrap', fontSize:12 },
  td: { padding:'8px 12px', borderBottom:'1px solid var(--border)', lineHeight:1.5, verticalAlign:'top', fontSize:13 },
  noteBox: { display:'flex', gap:8, alignItems:'flex-start', background:'rgba(255,208,96,0.07)',
    border:'1px solid rgba(255,208,96,0.2)', borderRadius:12, padding:'10px 14px' },
  miniAudio: { background:'none', border:'none', cursor:'pointer', fontSize:11, marginLeft:6,
    opacity:0.6, padding:0, verticalAlign:'middle' },
  vocabCard: { border:'1px solid', borderRadius:16, padding:'14px 16px', cursor:'pointer', transition:'all .15s' },
  vocabWord: { fontSize:18, fontWeight:800, color:'#8B84FF', marginBottom:2 },
  vocabPronun: { fontSize:11, color:'var(--t3)', fontFamily:"'DM Mono',monospace" },
  vocabRu:   { fontSize:14, fontWeight:600, color:'var(--t1)' },
  vocabAudio: { width:32, height:32, borderRadius:'50%', background:'rgba(108,99,255,0.12)',
    border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:14, flexShrink:0, color:'#8B84FF' },
  vocabExample: { marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)' },
  contextBadge: { fontSize:13, color:'var(--t2)', background:'var(--s1)', border:'1px solid var(--border)',
    borderRadius:12, padding:'10px 14px', marginBottom:16, lineHeight:1.5 },
  listenAllBtn: { width:'100%', padding:'12px 16px', borderRadius:14, border:'1px solid rgba(108,99,255,0.25)',
    background:'rgba(108,99,255,0.08)', color:'#8B84FF', fontSize:14, fontWeight:600,
    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
    fontFamily:"'Outfit',sans-serif" },
  bubbleRow: { display:'flex', gap:10, alignItems:'flex-start' },
  avatar:    { width:34, height:34, borderRadius:'50%', background:'var(--s2)', display:'flex',
    alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginTop:16 },
  bubble:    { border:'1px solid', borderRadius:16, padding:'10px 14px' },
  bubbleTr:  { fontSize:14, fontWeight:700, marginBottom:4, lineHeight:1.4, color:'var(--t1)' },
  bubbleRu:  { fontSize:13, color:'var(--t3)', lineHeight:1.4 },
  culturalCard: { background:'linear-gradient(135deg,rgba(78,205,196,0.06),rgba(108,99,255,0.05))',
    border:'1px solid rgba(78,205,196,0.18)', borderRadius:18, padding:'16px 18px', marginTop:16 },
  culturalTitle: { fontSize:14, fontWeight:700, color:'#4ECDC4', marginBottom:8 },
  exTopBar:  { display:'flex', alignItems:'center', gap:14, padding:'8px 16px 12px', flexShrink:0 },
  timerWrap: { position:'relative', width:60, height:60, flexShrink:0 },
  timerNum:  { position:'absolute', inset:0, display:'flex', flexDirection:'column',
    alignItems:'center', justifyContent:'center', gap:1 },
  typeBadge: { display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 8px',
    borderRadius:6, background:'rgba(108,99,255,0.12)', color:'#8B84FF', letterSpacing:'.4px' },
  qCard:     { background:'var(--s1)', border:'1px solid var(--border2)', borderRadius:18, padding:16 },
  option:    { background:'var(--s1)', border:'1.5px solid', borderRadius:14,
    padding:'12px 14px', display:'flex', alignItems:'center', gap:10, transition:'all .12s' },
  optBadge:  { width:30, height:30, borderRadius:9, display:'flex', alignItems:'center',
    justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0,
    transition:'all .12s', fontFamily:"'DM Mono',monospace" },
  matchCell: { border:'1.5px solid', borderRadius:12, padding:'12px 10px',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    minHeight:52, transition:'all .12s', overflow:'hidden' },
  feedback:  { border:'1px solid', borderRadius:16, padding:'14px 16px' },
  ctaBar:    { padding:'12px 16px 28px', flexShrink:0 },
  completeWrap: { display:'flex', flexDirection:'column', alignItems:'center',
    padding:'32px 20px', gap:16, textAlign:'center', flex:1, overflowY:'auto' },
  completeTitle: { fontSize:28, fontWeight:800, color:'var(--t1)' },
  starsRow:  { display:'flex', gap:8, marginTop:-8 },
  statsGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, width:'100%' },
  summaryBox: { background:'var(--s1)', border:'1px solid var(--border)', borderRadius:18,
    padding:18, width:'100%', textAlign:'left' },
  summaryHead: { fontSize:13, fontWeight:700, color:'#8B84FF', textTransform:'uppercase',
    letterSpacing:'.5px', marginBottom:12 },
  summaryRow: { display:'flex', alignItems:'flex-start', marginBottom:8 },
}
