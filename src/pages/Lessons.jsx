import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useProgressStore from '@store/progressStore'
import useUserStore from '@store/userStore'
import { Card, Badge, Progress, Button, Icons } from '@components/ui'
import turkishData from '@content/turkish/index.json'
import chineseData from '@content/chinese/index.json'

const LANG_DATA = {
  turkish: turkishData,
  chinese: chineseData,
}

const LANG_META = {
  turkish: { name: 'Turkish', nativeName: 'Turkce', color: 'turkish' },
  chinese: { name: 'Chinese', nativeName: 'Chinese', color: 'chinese' },
}

const LEVEL_BADGE_VARIANTS = {
  a0: 'a1', a1: 'a1', a2: 'a2',
  b1: 'b1', b2: 'b2', c1: 'c1', c2: 'c2',
  hsk0: 'a1', hsk1: 'a1', hsk2: 'a2',
  hsk3: 'b1', hsk4: 'b2', hsk5: 'c1', hsk6: 'c2', hsk7: 'c2',
}

export default function Lessons() {
  const { language = 'turkish', level: levelParam } = useParams()
  const defaultLevel = language === 'chinese' ? 'hsk1' : 'a1'
  const navigate = useNavigate()

  const { getLevelProgress, getLessonProgress, isLessonUnlocked } = useProgressStore()
  const { xp, streak } = useUserStore()

  const langData = LANG_DATA[language]
  const langMeta = LANG_META[language] ?? { name: language, color: 'primary' }

  const levelKeys = langData ? Object.keys(langData.levels) : []
  const [activeLevel, setActiveLevel] = useState(levelParam ?? defaultLevel)

  const levelInfo = langData?.levels?.[activeLevel]
  const lessons = levelInfo?.lessons ?? []
  const levelBadgeVariant = LEVEL_BADGE_VARIANTS[activeLevel] ?? 'primary'

  const { completed } = getLevelProgress(language, activeLevel)
  const total = lessons.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  function isLevelUnlocked(key) {
    const idx = levelKeys.indexOf(key)
    if (idx === 0) return true
    const prevKey = levelKeys[idx - 1]
    const prevLessons = langData?.levels?.[prevKey]?.lessons?.length ?? 0
    return getLevelProgress(language, prevKey).completed >= prevLessons
  }

  const avgAccuracy = (() => {
    const scores = lessons
      .map((l) => getLessonProgress(language, activeLevel, l.id)?.score)
      .filter(Boolean)
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  })()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border-light">
        <div className="container-app flex items-center gap-4 h-16">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center hover:bg-primary/5 hover:border-primary/30 transition-colors"
          >
            <Icons.arrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
              {langMeta.name}
            </p>
            <h1 className="text-lg font-bold text-text-primary">
              Level {activeLevel.toUpperCase()}
            </h1>
          </div>
          <Badge variant={levelBadgeVariant} size="lg">
            {activeLevel.toUpperCase()}
          </Badge>
        </div>
      </header>

      <main className="container-app py-6 space-y-6">
        {/* Level Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          {levelKeys.map((key) => {
            const unlocked = isLevelUnlocked(key)
            const isActive = key === activeLevel
            const variant = LEVEL_BADGE_VARIANTS[key] ?? 'neutral'
            
            return (
              <button
                key={key}
                onClick={() => unlocked && setActiveLevel(key)}
                disabled={!unlocked}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm
                  transition-all duration-200 border-2
                  ${isActive 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : unlocked
                      ? 'bg-surface border-border hover:border-primary/30 text-text-secondary hover:text-text-primary'
                      : 'bg-surface/50 border-border-light text-text-muted cursor-not-allowed opacity-50'
                  }
                `}
              >
                {key.toUpperCase()}
                {!unlocked && <Icons.lock className="w-3 h-3 ml-1 inline" />}
              </button>
            )
          })}
        </div>

        {/* Progress Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-5 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-text-primary">
                  {levelInfo?.title || `Level ${activeLevel.toUpperCase()}`}
                </h2>
                <p className="text-sm text-text-secondary">
                  {completed} of {total} lessons completed
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{pct}%</span>
              </div>
            </div>
            
            <Progress value={pct} size="lg" className="mb-4" />
            
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border-light">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icons.star className="w-4 h-4 text-xp" />
                  <span className="text-lg font-bold text-text-primary">{xp}</span>
                </div>
                <span className="text-xs text-text-muted">Total XP</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icons.check className="w-4 h-4 text-success" />
                  <span className="text-lg font-bold text-text-primary">
                    {avgAccuracy ? `${avgAccuracy}%` : '-'}
                  </span>
                </div>
                <span className="text-xs text-text-muted">Accuracy</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icons.fire className="w-4 h-4 text-streak" />
                  <span className="text-lg font-bold text-text-primary">{streak}</span>
                </div>
                <span className="text-xs text-text-muted">Streak</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Lessons List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            Lessons
          </h3>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeLevel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {lessons.map((lesson, idx) => {
                const prog = getLessonProgress(language, activeLevel, lesson.id)
                const done = !!prog?.completed
                const unlocked = isLessonUnlocked(language, activeLevel, idx)
                const isCurrent = !done && unlocked

                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card
                      hover={unlocked}
                      onClick={() => unlocked && navigate(`/lesson/${language}/${activeLevel}/${lesson.id}`)}
                      className={`
                        relative overflow-hidden transition-all
                        ${!unlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        ${isCurrent ? 'ring-2 ring-primary/30 bg-primary/5' : ''}
                        ${done ? 'bg-success/5' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Status Icon */}
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm
                          ${done ? 'bg-success/10 text-success' : ''}
                          ${isCurrent ? 'bg-primary/10 text-primary' : ''}
                          ${!done && !isCurrent ? 'bg-text-muted/10 text-text-muted' : ''}
                        `}>
                          {done ? (
                            <Icons.check className="w-6 h-6" />
                          ) : isCurrent ? (
                            <Icons.play className="w-6 h-6" />
                          ) : (
                            <Icons.lock className="w-5 h-5" />
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-muted uppercase tracking-wider">
                            Lesson {idx + 1}
                          </p>
                          <h4 className={`font-semibold truncate ${done || isCurrent ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {lesson.title}
                          </h4>
                          <p className="text-sm text-text-muted mt-0.5">
                            {done 
                              ? 'Completed' 
                              : isCurrent 
                                ? 'Tap to start' 
                                : 'Locked'
                            }
                          </p>
                        </div>

                        {/* Right Side */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {prog?.score != null ? (
                            <>
                              <Badge 
                                variant={prog.score >= 90 ? 'success' : prog.score >= 70 ? 'warning' : 'error'}
                                size="sm"
                              >
                                {prog.score}%
                              </Badge>
                              <span className="text-xs text-text-muted">+{lesson.xp} XP</span>
                            </>
                          ) : isCurrent ? (
                            <Badge variant="primary" size="sm">
                              +{lesson.xp} XP
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isCurrent && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                      {done && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-success" />
                      )}
                    </Card>
                  </motion.div>
                )
              })}

              {lessons.length === 0 && (
                <Card className="p-8 text-center">
                  <Icons.book className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <h4 className="font-semibold text-text-primary mb-2">Coming Soon</h4>
                  <p className="text-sm text-text-secondary">
                    Lessons for this level are being prepared
                  </p>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom spacing */}
        <div className="h-24 md:h-8" />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border-light z-50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          {[
            { path: '/', label: 'Home', icon: Icons.home },
            { path: '/lessons', label: 'Lessons', icon: Icons.book, active: true },
            { path: '/progress', label: 'Progress', icon: Icons.chart },
            { path: '/profile', label: 'Profile', icon: Icons.user },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors
                  ${item.active ? 'text-primary' : 'text-text-secondary'}
                `}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
                {item.active && (
                  <motion.div
                    layoutId="mobile-nav-indicator-lessons"
                    className="absolute -top-2 w-12 h-1 bg-primary rounded-full"
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
