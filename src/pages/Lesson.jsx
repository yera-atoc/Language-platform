import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'
import { syncNow } from '@hooks/useFirestoreSync'
import { Card, Badge, Progress, Button, Icons } from '@components/ui'

// Lesson data loader
function useLessonData(language, level, lessonId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    import(`../../content/${language}/${level}/${lessonId}.json`)
      .then(m => { setData(m.default); setLoading(false) })
      .catch(() => { setData(null); setLoading(false) })
  }, [language, level, lessonId])
  return { data, loading }
}

// TTS
function speak(text, language) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const langMap = { turkish: 'tr-TR', chinese: 'zh-CN', english: 'en-US' }
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = langMap[language] || 'tr-TR'
  utt.rate = 0.85
  window.speechSynthesis.speak(utt)
}

// Audio Button
function AudioBtn({ text, language, size = 'md' }) {
  const [playing, setPlaying] = useState(false)
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }
  
  const handle = () => {
    if (playing) { window.speechSynthesis.cancel(); setPlaying(false); return }
    setPlaying(true)
    speak(text, language)
    setTimeout(() => setPlaying(false), (text.length * 120) + 500)
  }
  
  return (
    <button 
      onClick={handle}
      className={`
        ${sizes[size]} rounded-full flex items-center justify-center
        transition-all duration-200 flex-shrink-0
        ${playing 
          ? 'bg-primary text-white shadow-button' 
          : 'bg-primary/10 text-primary hover:bg-primary/20'
        }
      `}
    >
      <Icons.volume className="w-5 h-5" />
    </button>
  )
}

const TIMER_SEC = 30
const LETTERS = ['A', 'B', 'C', 'D']
const STEPS = [
  { id: 'intro', icon: 'sparkles', label: 'Goals' },
  { id: 'grammar', icon: 'book', label: 'Grammar' },
  { id: 'vocab', icon: 'star', label: 'Words' },
  { id: 'dialogue', icon: 'volume', label: 'Dialogue' },
  { id: 'exercises', icon: 'lightning', label: 'Practice' },
]

