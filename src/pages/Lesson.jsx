import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'
import { syncNow } from '@hooks/useFirestoreSync'
import { useLives } from '@hooks/useLives'
import NoLivesModal from '@components/ui/NoLivesModal'

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

const TIMER_SEC = 30
const CIRC      = 188.4
const LETTERS   = ['A','B','C','D']

function typeName(type) {
  return type === 'multiple_choice' ? 'Выбор ответа'
       : type === 'fill_blank'      ? 'Заполни пробел'
       : type === 'match_pairs'     ? 'Соедини пары'
       : 'Упражнение'
}

export default function Lesson() {
  const { language, level, lessonId } = useParams()
  const navigate                      = useNavigate()
  const { data, loading }             = useLessonData(language, level, lessonId)
  const { addXP, loseLife, lives, updateStreak } = useUserStore()
  const { completeLesson }            = useProgressStore()
  const { hasLives }                  = useLives()
  const [showNoLives, setShowNoLives] = useState(false)

  const [exIndex, setExIndex]       = useState(0)
  const [selected, setSelected]     = useState(null)
  const [matchState, setMatchState] = useState({})
  const [matchLeft, setMatchLeft]   = useState(null)
  const [checked, setChecked]       = useState(false)
  const [isCorrect, setIsCorrect]   = useState(null)
  const [correctCount, setCCount]   = useState(0)
  const [showComplete, setComplete] = useState(false)
  const [timeLeft, setTimeLeft]     = useState(TIMER_SEC)

  const timerRef    = useRef(null)
  const startRef    = useRef(Date.now())
  const elapsedRef  = useRef(0)
  const shuffledRef = useRef(null)

  const exercises = data?.exercises ?? []
  const current   = exercises[exIndex]

  useEffect(() => {
    if (current?.type === 'match_pairs') {
      shuffledRef.current = [...current.pairs].sort(() => Math.random() - 0.5)
    }
  }, [exIndex, current])

  const stopTimer = useCallback(() => clearInterval(timerRef.current), [])

  const startTimer = useCallback(() => {
    stopTimer()
    setTimeLeft(TIMER_SEC)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { stopTimer(); return 0 } return t - 1 })
    }, 1000)
  }, [stopTimer])

  useEffect(() => {
    if (timeLeft === 0 && !checked) {
      setChecked(true); setIsCorrect(false); loseLife()
    }
  }, [timeLeft, checked, loseLife])

  useEffect(() => {
    if (!showComplete && current) startTimer()
    return stopTimer
  }, [exIndex, showComplete]) // eslint-disable-line

  const canCheck = (() => {
    if (!current || checked) return false
    if (current.type === 'multiple_choice') return selected !== null
    if (current.type === 'fill_blank')      return selected !== null
    if (current.type === 'match_pairs')     return Object.keys(matchState).length === current.pairs.length
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
    const score = exercises.length > 0 ? Math.round((finalCorrect / exercises.length) * 100) : 0
    const xp = score >= 80 ? (data?.xpReward ?? 50) : Math.round((data?.xpReward ?? 50) * 0.5)
    addXP(xp); updateStreak(); completeLesson(language, level, lessonId, score)
    const uid = useUserStore.getState().user?.uid
    if (uid) syncNow(uid).catch(() => {})
    setComplete(true)
  }

  function handleMatchLeft(word) { if (checked) return; setMatchLeft(w => w === word ? null : word) }
  function handleMatchRight(tr) { if (checked || !matchLeft) return; setMatchState(p => ({ ...p, [matchLeft]: tr })); setMatchLeft(null) }
  function pairResult(left) { if (!checked) return null; return matchState[left] === current.pairs.find(p => p.left === left)?.right }

  function spawnXP(text) {
    const el = document.createElement('div'); el.textContent = text
    Object.assign(el.style, { position:'fixed', top:'45%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'22px', fontWeight:'800', color:'#FFD060', pointerEvents:'none', zIndex:'9999', fontFamily:'Outfit,sans-serif', animation:'xpFloat 1s ease forwards' })
    document.body.appendChild(el); setTimeout(() => el.remove(), 1000)
  }

  const timerColor  = timeLeft <= 10 ? '#FF4D6D' : timeLeft <= 20 ? '#FFD060' : '#6C63FF'
  const dashOffset  = CIRC * (1 - timeLeft / TIMER_SEC)
  const progressPct = exercises.length > 0 ? (exIndex / exercises.length) * 100 : 0
  const finalCorrect = correctCount + (checked && isCorrect ? 1 : 0)
  const finalScore   = exercises.length > 0 ? Math.round((finalCorrect / exercises.length) * 100) : 0
  const xpEarned     = finalScore >= 80 ? (data?.xpReward ?? 50) : Math.round((data?.xpReward ?? 50) * 0.5)

  if (!hasLives || showNoLives) return <NoLivesModal onClose={() => setShowNoLives(false)} onPractice={() => navigate(-1)} />

  if (loading) return <Shell><p style={{ textAlign:'center', color:'#8890B0', padding:40 }}>Загружаем урок…</p></Shell>
  if (!data)   return <Shell><p style={{ textAlign:'center', color:'#8890B0', padding:40 }}>Урок не найден</p><div style={{ padding:'0 20px' }}><Btn variant="primary" onClick={() => navigate(-1)}>← Назад</Btn></div></Shell>

  if (showComplete) {
    const mins = Math.floor(elapsedRef.current / 60); const secs = elapsedRef.current % 60
    return (
      <Shell>
        <div style={s.completeWrap}>
          <div style={{ fontSize:72 }}>🏆</div>
          <h2 style={{ fontSize:28, fontWeight:800 }}>Урок пройден!</h2>
          <p style={{ color:'#8890B0', marginTop:-8 }}>{finalScore >= 80 ? 'Отличная работа!' : 'Неплохо, продолжай!'}</p>
          <div style={{ display:'flex', gap:12, width:'100%' }}>
            <StatBox label="XP"    value={`+${xpEarned}`}                            color="#FFD060" />
            <StatBox label="Верно" value={`${finalCorrect}/${exercises.length}`}     color="#4ADE80" />
            <StatBox label="Время" value={`${mins}:${String(secs).padStart(2,'0')}`} color="#8B84FF" />
          </div>
          <div style={{ width:'100%' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#8890B0', marginBottom:6 }}>
              <span>Прогресс уровня</span><span style={{ color:'#FFD060' }}>+{xpEarned} XP</span>
            </div>
            <div style={{ height:10, background:'#232840', borderRadius:5, overflow:'hidden' }}>
              <div style={{ height:'100%', width:'38%', background:'linear-gradient(90deg,#6C63FF,#FFD060)', borderRadius:5 }} />
            </div>
          </div>
          <Btn variant="success" onClick={() => navigate(-1)}>← К урокам</Btn>
          <Btn variant="primary" onClick={() => { setExIndex(0); setSelected(null); setMatchState({}); setMatchLeft(null); setChecked(false); setIsCorrect(null); setCCount(0); setComplete(false); startRef.current = Date.now() }}>Повторить урок</Btn>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <header style={s.topbar}>
        <button style={s.closeBtn} onClick={() => navigate(-1)}>✕</button>
        <div style={s.progressOuter}><div style={{ ...s.progressInner, width:`${progressPct}%` }} /></div>
        <div style={{ display:'flex', gap:2 }}>{Array.from({ length:5 }).map((_,i) => <span key={i} style={{ fontSize:14, opacity: i < lives ? 1 : 0.2 }}>❤️</span>)}</div>
      </header>
      <div style={s.timerWrap}>
        <div style={s.timerRing}>
          <svg viewBox="0 0 72 72" width="72" height="72" style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r="30" fill="none" stroke="#232840" strokeWidth="4" />
            <circle cx="36" cy="36" r="30" fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dashOffset} style={{ transition:'stroke-dashoffset 1s linear,stroke 0.4s' }} />
          </svg>
          <div style={s.timerCenter}>
            <span style={{ fontSize:22, fontWeight:800, fontFamily:"'DM Mono',monospace", color:timerColor }}>{timeLeft}</span>
            <span style={{ fontSize:9, color:'#555E80', textTransform:'uppercase', letterSpacing:'0.5px' }}>сек</span>
          </div>
        </div>
      </div>
      <div style={s.exWrap}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={s.exNum}>Вопрос {exIndex+1} из {exercises.length}</span>
          <span style={s.exBadge}>{typeName(current?.type)}</span>
        </div>
        <div style={s.exCard}>
          <p style={{ fontSize:17, fontWeight:700, lineHeight:1.4 }}>{current?.question}</p>
          {current?.word && <span style={{ fontSize:28, fontWeight:800, color:'#8B84FF', display:'block', margin:'10px 0 3px' }}>{current.word}</span>}
          {current?.pronun && <span style={{ fontSize:13, color:'#555E80', fontFamily:"'DM Mono',monospace" }}>{current.pronun}</span>}
          {current?.hint && <p style={{ fontSize:13, color:'#8890B0', marginTop:8, lineHeight:1.5 }}>{current.hint}</p>}
        </div>
        {(current?.type === 'multiple_choice' || current?.type === 'fill_blank') && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {current.options.map((opt, i) => {
              const isSel = selected === opt; const isRight = checked && opt === current.correctAnswer; const isWrong = checked && isSel && opt !== current.correctAnswer
              return (
                <div key={i} onClick={() => !checked && setSelected(opt)} style={{ ...s.option, borderColor: isRight ? '#4ADE80' : isWrong ? '#FF4D6D' : isSel ? '#6C63FF' : 'rgba(255,255,255,0.1)', background: isRight ? 'rgba(74,222,128,0.1)' : isWrong ? 'rgba(255,77,109,0.1)' : isSel ? 'rgba(108,99,255,0.1)' : '#1A1F35', cursor: checked ? 'default' : 'pointer' }}>
                  <div style={{ ...s.optLetter, background: isRight ? '#4ADE80' : isWrong ? '#FF4D6D' : isSel ? '#6C63FF' : '#232840', color: (isRight||isWrong||isSel) ? 'white' : '#555E80' }}>{isRight ? '✓' : isWrong ? '✗' : LETTERS[i]}</div>
                  <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{opt}</span>
                </div>
              )
            })}
          </div>
        )}
        {current?.type === 'match_pairs' && shuffledRef.current && (
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              {current.pairs.map(p => { const sel = matchLeft === p.left; const paired = matchState[p.left] !== undefined; const result = pairResult(p.left)
                return <div key={p.left} onClick={() => !paired && handleMatchLeft(p.left)} style={{ ...s.matchCell, borderColor: result===true?'#4ADE80':result===false?'#FF4D6D':sel?'#6C63FF':paired?'rgba(108,99,255,0.4)':'rgba(255,255,255,0.1)', background: result===true?'rgba(74,222,128,0.1)':result===false?'rgba(255,77,109,0.1)':sel?'rgba(108,99,255,0.15)':paired?'rgba(108,99,255,0.06)':'#1A1F35', cursor: paired||checked?'default':'pointer' }}><span style={{ fontSize:13, fontWeight:700 }}>{p.left}</span>{paired && <span style={{ fontSize:11, color:'#555E80', marginTop:2 }}>{matchState[p.left]}</span>}</div>
              })}
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8 }}>
              {shuffledRef.current.map(p => { const taken = Object.values(matchState).includes(p.right)
                return <div key={p.right} onClick={() => !taken && !checked && handleMatchRight(p.right)} style={{ ...s.matchCell, borderColor: taken?'rgba(108,99,255,0.4)':'rgba(255,255,255,0.1)', background: taken?'rgba(108,99,255,0.06)':'#1A1F35', opacity: taken?0.5:1, cursor: taken||checked?'default':'pointer' }}><span style={{ fontSize:13, fontWeight:600, color: taken?'#555E80':'#F0F2FF' }}>{p.right}</span></div>
              })}
            </div>
          </div>
        )}
        {checked && (
          <div style={{ border:'1px solid', borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:10, background: isCorrect?'rgba(74,222,128,0.08)':'rgba(255,77,109,0.08)', borderColor: isCorrect?'rgba(74,222,128,0.25)':'rgba(255,77,109,0.25)' }}>
            <span style={{ fontSize:20 }}>{isCorrect?'✅':timeLeft===0?'⏱️':'❌'}</span>
            <div><div style={{ fontSize:14, fontWeight:700, color: isCorrect?'#4ADE80':'#FF4D6D', marginBottom:3 }}>{isCorrect?'Правильно!':timeLeft===0?'Время вышло!':'Неверно'}</div><div style={{ fontSize:13, color:'#8890B0', lineHeight:1.5 }}>{current?.explanation}</div></div>
          </div>
        )}
      </div>
      <div style={{ padding:'12px 20px 32px' }}>
        {!checked ? <Btn variant="primary" disabled={!canCheck} onClick={checkAnswer}>Проверить</Btn>
                  : <Btn variant="success" onClick={nextExercise}>{exIndex+1 >= exercises.length ? 'Завершить урок 🎉' : 'Далее →'}</Btn>}
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return (
    <div style={{ background:'#080B14', color:'#F0F2FF', minHeight:'100vh', fontFamily:"'Outfit',sans-serif" }}>
      <style>{`@keyframes xpFloat{0%{opacity:1;transform:translate(-50%,-50%)}100%{opacity:0;transform:translate(-50%,-120%)}}`}</style>
      <div style={{ maxWidth:420, margin:'0 auto', minHeight:'100vh', display:'flex', flexDirection:'column' }}>{children}</div>
    </div>
  )
}
function Btn({ variant='primary', disabled, onClick, children }) {
  const bg = variant==='success'?'#4ADE80':'#6C63FF'; const cl = variant==='success'?'#052012':'white'
  return <button disabled={disabled} onClick={onClick} style={{ width:'100%', padding:16, borderRadius:16, border:'none', background:disabled?'#232840':bg, color:disabled?'#555E80':cl, fontSize:16, fontWeight:800, fontFamily:"'Outfit',sans-serif", cursor:disabled?'not-allowed':'pointer', transition:'all 0.15s', marginBottom:8 }}>{children}</button>
}
function StatBox({ label, value, color }) {
  return <div style={{ flex:1, background:'#1A1F35', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'16px 12px', textAlign:'center' }}><div style={{ fontSize:22, fontWeight:800, color }}>{value}</div><div style={{ fontSize:11, color:'#555E80', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px', marginTop:3 }}>{label}</div></div>
}

const s = {
  topbar:      { display:'flex', alignItems:'center', gap:12, padding:'16px 20px 12px' },
  closeBtn:    { width:36, height:36, borderRadius:10, background:'#1A1F35', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14, color:'#8890B0', flexShrink:0, fontFamily:'inherit' },
  progressOuter:{ flex:1, height:8, background:'#232840', borderRadius:4, overflow:'hidden' },
  progressInner:{ height:'100%', background:'linear-gradient(90deg,#6C63FF,#8B84FF)', borderRadius:4, transition:'width 0.5s ease' },
  timerWrap:   { display:'flex', justifyContent:'center', padding:'10px 20px 0' },
  timerRing:   { position:'relative', width:72, height:72 },
  timerCenter: { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:1 },
  exWrap:      { flex:1, padding:'16px 20px 0', display:'flex', flexDirection:'column', gap:14 },
  exNum:       { fontSize:11, fontWeight:700, color:'#555E80', textTransform:'uppercase', letterSpacing:'0.8px' },
  exBadge:     { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', padding:'3px 8px', borderRadius:6, background:'rgba(108,99,255,0.15)', color:'#8B84FF' },
  exCard:      { background:'#1A1F35', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'20px 18px' },
  option:      { background:'#1A1F35', border:'1.5px solid', borderRadius:14, padding:'13px 16px', display:'flex', alignItems:'center', gap:12, transition:'all 0.15s' },
  optLetter:   { width:30, height:30, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, flexShrink:0, transition:'all 0.15s' },
  matchCell:   { border:'1.5px solid', borderRadius:12, padding:'12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:50, textAlign:'center', transition:'all 0.15s' },
  completeWrap:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flex:1, padding:'32px 20px', gap:20, textAlign:'center' },
}
