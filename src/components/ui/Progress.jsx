import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  xp: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
  streak: 'bg-gradient-to-r from-orange-400 to-red-500',
}

const sizes = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
  xl: 'h-4',
}

export default function Progress({ 
  value = 0, 
  max = 100, 
  variant = 'primary',
  size = 'md',
  showLabel = false,
  animate = true,
  className = '',
  ...props 
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={`relative ${className}`} {...props}>
      <div className={`w-full bg-border-light rounded-full overflow-hidden ${sizes[size]}`}>
        {animate ? (
          <motion.div
            className={`h-full rounded-full ${variants[variant]}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        ) : (
          <div 
            className={`h-full rounded-full transition-all duration-500 ${variants[variant]}`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-6 text-sm font-medium text-text-secondary">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}