export default function Lesson() {
  const { language, level, lessonId } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useLessonData(language, level, lessonId)
  const { addXP, loseLife, lives, maxLives, updateStreak } = useUserStore()
  const { completeLesson } = useProgressStore()

  const [step, setStep] = useState(0)
  const [exIndex, setExIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [matchState, setMatchState] = useState({})
  const [matchLeft, setMatchLeft] = useState(null)
  const [checked, setChecked] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [correctCount, setCCount] = useState(0)
  const [showComplete, setComplete] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIMER_SEC)
  const [flippedVocab, setFlippedVocab] = useState({})

  const timerRef = useRef(null)
  const startRef = useRef(Date.now())
  const shuffRef = useRef(null)

  const exercises = data?.exercises ?? []
  const current = exercises[exIndex]

  const goStep = useCallback((n) => setStep(n), [])

  const stopTimer = useCallback(() => clearInterval(timerRef.current), [])
  const startTimer = useCallback(() => {
    stopTimer()
    setTimeLeft(TIMER_SEC)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); return 0 }
        return t - 1
      })
    }, 1000)
  }, [stopTimer])

  useEffect(() => {
    if (timeLeft === 0 && !checked) {
      setChecked(true)
      setIsCorrect(false)
      loseLife()
    }
  }, [timeLeft, checked, loseLife])

  useEffect(() => {
    if (step === 4 && !showComplete && current) startTimer()
    return stopTimer
  }, [exIndex, step, showComplete, current, startTimer, stopTimer])

  useEffect(() => {
    if (current?.type === 'match_pairs') {
      shuffRef.current = [...(current.pairs || [])].sort(() => Math.random() - 0.5)
    }
  }, [exIndex, current])

  const canCheck = (() => {
    if (!current || checked) return false
    if (current.type === 'multiple_choice' || current.type === 'fill_blank') return selected !== null
    if (current.type === 'match_pairs') return Object.keys(matchState).length === (current.pairs?.length ?? 0)
    return false
  })()

  function checkAnswer() {
    if (!canCheck) return
    stopTimer()
    setChecked(true)
    let ok = false
    if (current.type === 'multiple_choice' || current.type === 'fill_blank') {
      ok = selected === current.correctAnswer
    }
    if (current.type === 'match_pairs') {
      ok = current.pairs?.every(p => matchState[p.left] === p.right)
    }
    setIsCorrect(ok)
    if (ok) {
      setCCount(c => c + 1)
    } else {
      loseLife()
    }
  }

  function nextExercise() {
    if (exIndex + 1 >= exercises.length) return finishLesson()
    setExIndex(i => i + 1)
    setSelected(null)
    setMatchState({})
    setMatchLeft(null)
    setChecked(false)
    setIsCorrect(null)
  }

  function finishLesson() {
    stopTimer()
    const elapsed = Math.round((Date.now() - startRef.current) / 1000)
    const finalOk = correctCount + (checked && isCorrect ? 1 : 0)
    const score = exercises.length > 0 ? Math.round(finalOk / exercises.length * 100) : 0
    const xp = score >= 80 ? (data?.xpReward ?? 60) : Math.round((data?.xpReward ?? 60) * 0.5)
    addXP(xp)
    updateStreak()
    completeLesson(language, level, lessonId, score)
    const uid = useUserStore.getState().user?.uid
    if (uid) syncNow(uid).catch(() => {})
    setComplete({ elapsed, finalOk, score, xp })
  }

  function handleMatchLeft(w) {
    if (checked) return
    setMatchLeft(x => x === w ? null : w)
  }

  function handleMatchRight(r) {
    if (checked || !matchLeft) return
    setMatchState(p => ({ ...p, [matchLeft]: r }))
    setMatchLeft(null)
  }

  const timerPct = timeLeft / TIMER_SEC
  const timerColor = timeLeft <= 10 ? 'text-error' : timeLeft <= 20 ? 'text-warning' : 'text-success'
  const exPct = exercises.length > 0 ? (exIndex / exercises.length) * 100 : 0

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  // Not found
  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">:(</div>
          <p className="text-text-secondary mb-6">Lesson not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  // Completion Screen
  if (showComplete) {
    const { elapsed, finalOk, score, xp } = showComplete
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1

    return (
      <div className="min-h-screen bg-background">
        <div className="container-narrow py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div 
              className="text-8xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              {score >= 80 ? '🏆' : score >= 60 ? '⭐' : '💪'}
            </motion.div>

            <h1 className="text-display-md text-text-primary mb-2">
              {score >= 80 ? 'Excellent!' : score >= 60 ? 'Good job!' : 'Keep going!'}
            </h1>

            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: i <= stars ? 1 : 0.5, rotate: 0, opacity: i <= stars ? 1 : 0.3 }}
                  transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                  className="text-4xl"
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <Card className="p-4 text-center">
                <Icons.star className="w-6 h-6 text-xp mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">+{xp}</p>
                <p className="text-sm text-text-secondary">XP earned</p>
              </Card>
              <Card className="p-4 text-center">
                <Icons.check className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">{finalOk}/{exercises.length}</p>
                <p className="text-sm text-text-secondary">Correct</p>
              </Card>
              <Card className="p-4 text-center">
                <Icons.clock className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">{mins}:{String(secs).padStart(2, '0')}</p>
                <p className="text-sm text-text-secondary">Time</p>
              </Card>
              <Card className="p-4 text-center">
                <Icons.trophy className="w-6 h-6 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-primary">{score}%</p>
                <p className="text-sm text-text-secondary">Accuracy</p>
              </Card>
            </div>

            {data.summary && (
              <Card className="p-6 text-left mb-8">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Icons.book className="w-5 h-5 text-primary" />
                  {data.summary.title}
                </h3>
                <ul className="space-y-2">
                  {data.summary.points?.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <Icons.check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="space-y-3">
              <Button fullWidth size="lg" onClick={() => navigate(-1)}>
                <Icons.arrowLeft className="w-5 h-5" />
                Back to lessons
              </Button>
              <Button 
                fullWidth 
                size="lg" 
                variant="secondary"
                onClick={() => {
                  setStep(0)
                  setExIndex(0)
                  setSelected(null)
                  setMatchState({})
                  setMatchLeft(null)
                  setChecked(false)
                  setIsCorrect(null)
                  setCCount(0)
                  setComplete(false)
                  setFlippedVocab({})
                  startRef.current = Date.now()
                }}
              >
                Repeat lesson
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Header
  const header = (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-lg border-b border-border-light">
      <div className="container-app flex items-center gap-4 h-14">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-error/10 hover:border-error/30 hover:text-error transition-colors"
        >
          <Icons.x className="w-5 h-5" />
        </button>
        
        <div className="flex-1">
          <Progress 
            value={step < 4 ? (step / STEPS.length) * 100 : exPct} 
            size="md" 
            animate={false}
          />
        </div>

        <div className="flex items-center gap-0.5">
          {Array.from({ length: maxLives }).map((_, i) => (
            <Icons.heart 
              key={i}
              className={`w-5 h-5 transition-all ${
                i < lives ? 'text-life' : 'text-life/20'
              }`}
            />
          ))}
        </div>
      </div>
    </header>
  )

  // Step Navigation
  const stepNav = (
    <div className="flex justify-between px-6 py-4 border-b border-border-light bg-surface">
      {STEPS.map((st, i) => {
        const done = i < step
        const active = i === step
        const Icon = Icons[st.icon] || Icons.star
        return (
          <div key={st.id} className="flex flex-col items-center gap-1">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold
              transition-all duration-300
              ${done ? 'bg-success text-white' : ''}
              ${active ? 'bg-primary text-white ring-4 ring-primary/20 scale-110' : ''}
              ${!done && !active ? 'bg-surface border border-border text-text-muted' : ''}
            `}>
              {done ? <Icons.check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
            </div>
            <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-text-muted'}`}>
              {st.label}
            </span>
          </div>
        )
      })}
    </div>
  )

  // Step 0 - Intro
  if (step === 0) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        {stepNav}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container-narrow py-6 space-y-6"
        >
          <Badge variant="primary">{level.toUpperCase()}</Badge>
          <h1 className="text-display-sm text-text-primary">{data.title}</h1>

          <Card className="p-5">
            <div className="flex items-start gap-4">
              <AudioBtn text={data.intro?.text?.slice(0, 200) || data.title} language={language} />
              <p className="text-text-secondary leading-relaxed">{data.intro?.text}</p>
            </div>
          </Card>

          {data.intro?.goals?.length > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Icons.sparkles className="w-5 h-5 text-primary" />
                Lesson Goals
              </h3>
              <ul className="space-y-3">
                {data.intro.goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-text-secondary">{g}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Button fullWidth size="lg" onClick={() => goStep(1)}>
            Start Lesson
            <Icons.arrowRight className="w-5 h-5" />
          </Button>
        </motion.main>
      </div>
    )
  }

  // Step 1 - Grammar
  if (step === 1) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        {stepNav}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container-narrow py-6 space-y-6"
        >
          {data.grammar?.map((g, gi) => (
            <Card key={gi} className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <h2 className="flex-1 font-semibold text-lg text-text-primary">{g.title}</h2>
                <AudioBtn text={g.title + '. ' + g.explanation} language="ru-RU" size="sm" />
              </div>
              <p className="text-text-secondary leading-relaxed mb-4">{g.explanation}</p>

              {g.table?.rows?.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-border-light mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface">
                        {g.table.headers?.map((h, hi) => (
                          <th key={hi} className="px-4 py-3 text-left font-semibold text-text-primary border-b border-border-light">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {g.table.rows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? '' : 'bg-surface/50'}>
                          {row.map((cell, ci) => (
                            <td key={ci} className={`px-4 py-3 border-b border-border-light ${ci === 0 ? 'font-semibold text-primary' : 'text-text-secondary'}`}>
                              <span className="flex items-center gap-2">
                                {cell}
                                {ci === 0 && (
                                  <button 
                                    onClick={() => speak(cell, language)}
                                    className="p-1 rounded-full hover:bg-primary/10 text-primary"
                                  >
                                    <Icons.volume className="w-4 h-4" />
                                  </button>
                                )}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {g.note && (
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3">
                  <Icons.lightning className="w-5 h-5 text-warning flex-shrink-0" />
                  <p className="text-sm text-warning">{g.note}</p>
                </div>
              )}
            </Card>
          ))}

          <Button fullWidth size="lg" onClick={() => goStep(2)}>
            Vocabulary
            <Icons.arrowRight className="w-5 h-5" />
          </Button>
        </motion.main>
      </div>
    )
  }

  // Step 2 - Vocabulary
  if (step === 2) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        {stepNav}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container-narrow py-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg text-text-primary">{data.vocabulary?.length} words</h2>
            <span className="text-sm text-text-muted">Tap to expand</span>
          </div>

          {data.vocabulary?.map((v, i) => {
            const open = flippedVocab[i]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card 
                  hover
                  onClick={() => setFlippedVocab(f => ({ ...f, [i]: !f[i] }))}
                  className={`cursor-pointer transition-all ${open ? 'ring-2 ring-primary/20' : ''}`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); speak(v.tr?.split(' ')[0] || v.tr, language) }}
                      className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors flex-shrink-0"
                    >
                      <Icons.volume className="w-5 h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary">{v.tr}</p>
                      <p className="text-sm text-text-muted">{v.pronunciation}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-text-primary">{v.ru}</p>
                      <Icons.arrowRight className={`w-4 h-4 text-text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 border-t border-border-light bg-primary/5">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); speak(v.example_tr, language) }}
                              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"
                            >
                              <Icons.volume className="w-4 h-4" />
                            </button>
                            <div>
                              <p className="font-medium text-primary mb-1">{v.example_tr}</p>
                              <p className="text-sm text-text-muted">{v.example_ru}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}

          <div className="pt-4">
            <Button fullWidth size="lg" onClick={() => goStep(3)}>
              Dialogue
              <Icons.arrowRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.main>
      </div>
    )
  }

  // Step 3 - Dialogue
  if (step === 3) {
    return (
      <div className="min-h-screen bg-background">
        {header}
        {stepNav}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container-narrow py-6 space-y-4"
        >
          <h2 className="font-semibold text-lg text-text-primary">{data.dialogue?.title}</h2>
          {data.dialogue?.context && (
            <Badge variant="neutral">{data.dialogue.context}</Badge>
          )}

          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
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
            }}
          >
            <Icons.play className="w-5 h-5" />
            Listen to full dialogue
          </Button>

          <div className="space-y-4 py-4">
            {data.dialogue?.lines?.map((line, i) => {
              const isRight = i % 2 !== 0
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: isRight ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex gap-3 ${isRight ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-lg flex-shrink-0">
                    {isRight ? '🧑' : '👤'}
                  </div>
                  <div className={`max-w-[80%] ${isRight ? 'text-right' : ''}`}>
                    <p className="text-xs text-text-muted mb-1">{line.speaker}</p>
                    <Card className={`p-4 ${isRight ? 'bg-primary/5 border-primary/20' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-text-primary mb-1">{line.tr}</p>
                          <p className="text-sm text-text-muted">{line.ru}</p>
                        </div>
                        <button
                          onClick={() => speak(line.tr, language)}
                          className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"
                        >
                          <Icons.volume className="w-4 h-4" />
                        </button>
                      </div>
                    </Card>
                    {line.note && (
                      <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
                        <Icons.lightning className="w-3 h-3" />
                        {line.note}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {data.cultural_note && (
            <Card className="p-5 bg-warning/5 border-warning/20">
              <h3 className="font-semibold text-text-primary mb-2 flex items-center gap-2">
                <Icons.globe className="w-5 h-5 text-warning" />
                {data.cultural_note.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">{data.cultural_note.text}</p>
            </Card>
          )}

          <Button fullWidth size="lg" onClick={() => goStep(4)}>
            Practice
            <Icons.arrowRight className="w-5 h-5" />
          </Button>
        </motion.main>
      </div>
    )
  }

  // Step 4 - Exercises
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {header}
      {stepNav}

      <main className="flex-1 container-narrow py-6 flex flex-col">
        {/* Timer and progress */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-border-light" />
              <circle
                cx="32" cy="32" r="28" fill="none" strokeWidth="4"
                strokeLinecap="round"
                className={timerColor.replace('text-', 'stroke-')}
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - timerPct)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${timerColor}`}>{timeLeft}</span>
              <span className="text-xs text-text-muted">sec</span>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm text-text-secondary mb-2">
              Question {exIndex + 1} of {exercises.length}
            </p>
            <Progress value={exPct} size="md" animate={false} />
            <Badge 
              variant="primary" 
              size="sm" 
              className="mt-2"
            >
              {current?.type === 'multiple_choice' ? 'Multiple choice' : 
               current?.type === 'fill_blank' ? 'Fill in the blank' : 'Match pairs'}
            </Badge>
          </div>
        </div>

        {/* Question */}
        <Card className="p-5 mb-6">
          <div className="flex items-start gap-3">
            <p className="flex-1 text-lg font-semibold text-text-primary">{current?.question}</p>
            <AudioBtn text={current?.question || ''} language="ru-RU" size="sm" />
          </div>
          {current?.hint && (
            <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <p className="text-sm text-warning flex items-center gap-2">
                <Icons.lightning className="w-4 h-4" />
                {current.hint}
              </p>
            </div>
          )}
        </Card>

        {/* Options */}
        {(current?.type === 'multiple_choice' || current?.type === 'fill_blank') && (
          <div className="space-y-3 flex-1">
            {current.options?.map((opt, i) => {
              const sel = selected === opt
              const right = checked && opt === current.correctAnswer
              const wrong = checked && sel && opt !== current.correctAnswer

              return (
                <motion.button
                  key={i}
                  onClick={() => !checked && setSelected(opt)}
                  disabled={checked}
                  whileTap={checked ? {} : { scale: 0.98 }}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all
                    ${right ? 'border-success bg-success/5' : ''}
                    ${wrong ? 'border-error bg-error/5 animate-shake' : ''}
                    ${sel && !checked ? 'border-primary bg-primary/5' : ''}
                    ${!sel && !right && !wrong ? 'border-border hover:border-primary/30' : ''}
                    ${checked ? 'cursor-default' : 'cursor-pointer'}
                  `}
                >
                  <span className={`
                    w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                    ${right ? 'bg-success text-white' : ''}
                    ${wrong ? 'bg-error text-white' : ''}
                    ${sel && !checked ? 'bg-primary text-white' : ''}
                    ${!sel && !right && !wrong ? 'bg-surface border border-border text-text-secondary' : ''}
                  `}>
                    {right ? <Icons.check className="w-5 h-5" /> : 
                     wrong ? <Icons.x className="w-5 h-5" /> : 
                     LETTERS[i]}
                  </span>
                  <span className={`flex-1 font-medium ${right ? 'text-success' : wrong ? 'text-error' : 'text-text-primary'}`}>
                    {opt}
                  </span>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Match pairs */}
        {current?.type === 'match_pairs' && (
          <div className="flex gap-4 flex-1">
            <div className="flex-1 space-y-2">
              {current.pairs?.map((p, i) => {
                const sel = matchLeft === p.left
                const matched = matchState[p.left]
                const isCorrect = checked && matched === p.right
                const isWrong = checked && matched && matched !== p.right

                return (
                  <button
                    key={i}
                    onClick={() => handleMatchLeft(p.left)}
                    disabled={checked || matched}
                    className={`
                      w-full p-4 rounded-xl border-2 text-left transition-all
                      ${sel ? 'border-primary bg-primary/5' : ''}
                      ${matched && !checked ? 'border-success/50 bg-success/5' : ''}
                      ${isCorrect ? 'border-success bg-success/5' : ''}
                      ${isWrong ? 'border-error bg-error/5' : ''}
                      ${!sel && !matched ? 'border-border hover:border-primary/30' : ''}
                    `}
                  >
                    {p.left}
                  </button>
                )
              })}
            </div>
            <div className="flex-1 space-y-2">
              {(shuffRef.current || current.pairs)?.map((p, i) => {
                const usedBy = Object.entries(matchState).find(([, v]) => v === p.right)?.[0]
                const isSelected = usedBy != null
                const isCorrect = checked && usedBy && current.pairs.find(pair => pair.left === usedBy)?.right === p.right

                return (
                  <button
                    key={i}
                    onClick={() => handleMatchRight(p.right)}
                    disabled={checked || isSelected}
                    className={`
                      w-full p-4 rounded-xl border-2 text-left transition-all
                      ${isSelected && !checked ? 'border-success/50 bg-success/5 opacity-50' : ''}
                      ${isCorrect ? 'border-success bg-success/5' : ''}
                      ${isSelected && checked && !isCorrect ? 'border-error bg-error/5' : ''}
                      ${!isSelected ? 'border-border hover:border-primary/30' : ''}
                    `}
                  >
                    {p.right}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mt-6 p-5 rounded-2xl ${isCorrect ? 'bg-success/10 border border-success/20' : 'bg-error/10 border border-error/20'}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCorrect ? 'bg-success' : 'bg-error'}`}>
                  {isCorrect ? <Icons.check className="w-6 h-6 text-white" /> : <Icons.x className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isCorrect ? 'text-success' : 'text-error'}`}>
                    {isCorrect ? 'Correct!' : 'Not quite'}
                  </h3>
                  {current?.explanation && (
                    <p className="text-sm text-text-secondary">{current.explanation}</p>
                  )}
                </div>
              </div>
              <Button 
                fullWidth 
                variant={isCorrect ? 'success' : 'error'}
                onClick={nextExercise}
              >
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Check button */}
        {!checked && (
          <div className="mt-auto pt-6">
            <Button 
              fullWidth 
              size="lg" 
              disabled={!canCheck}
              onClick={checkAnswer}
            >
              Check Answer
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
