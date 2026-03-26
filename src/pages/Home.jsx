import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useUserStore from '@store/userStore'
import useProgressStore from '@store/progressStore'
import { Card, Badge, Progress, Button, Icons } from '@components/ui'
import { XPStat, StreakStat } from '@components/ui/Stats'

// Data imports
import turkishData from '@content/turkish/index.json'
import chineseData from '@content/chinese/index.json'

const LANGUAGES = [
  { code: 'turkish', name: 'Turkish', nativeName: 'Turkce', color: 'turkish', phase: 1, data: turkishData },
  { code: 'chinese', name: 'Chinese', nativeName: 'Chinese', color: 'chinese', phase: 1, data: chineseData },
  { code: 'korean', name: 'Korean', nativeName: 'Korean', color: 'primary', phase: 2 },
  { code: 'arabic', name: 'Arabic', nativeName: 'Arabic', color: 'success', phase: 3 },
  { code: 'spanish', name: 'Spanish', nativeName: 'Spanish', color: 'warning', phase: 3 },
]

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Home() {
  const navigate = useNavigate()
  const { xp, level, streak, lives, maxLives } = useUserStore()
  const { getLevelProgress } = useProgressStore()
  const [activeLang, setActiveLang] = useState('turkish')

  const langMeta = LANGUAGES.find(l => l.code === activeLang)
  const levelKeys = langMeta?.data ? Object.keys(langMeta.data.levels) : []

  // Find next uncompleted lesson
  const findContinueLesson = () => {
    const firstLevel = levelKeys[0]
    const lessons = langMeta?.data?.levels?.[firstLevel]?.lessons
    if (!lessons) return null
    const { completed } = getLevelProgress(activeLang, firstLevel)
    const idx = Math.min(completed, lessons.length - 1)
    return { ...lessons[idx], levelKey: firstLevel, index: idx }
  }

  const continueLesson = findContinueLesson()
  const firstLevel = levelKeys[0]
  const firstLevelLessons = langMeta?.data?.levels?.[firstLevel]?.lessons ?? []
  const firstLevelProgress = getLevelProgress(activeLang, firstLevel)
  const progressPct = firstLevelLessons.length > 0
    ? Math.round((firstLevelProgress.completed / firstLevelLessons.length) * 100)
    : 0

  // Streak week calculation
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const streakDays = WEEK_DAYS.map((d, i) => ({
    label: d[0],
    done: streak > 0 && i < todayIdx,
    today: i === todayIdx,
  }))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border-light">
        <div className="container-app flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Icons.globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-text-primary">LangPlatform</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {/* XP */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-xp/10">
              <Icons.star className="w-4 h-4 text-xp" />
              <span className="text-sm font-semibold text-text-primary">{xp}</span>
            </div>
            
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-streak/10">
              <Icons.fire className="w-4 h-4 text-streak" />
              <span className="text-sm font-semibold text-text-primary">{streak}</span>
            </div>

            {/* Lives */}
            <div className="flex items-center gap-0.5 px-3 py-1.5 rounded-full bg-life/10">
              {Array.from({ length: maxLives }).map((_, i) => (
                <Icons.heart 
                  key={i} 
                  className={`w-4 h-4 ${i < lives ? 'text-life' : 'text-life/20'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="container-app py-6 space-y-8">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-display-md text-text-primary mb-2">
            Welcome back!
          </h1>
          <p className="text-text-secondary text-lg">
            Continue your language learning journey
          </p>
        </motion.section>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-streak/10 flex items-center justify-center flex-shrink-0">
                <Icons.fire className="w-7 h-7 text-streak" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-text-secondary font-medium">Current streak</p>
                <p className="text-3xl font-bold text-text-primary">
                  {streak} <span className="text-lg font-normal text-text-secondary">days</span>
                </p>
              </div>
              <div className="flex gap-1.5">
                {streakDays.map((d, i) => (
                  <div 
                    key={i}
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold
                      ${d.today ? 'bg-primary text-white' : ''}
                      ${d.done ? 'bg-streak/20 text-streak' : ''}
                      ${!d.today && !d.done ? 'bg-surface border border-border text-text-muted' : ''}
                    `}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <Card className="p-4 text-center">
            <Icons.star className="w-6 h-6 text-xp mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{xp}</p>
            <p className="text-sm text-text-secondary">Total XP</p>
          </Card>
          <Card className="p-4 text-center">
            <Icons.lightning className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{level}</p>
            <p className="text-sm text-text-secondary">Level</p>
          </Card>
          <Card className="p-4 text-center">
            <Icons.fire className="w-6 h-6 text-streak mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{streak}</p>
            <p className="text-sm text-text-secondary">Day streak</p>
          </Card>
          <Card className="p-4 text-center">
            <Icons.heart className="w-6 h-6 text-life mx-auto mb-2" />
            <p className="text-2xl font-bold text-text-primary">{lives}/{maxLives}</p>
            <p className="text-sm text-text-secondary">Lives</p>
          </Card>
        </motion.div>

        {/* Languages Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Languages</h2>
            <Link to="/lessons" className="text-sm text-primary font-medium hover:underline">
              View all
            </Link>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {LANGUAGES.map((lang, index) => {
              const isAvailable = lang.phase === 1
              const prog = isAvailable ? getLevelProgress(lang.code, Object.keys(lang.data?.levels || {})[0] || 'a1') : { completed: 0 }
              const total = lang.data?.levels?.[Object.keys(lang.data?.levels || {})[0]]?.lessons?.length ?? 20
              const pct = Math.round((prog.completed / total) * 100)
              
              return (
                <motion.div
                  key={lang.code}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => isAvailable && setActiveLang(lang.code)}
                  className={`
                    flex-shrink-0 w-36 p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${activeLang === lang.code 
                      ? 'border-primary bg-primary/5 shadow-card' 
                      : 'border-border-light bg-surface hover:border-primary/30'
                    }
                    ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-${lang.color}/10 flex items-center justify-center`}>
                      <Icons.globe className={`w-5 h-5 text-${lang.color}`} />
                    </div>
                    {!isAvailable && (
                      <Badge variant="neutral" size="sm">Soon</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-text-primary mb-0.5">{lang.name}</h3>
                  <p className="text-xs text-text-muted mb-3">{lang.nativeName}</p>
                  {isAvailable && (
                    <>
                      <Progress value={pct} size="sm" className="mb-1" />
                      <p className="text-xs text-text-muted">{prog.completed}/{total} lessons</p>
                    </>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Continue Learning */}
        {continueLesson && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="text-lg font-semibold text-text-primary mb-4">Continue Learning</h2>
            <Card 
              hover
              className="overflow-hidden cursor-pointer"
              onClick={() => navigate(`/lesson/${activeLang}/${continueLesson.levelKey}/lesson_${continueLesson.index + 1}`)}
            >
              <div className="flex items-center gap-4 p-4">
                <div className={`w-14 h-14 rounded-2xl bg-${langMeta.color}/10 flex items-center justify-center flex-shrink-0`}>
                  <Icons.globe className={`w-7 h-7 text-${langMeta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={langMeta.color} size="sm">
                      {continueLesson.levelKey.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-text-muted">{langMeta.name}</span>
                  </div>
                  <h3 className="font-semibold text-text-primary truncate">
                    {continueLesson.title}
                  </h3>
                </div>
                <Button size="md" className="flex-shrink-0">
                  Continue
                  <Icons.arrowRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-secondary">Progress</span>
                  <span className="font-medium text-text-primary">{progressPct}%</span>
                </div>
                <Progress value={progressPct} size="md" />
              </div>
            </Card>
          </motion.section>
        )}

        {/* Level Path */}
        {levelKeys.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">
                {langMeta.name} Course
              </h2>
              <span className="text-sm text-text-muted">
                {levelKeys.length} levels
              </span>
            </div>
            
            <div className="space-y-3">
              {levelKeys.map((key, idx) => {
                const lvl = langMeta.data.levels[key]
                const prog = getLevelProgress(activeLang, key)
                const prevKey = levelKeys[idx - 1]
                const prevLessons = prevKey ? (langMeta.data.levels[prevKey]?.lessons?.length ?? 20) : 0
                const prevDone = idx === 0 || getLevelProgress(activeLang, prevKey).completed >= prevLessons
                const locked = !prevDone
                const total = lvl.lessons?.length ?? 20
                const pct = Math.round((prog.completed / total) * 100)
                const isActive = !locked && pct > 0 && pct < 100

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                  >
                    <Card 
                      hover={!locked}
                      onClick={() => !locked && navigate(`/lessons/${activeLang}/${key}`)}
                      className={`
                        relative overflow-hidden transition-all
                        ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        ${isActive ? 'ring-2 ring-primary/30 bg-primary/5' : ''}
                      `}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm
                          ${locked 
                            ? 'bg-text-muted/10 text-text-muted' 
                            : `bg-level-${key.replace('hsk', 'a').slice(0, 2) || 'a1'}/10 text-level-${key.replace('hsk', 'a').slice(0, 2) || 'a1'}`
                          }
                        `}>
                          {locked ? (
                            <Icons.lock className="w-5 h-5" />
                          ) : (
                            key.toUpperCase()
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary">
                            {lvl.title}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {locked 
                              ? `Complete previous level to unlock`
                              : `${prog.completed} of ${total} lessons completed`
                            }
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {!locked && (
                            <>
                              <span className="text-sm font-semibold text-text-primary">{pct}%</span>
                              <div className="w-16">
                                <Progress value={pct} size="sm" variant={pct === 100 ? 'success' : 'primary'} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                      )}
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.section>
        )}

        {/* Bottom spacing for mobile nav */}
        <div className="h-24 md:h-8" />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border-light z-50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          {[
            { path: '/', label: 'Home', icon: Icons.home, active: true },
            { path: '/lessons', label: 'Lessons', icon: Icons.book },
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
                    layoutId="mobile-nav-indicator"
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
