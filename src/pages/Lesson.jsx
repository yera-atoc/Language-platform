import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'
import { syncNow } from '@hooks/useFirestoreSync'

// ── Dynamic lesson loader ────────────────────────────────────
function useLessonData(language, level, lessonId) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    import(`../../content/${language}/${level}/${lessonId}.json`)
      .then(m => { setData(m.default); setLoading(false) })
      .catch(() => { setData(null); setLoading(false) })
  }, [language, level, lessonId])
  return { data, loading }
}

// ── Constants ────────────────────────────────────────────────
const TIMER_SEC = 30
const CIRC      = 188.4
const LETTERS   = ['A', 'B', 'C', 'D']

// Steps definition
const STEPS = [
  { id: 'intro',     label: 'Введение' },
  { id: 'grammar',   label: 'Грамматика' },
  { id: 'vocab',     label: 'Слова' },
  { id: 'dialogue',  label: 'Диалог' },
  { id: 'exercises', label: 'Практика' },
]

// ── Main Component ───────────────────────────────────────────
export default function Lesson() {
  const { language, level, lessonId } = useParams()
  const navigate                      = useNavigate()
  const { data, loading }             = useLessonData(language, level, lessonId)
  const { addXP, loseLife, lives, updateStreak } = useUserStore()
  const { completeLesson }            = useProgressStore()

  const [step, setStep]             = useState(0) // 0=intro,1=grammar,2=vocab,3=dialogue,4=exercises
  const [exIndex, setExIndex]       = useState(0)
  const [selected, setSelected]     = useState(null)
  const [matchState, setMatchState] = useState({})
  const [matchLeft, setMatchLeft]   = useState(null)
  const [checked, setChecked]       = useState(false)
  const [isCorrect, setIsCorrect]   = useState(null)
  const [correctCount, setCCount]   = useState(0)
  const [showComplete, setComplete] = useState(false)
  const [timeLeft, setTimeLeft]     = useState(TIMER_SEC)
  const [flippedCards, setFlipped]  = useState({})

  const timerRef   = useRef(null)
  const startRef   = useRef(Date.now())
  const elapsedRef = useRef(0)
  const shuffRef   = useRef(null)

  const exercises = data?.exercises ?? []
  const current   = exercises[exIndex]

  // Shuffle match pairs once per exercise
  useEffect(() => {
    if (current?.type === 'match_pairs') {
      shuffRef.current = [...current.pairs].sort(() => Math.random() - 0.5)
    }
  }, [exIndex, current])

  // ── Timer ────────────────────────────────────────────────
  const stopTimer = useCallback(() => clearInterval(timerRef.current), [])
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

  // ── Exercise logic ───────────────────────────────────────
  const canCheck = (() => {
    if (!current || checked) return false
    if (current.type === 'multiple_choice' || current.type === 'fill_blank') return selected !== null
    if (current.type === 'match_pairs') return Object.keys(matchState).length === (current.pairs?.length ?? 0)
    return false
  })()

  function checkAnswer() {
    if (!canCheck) return
    stopTimer(); setChecked(true)
    let correct = false
    if (current.type === 'multiple_choice' || current.type === 'fill_blank') correct = selected === current.correctAnswer
    if (current.type === 'match_pairs') correct = current.pairs.every(p => matchState[p.left] === p.right)
    setIsCorrect(correct)
    if (correct) { setCCount(c => c + 1); spawnXP('+10 XP') } else loseLife()
  }

  function nextExercise() {
    if (exIndex + 1 >= exercises.length) return finishLesson()
    setExIndex(i => i + 1); setSelected(null); setMatchState({})
    setMatchLeft(null); setChecked(false); setIsCorrect(null)
  }

  function finishLesson() {
    stopTimer(); elapsedRef.current = Math.round((Date.now() - startRef.current) / 1000)
    const finalCorrect = correctCount + (isCorrect ? 1 : 0)
    const score  = exercises.length > 0 ? Math.round((finalCorrect / exercises.length) * 100) : 0
    const xp     = score >= 80 ? (data?.xpReward ?? 60) : Math.round((data?.xpReward ?? 60) * 0.5)
    addXP(xp); updateStreak(); completeLesson(language, level, lessonId, score)
    const uid = useUserStore.getState().user?.uid
    if (uid) syncNow(uid).catch(() => {})
    setComplete(true)
  }

  function handleMatchLeft(w)  { if (checked) return; setMatchLeft(x => x === w ? null : w) }
  function handleMatchRight(r) {
    if (checked || !matchLeft) return
    setMatchState(p => ({ ...p, [matchLeft]: r })); setMatchLeft(null)
  }
  function pairResult(left) {
    if (!checked) return null
    return matchState[left] === current.pairs?.find(p => p.left === left)?.right
  }

  function spawnXP(text) {
    const el = document.createElement('div'); el.textContent = text
    Object.assign(el.style, { position:'fixed', top:'45%', left:'50%', transform:'translate(-50%,-50%)',
      fontSize:'22px', fontWeight:'800', color:'#FFD060', pointerEvents:'none',
      zIndex:'9999', fontFamily:'Outfit,sans-serif', animation:'xpFloat 1s ease forwards' })
    document.body.appendChild(el); setTimeout(() => el.remove(), 1000)
  }

  // ── Derived ──────────────────────────────────────────────
  const timerColor  = timeLeft <= 10 ? '#FF4D6D' : timeLeft <= 20 ? '#FFD060' : '#6C63FF'
  const dashOffset  = CIRC * (1 - timeLeft / TIMER_SEC)
  const exPct       = exercises.length > 0 ? (exIndex / exercises.length) * 100 : 0
  const finalCorrect = correctCount + (checked && isCorrect ? 1 : 0)
  const finalScore   = exercises.length > 0 ? Math.round((finalCorrect / exercises.length) * 100) : 0
  const xpEarned     = finalScore >= 80 ? (data?.xpReward ?? 60) : Math.round((data?.xpReward ?? 60) * 0.5)

  // ── Loading / not found ──────────────────────────────────
  if (loading) return (
    <Shell>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={s.spinner} />
      </div>
    </Shell>
  )
  if (!data) return (
    <Shell>
      <p style={s.centerText}>Урок не найден</p>
      <div style={{ padding:'0 20px' }}><BigBtn variant="primary" onClick={() => navigate(-1)}>← Назад</BigBtn></div>
    </Shell>
  )

  // ── Completion ───────────────────────────────────────────
  if (showComplete) {
    const mins = Math.floor(elapsedRef.current / 60)
    const secs = elapsedRef.current % 60
    return (
      <Shell>
        <div style={s.completeWrap}>
          <span style={{ fontSize:72 }}>🏆</span>
          <h2 style={s.completeTitle}>Урок пройден!</h2>
          <p style={s.completeSub}>{finalScore >= 80 ? 'Отличная работа!' : 'Продолжай — станет лучше!'}</p>

          <div style={s.statsRow}>
            <StatBox label="XP"    value={`+${xpEarned}`}                             color="#FFD060" />
            <StatBox label="Верно" value={`${finalCorrect}/${exercises.length}`}      color="#4ADE80" />
            <StatBox label="Время" value={`${mins}:${String(secs).padStart(2,'0')}`}  color="#8B84FF" />
          </div>

          {data.summary && (
            <div style={s.summaryCard}>
              <div style={s.summaryTitle}>{data.summary.title}</div>
              {data.summary.points.map((pt, i) => (
                <div key={i} style={s.summaryPoint}>
                  <span style={{ color:'#4ADE80', marginRight:8, flexShrink:0 }}>✓</span>
                  <span>{pt}</span>
                </div>
              ))}
              {data.summary.next_lesson && (
                <div style={s.summaryNext}>
                  <span style={{ fontSize:14 }}>→</span> {data.summary.next_lesson}
                </div>
              )}
            </div>
          )}

          <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
            <BigBtn variant="success" onClick={() => navigate(-1)}>← К списку уроков</BigBtn>
            <BigBtn variant="ghost" onClick={() => {
              setStep(0); setExIndex(0); setSelected(null); setMatchState({})
              setMatchLeft(null); setChecked(false); setIsCorrect(null)
              setCCount(0); setComplete(false); startRef.current = Date.now()
            }}>Повторить урок</BigBtn>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Theory / vocab / dialogue steps ─────────────────────
  const isContentStep = step < 4

  return (
    <Shell>
      <style>{`
        @keyframes xpFloat{0%{opacity:1;transform:translate(-50%,-50%)}100%{opacity:0;transform:translate(-50%,-120%)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes flipCard{0%{transform:rotateY(0)}100%{transform:rotateY(180deg)}}
      `}</style>

      {/* ── Header ── */}
      <header style={s.topbar}>
        <button style={s.closeBtn} onClick={() => navigate(-1)}>✕</button>
        <div style={s.progressOuter}>
          <div style={{
            ...s.progressInner,
            width: step < 4 ? `${(step / 5) * 100}%` : `${exPct}%`
          }} />
        </div>
        <div style={{ display:'flex', gap:2 }}>
          {Array.from({ length:5 }).map((_,i) => (
            <span key={i} style={{ fontSize:13, opacity: i < lives ? 1 : 0.2 }}>❤️</span>
          ))}
        </div>
      </header>

      {/* ── Step pills ── */}
      <div style={s.stepPills}>
        {STEPS.map((st, i) => (
          <div key={st.id} style={{
            ...s.stepPill,
            background: i < step ? '#4ADE80' : i === step ? '#6C63FF' : '#232840',
            color:      i < step ? '#052012' : i === step ? 'white'  : '#555E80',
          }}>
            {i < step ? '✓' : i + 1}
          </div>
        ))}
      </div>
      <div style={s.stepLabel}>{STEPS[step]?.label}</div>

      {/* ════════════════════════════════════════
          STEP 0 — INTRO
      ════════════════════════════════════════ */}
      {step === 0 && (
        <div style={s.contentWrap}>
          <div style={s.lessonBadge}>🇹🇷 Турецкий · A1 · {data.estimatedMinutes} мин</div>
          <h1 style={s.lessonTitle}>{data.title}</h1>

          <div style={s.introCard}>
            <p style={s.introText}>{data.intro?.text}</p>
          </div>

          {data.intro?.goals && (
            <div style={s.goalsCard}>
              <div style={s.goalsTitle}>Цели урока</div>
              {data.intro.goals.map((g, i) => (
                <div key={i} style={s.goalRow}>
                  <span style={s.goalNum}>{i + 1}</span>
                  <span style={s.goalText}>{g}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ height:20 }} />
          <BigBtn variant="primary" onClick={() => setStep(1)}>Начать урок →</BigBtn>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 1 — GRAMMAR
      ════════════════════════════════════════ */}
      {step === 1 && (
        <div style={s.contentWrap}>
          {data.grammar?.map((g, gi) => (
            <div key={gi} style={{ marginBottom: 20 }}>
              <div style={s.sectionTag}>Грамматика {gi + 1}</div>
              <h2 style={s.sectionTitle}>{g.title}</h2>
              <div style={s.grammarCard}>
                <p style={s.grammarExplain}>{g.explanation}</p>

                {g.table && (
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          {g.table.headers.map((h, hi) => (
                            <th key={hi} style={s.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.table.rows.map((row, ri) => (
                          <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                            {row.map((cell, ci) => (
                              <td key={ci} style={{ ...s.td, color: ci === 0 ? '#8B84FF' : '#8890B0', fontWeight: ci === 0 ? 700 : 400 }}>
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {g.note && (
                  <div style={s.noteBox}>
                    <span style={{ fontSize:16, marginRight:8 }}>💡</span>
                    <span style={{ fontSize:13, color:'#FFD060', lineHeight:1.5 }}>{g.note}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div style={{ height:20 }} />
          <BigBtn variant="primary" onClick={() => setStep(2)}>Слова →</BigBtn>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 2 — VOCABULARY
      ════════════════════════════════════════ */}
      {step === 2 && (
        <div style={s.contentWrap}>
          <div style={s.sectionTag}>Словарь</div>
          <h2 style={s.sectionTitle}>{data.vocabulary?.length} слов этого урока</h2>
          <p style={{ fontSize:13, color:'#555E80', marginBottom:16 }}>
            Нажми на карточку чтобы увидеть пример предложения
          </p>

          <div style={s.vocabList}>
            {data.vocabulary?.map((v, i) => (
              <div
                key={i}
                onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
                style={{
                  ...s.vocabCard,
                  background: flippedCards[i] ? 'rgba(108,99,255,0.1)' : '#1A1F35',
                  borderColor: flippedCards[i] ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ flex:1 }}>
                    <div style={s.vocabTr}>{v.tr}</div>
                    <div style={s.vocabPronun}>{v.pronunciation}</div>
                    <div style={s.vocabRu}>{v.ru}</div>
                  </div>
                  <div style={s.flipHint}>{flippedCards[i] ? '▲' : '▼'}</div>
                </div>
                {flippedCards[i] && (
                  <div style={s.vocabExample}>
                    <div style={{ color:'#8B84FF', fontWeight:600, marginBottom:3 }}>{v.example_tr}</div>
                    <div style={{ color:'#8890B0' }}>{v.example_ru}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ height:20 }} />
          <BigBtn variant="primary" onClick={() => setStep(3)}>Диалог →</BigBtn>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 3 — DIALOGUE
      ════════════════════════════════════════ */}
      {step === 3 && (
        <div style={s.contentWrap}>
          <div style={s.sectionTag}>Диалог</div>
          <h2 style={s.sectionTitle}>{data.dialogue?.title}</h2>
          {data.dialogue?.context && (
            <div style={s.dialogueContext}>
              <span style={{ fontSize:14 }}>📍</span> {data.dialogue.context}
            </div>
          )}

          <div style={s.dialogueList}>
            {data.dialogue?.lines?.map((line, i) => {
              const isRight = i % 2 !== 0
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ ...s.bubbleRow, flexDirection: isRight ? 'row-reverse' : 'row' }}>
                    <div style={s.bubbleAvatar}>
                      {isRight ? '🧑' : '👤'}
                    </div>
                    <div style={{ maxWidth:'75%' }}>
                      <div style={s.bubbleSpeaker}>{line.speaker}</div>
                      <div style={{
                        ...s.bubble,
                        background: isRight ? 'rgba(108,99,255,0.12)' : '#1A1F35',
                        borderColor: isRight ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.1)',
                      }}>
                        <div style={s.bubbleTr}>{line.tr}</div>
                        <div style={s.bubbleRu}>{line.ru}</div>
                      </div>
                      {line.note && (
                        <div style={s.bubbleNote}>💡 {line.note}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {data.cultural_note && (
            <div style={s.culturalCard}>
              <div style={s.culturalTitle}>🌙 {data.cultural_note.title}</div>
              <p style={s.culturalText}>{data.cultural_note.text}</p>
            </div>
          )}

          <div style={{ height:20 }} />
          <BigBtn variant="primary" onClick={() => setStep(4)}>Практика →</BigBtn>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 4 — EXERCISES
      ════════════════════════════════════════ */}
      {step === 4 && (
        <>
          {/* Timer */}
          <div style={s.timerWrap}>
            <div style={s.timerRing}>
              <svg viewBox="0 0 72 72" width="72" height="72" style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="30" fill="none" stroke="#232840" strokeWidth="4" />
                <circle cx="36" cy="36" r="30" fill="none" stroke={timerColor} strokeWidth="4"
                  strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dashOffset}
                  style={{ transition:'stroke-dashoffset 1s linear,stroke 0.4s' }} />
              </svg>
              <div style={s.timerCenter}>
                <span style={{ fontSize:21, fontWeight:800, fontFamily:"'DM Mono',monospace", color:timerColor }}>{timeLeft}</span>
                <span style={{ fontSize:9, color:'#555E80', textTransform:'uppercase' }}>сек</span>
              </div>
            </div>
          </div>

          {/* Exercise */}
          <div style={s.exWrap}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={s.exNum}>Вопрос {exIndex + 1} / {exercises.length}</span>
              <span style={s.exBadge}>
                {current?.type === 'multiple_choice' ? 'Выбор ответа'
                : current?.type === 'fill_blank' ? 'Заполни пробел'
                : 'Соедини пары'}
              </span>
            </div>

            {/* Question card */}
            <div style={s.exCard}>
              <p style={{ fontSize:16, fontWeight:700, lineHeight:1.5 }}>{current?.question}</p>
              {current?.word && (
                <span style={{ fontSize:28, fontWeight:800, color:'#8B84FF', display:'block', margin:'10px 0 3px' }}>
                  {current.word}
                </span>
              )}
              {current?.pronun && (
                <span style={{ fontSize:13, color:'#555E80', fontFamily:"'DM Mono',monospace" }}>
                  {current.pronun}
                </span>
              )}
              {current?.hint && (
                <p style={{ fontSize:13, color:'#8890B0', marginTop:8, lineHeight:1.5 }}>
                  💡 {current.hint}
                </p>
              )}
            </div>

            {/* Options */}
            {(current?.type === 'multiple_choice' || current?.type === 'fill_blank') && (
              <div style={s.optionsList}>
                {current.options?.map((opt, i) => {
                  const isSel   = selected === opt
                  const isRight = checked && opt === current.correctAnswer
                  const isWrong = checked && isSel && opt !== current.correctAnswer
                  return (
                    <div key={i} onClick={() => !checked && setSelected(opt)}
                      style={{
                        ...s.option,
                        borderColor: isRight ? '#4ADE80' : isWrong ? '#FF4D6D' : isSel ? '#6C63FF' : 'rgba(255,255,255,0.1)',
                        background:  isRight ? 'rgba(74,222,128,0.1)' : isWrong ? 'rgba(255,77,109,0.1)' : isSel ? 'rgba(108,99,255,0.1)' : '#1A1F35',
                        cursor: checked ? 'default' : 'pointer',
                        transform: isSel && !checked ? 'translateX(3px)' : 'none',
                      }}
                    >
                      <div style={{
                        ...s.optLetter,
                        background: isRight ? '#4ADE80' : isWrong ? '#FF4D6D' : isSel ? '#6C63FF' : '#232840',
                        color: (isRight || isWrong || isSel) ? (isRight ? '#052012' : 'white') : '#555E80',
                      }}>
                        {isRight ? '✓' : isWrong ? '✗' : LETTERS[i]}
                      </div>
                      <span style={{ flex:1, fontSize:14, fontWeight:600, lineHeight:1.4 }}>{opt}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Match pairs */}
            {current?.type === 'match_pairs' && shuffRef.current && (
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                  {current.pairs?.map(p => {
                    const sel    = matchLeft === p.left
                    const paired = matchState[p.left] !== undefined
                    const result = pairResult(p.left)
                    return (
                      <div key={p.left} onClick={() => !paired && handleMatchLeft(p.left)}
                        style={{
                          ...s.matchCell,
                          borderColor: result===true?'#4ADE80':result===false?'#FF4D6D':sel?'#6C63FF':paired?'rgba(108,99,255,0.4)':'rgba(255,255,255,0.1)',
                          background:  result===true?'rgba(74,222,128,0.1)':result===false?'rgba(255,77,109,0.1)':sel?'rgba(108,99,255,0.15)':paired?'rgba(108,99,255,0.06)':'#1A1F35',
                          cursor: paired||checked?'default':'pointer',
                        }}
                      >
                        <span style={{ fontSize:13, fontWeight:700 }}>{p.left}</span>
                        {paired && <span style={{ fontSize:11, color:'#8890B0', marginTop:2 }}>{matchState[p.left]}</span>}
                      </div>
                    )
                  })}
                </div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
                  {shuffRef.current.map(p => {
                    const taken = Object.values(matchState).includes(p.right)
                    return (
                      <div key={p.right} onClick={() => !taken && !checked && handleMatchRight(p.right)}
                        style={{
                          ...s.matchCell,
                          borderColor: taken?'rgba(108,99,255,0.4)':'rgba(255,255,255,0.1)',
                          background:  taken?'rgba(108,99,255,0.06)':'#1A1F35',
                          opacity: taken ? 0.5 : 1,
                          cursor: taken||checked?'default':'pointer',
                        }}
                      >
                        <span style={{ fontSize:13, fontWeight:600, color: taken?'#555E80':'#F0F2FF' }}>{p.right}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Feedback */}
            {checked && (
              <div style={{
                border:'1px solid', borderRadius:16, padding:'14px 16px',
                display:'flex', alignItems:'flex-start', gap:10,
                background: isCorrect?'rgba(74,222,128,0.08)':'rgba(255,77,109,0.08)',
                borderColor: isCorrect?'rgba(74,222,128,0.25)':'rgba(255,77,109,0.25)',
              }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{isCorrect?'✅':timeLeft===0?'⏱️':'❌'}</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:isCorrect?'#4ADE80':'#FF4D6D', marginBottom:4 }}>
                    {isCorrect?'Правильно!':timeLeft===0?'Время вышло!':'Неверно'}
                  </div>
                  <div style={{ fontSize:13, color:'#8890B0', lineHeight:1.6 }}>
                    {current?.explanation}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CTA */}
          <div style={{ padding:'12px 20px 32px' }}>
            {!checked
              ? <BigBtn variant="primary" disabled={!canCheck} onClick={checkAnswer}>Проверить</BigBtn>
              : <BigBtn variant="success" onClick={nextExercise}>
                  {exIndex + 1 >= exercises.length ? 'Завершить урок 🎉' : 'Далее →'}
                </BigBtn>
            }
          </div>
        </>
      )}
    </Shell>
  )
}

// ── Reusable Components ──────────────────────────────────────
function Shell({ children }) {
  return (
    <div style={{ background:'#080B14', color:'#F0F2FF', minHeight:'100vh', fontFamily:"'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes xpFloat{0%{opacity:1;transform:translate(-50%,-50%)}100%{opacity:0;transform:translate(-50%,-120%)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div style={{ maxWidth:420, margin:'0 auto', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        {children}
      </div>
    </div>
  )
}

function BigBtn({ variant='primary', disabled, onClick, children }) {
  const styles = {
    primary: { bg: disabled?'#232840':'#6C63FF', color: disabled?'#555E80':'white', shadow:'0 4px 20px rgba(108,99,255,0.35)' },
    success: { bg:'#4ADE80', color:'#052012', shadow:'0 4px 20px rgba(74,222,128,0.3)' },
    ghost:   { bg:'#232840', color:'#8890B0', shadow:'none' },
  }
  const st = styles[variant]
  return (
    <button disabled={disabled} onClick={onClick} style={{
      width:'100%', padding:16, borderRadius:16, border:'none',
      background: disabled?'#232840':st.bg,
      color: disabled?'#555E80':st.color,
      fontSize:16, fontWeight:800, fontFamily:"'Outfit',sans-serif",
      cursor: disabled?'not-allowed':'pointer',
      boxShadow: disabled?'none':st.shadow,
      transition:'all 0.15s', marginBottom:0,
    }}>
      {children}
    </button>
  )
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ flex:1, background:'#1A1F35', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'16px 10px', textAlign:'center' }}>
      <div style={{ fontSize:22, fontWeight:800, color, fontFamily:"'DM Mono',monospace" }}>{value}</div>
      <div style={{ fontSize:11, color:'#555E80', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', marginTop:3 }}>{label}</div>
    </div>
  )
}

// ── Styles ───────────────────────────────────────────────────
const s = {
  topbar:        { display:'flex', alignItems:'center', gap:12, padding:'16px 20px 10px', flexShrink:0 },
  closeBtn:      { width:36, height:36, borderRadius:10, background:'#1A1F35', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'#8890B0', fontFamily:'inherit', flexShrink:0 },
  progressOuter: { flex:1, height:7, background:'#232840', borderRadius:4, overflow:'hidden' },
  progressInner: { height:'100%', background:'linear-gradient(90deg,#6C63FF,#8B84FF)', borderRadius:4, transition:'width 0.5s ease' },
  stepPills:     { display:'flex', gap:6, padding:'8px 20px 4px', alignItems:'center' },
  stepPill:      { width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, transition:'all .2s', flexShrink:0 },
  stepLabel:     { fontSize:11, fontWeight:700, color:'#555E80', textTransform:'uppercase', letterSpacing:'0.8px', padding:'0 20px 12px' },
  contentWrap:   { flex:1, padding:'0 20px', overflowY:'auto' },
  lessonBadge:   { display:'inline-block', fontSize:12, fontWeight:600, color:'#8B84FF', background:'rgba(108,99,255,0.12)', border:'1px solid rgba(108,99,255,0.2)', borderRadius:20, padding:'4px 12px', marginBottom:10 },
  lessonTitle:   { fontSize:22, fontWeight:800, marginBottom:16, lineHeight:1.3 },
  introCard:     { background:'#1A1F35', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, padding:18, marginBottom:14 },
  introText:     { fontSize:14, color:'#C0C8E0', lineHeight:1.8 },
  goalsCard:     { background:'rgba(108,99,255,0.06)', border:'1px solid rgba(108,99,255,0.15)', borderRadius:18, padding:16, marginBottom:14 },
  goalsTitle:    { fontSize:12, fontWeight:700, color:'#8B84FF', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 },
  goalRow:       { display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 },
  goalNum:       { width:22, height:22, borderRadius:'50%', background:'#6C63FF', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, marginTop:1 },
  goalText:      { fontSize:13, color:'#C0C8E0', lineHeight:1.5 },
  sectionTag:    { fontSize:11, fontWeight:700, color:'#8B84FF', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 },
  sectionTitle:  { fontSize:18, fontWeight:800, marginBottom:14, lineHeight:1.3 },
  grammarCard:   { background:'#1A1F35', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, padding:18, marginBottom:14 },
  grammarExplain:{ fontSize:14, color:'#C0C8E0', lineHeight:1.8, marginBottom:14 },
  tableWrap:     { overflowX:'auto', marginBottom:12 },
  table:         { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:            { background:'rgba(108,99,255,0.15)', color:'#8B84FF', fontWeight:700, padding:'9px 12px', textAlign:'left', borderBottom:'1px solid rgba(108,99,255,0.2)', whiteSpace:'nowrap' },
  td:            { padding:'8px 12px', borderBottom:'1px solid rgba(255,255,255,0.05)', lineHeight:1.5, verticalAlign:'top' },
  noteBox:       { display:'flex', alignItems:'flex-start', gap:6, background:'rgba(255,208,96,0.08)', border:'1px solid rgba(255,208,96,0.2)', borderRadius:12, padding:'10px 14px', marginTop:4 },
  vocabList:     { display:'flex', flexDirection:'column', gap:10, marginBottom:14 },
  vocabCard:     { border:'1px solid', borderRadius:16, padding:'14px 16px', cursor:'pointer', transition:'all .15s' },
  vocabTr:       { fontSize:19, fontWeight:800, color:'#8B84FF', marginBottom:2 },
  vocabPronun:   { fontSize:12, color:'#555E80', fontFamily:"'DM Mono',monospace", marginBottom:3 },
  vocabRu:       { fontSize:14, fontWeight:600, color:'#F0F2FF' },
  flipHint:      { fontSize:12, color:'#555E80' },
  vocabExample:  { marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)', lineHeight:1.6 },
  dialogueContext:{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#8890B0', marginBottom:16, background:'#1A1F35', borderRadius:12, padding:'10px 14px' },
  dialogueList:  { display:'flex', flexDirection:'column', marginBottom:16 },
  bubbleRow:     { display:'flex', gap:10, alignItems:'flex-start' },
  bubbleAvatar:  { width:34, height:34, borderRadius:'50%', background:'#232840', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginTop:16 },
  bubbleSpeaker: { fontSize:11, color:'#555E80', fontWeight:600, marginBottom:3, paddingLeft:2 },
  bubble:        { border:'1px solid', borderRadius:16, padding:'10px 14px' },
  bubbleTr:      { fontSize:14, fontWeight:700, marginBottom:4, lineHeight:1.4 },
  bubbleRu:      { fontSize:13, color:'#8890B0' },
  bubbleNote:    { fontSize:12, color:'#555E80', marginTop:5, paddingLeft:2, lineHeight:1.5 },
  culturalCard:  { background:'linear-gradient(135deg,rgba(78,205,196,0.08),rgba(108,99,255,0.06))', border:'1px solid rgba(78,205,196,0.2)', borderRadius:18, padding:'16px 18px', marginBottom:14 },
  culturalTitle: { fontSize:14, fontWeight:700, color:'#4ECDC4', marginBottom:8 },
  culturalText:  { fontSize:13, color:'#8890B0', lineHeight:1.7 },
  timerWrap:     { display:'flex', justifyContent:'center', padding:'8px 20px 4px', flexShrink:0 },
  timerRing:     { position:'relative', width:68, height:68 },
  timerCenter:   { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:1 },
  exWrap:        { flex:1, padding:'10px 20px 0', display:'flex', flexDirection:'column', gap:12 },
  exNum:         { fontSize:11, fontWeight:700, color:'#555E80', textTransform:'uppercase', letterSpacing:'0.8px' },
  exBadge:       { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', padding:'3px 8px', borderRadius:6, background:'rgba(108,99,255,0.15)', color:'#8B84FF' },
  exCard:        { background:'#1A1F35', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, padding:'16px 16px' },
  optionsList:   { display:'flex', flexDirection:'column', gap:9 },
  option:        { background:'#1A1F35', border:'1.5px solid', borderRadius:13, padding:'12px 14px', display:'flex', alignItems:'center', gap:11, transition:'all 0.15s' },
  optLetter:     { width:29, height:29, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0, transition:'all 0.15s', fontFamily:"'DM Mono',monospace" },
  matchCell:     { border:'1.5px solid', borderRadius:12, padding:'11px 12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:48, textAlign:'center', transition:'all 0.15s' },
  completeWrap:  { display:'flex', flexDirection:'column', alignItems:'center', padding:'32px 20px', gap:16, textAlign:'center', flex:1 },
  completeTitle: { fontSize:26, fontWeight:800 },
  completeSub:   { fontSize:14, color:'#8890B0', marginTop:-8 },
  statsRow:      { display:'flex', gap:10, width:'100%' },
  summaryCard:   { background:'#1A1F35', border:'1px solid rgba(255,255,255,0.1)', borderRadius:18, padding:18, width:'100%', textAlign:'left' },
  summaryTitle:  { fontSize:13, fontWeight:700, color:'#8B84FF', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:12 },
  summaryPoint:  { display:'flex', alignItems:'flex-start', fontSize:13, color:'#C0C8E0', lineHeight:1.5, marginBottom:8 },
  summaryNext:   { display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#555E80', marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)' },
  centerText:    { textAlign:'center', color:'#8890B0', padding:40, fontSize:16 },
  spinner:       { width:32, height:32, border:'3px solid rgba(108,99,255,0.2)', borderTopColor:'#6C63FF', borderRadius:'50%', animation:'spin .7s linear infinite' },
}
