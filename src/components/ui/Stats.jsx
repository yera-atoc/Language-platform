import { motion } from 'framer-motion'
import Card from './Card'

export function StatCard({ 
  icon, 
  value, 
  label, 
  trend,
  trendUp = true,
  animate = true,
  className = '',
  ...props 
}) {
  const Wrapper = animate ? motion.div : 'div'
  const wrapperProps = animate ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  } : {}

  return (
    <Wrapper {...wrapperProps}>
      <Card className={`flex flex-col items-center text-center ${className}`} {...props}>
        {icon && (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <span className="text-primary">{icon}</span>
          </div>
        )}
        <span className="text-3xl font-bold text-text-primary">{value}</span>
        <span className="text-sm text-text-secondary mt-1">{label}</span>
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trendUp ? 'text-success' : 'text-error'}`}>
            {trendUp ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            )}
            {trend}
          </div>
        )}
      </Card>
    </Wrapper>
  )
}

export function StatsRow({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  )
}

// XP specific stat
export function XPStat({ value, level, nextLevelXP, className = '' }) {
  const progress = nextLevelXP > 0 ? (value / nextLevelXP) * 100 : 0

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-xp/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-xp" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-text-primary">{value} XP</span>
            <span className="text-xs text-text-muted">Level {level}</span>
          </div>
          <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

// Streak specific stat
export function StreakStat({ days, isActive = true, className = '' }) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-streak/20' : 'bg-text-muted/10'}`}>
          <svg className={`w-5 h-5 ${isActive ? 'text-streak' : 'text-text-muted'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <span className="text-2xl font-bold text-text-primary">{days}</span>
          <span className="text-sm text-text-secondary ml-1">days streak</span>
        </div>
      </div>
    </Card>
  )
}
