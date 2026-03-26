import { motion } from 'framer-motion'
import Card from '../ui/Card'
import { Icons } from '../ui/Icons'

const optionVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
  correct: { 
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 }
  },
  incorrect: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
}

export default function ExerciseOption({
  label,
  value,
  selected = false,
  correct = null, // null = not checked, true = correct, false = incorrect
  disabled = false,
  showLetter = true,
  letter = 'A',
  onClick,
}) {
  const getStateClasses = () => {
    if (correct === true) {
      return 'border-success bg-success/5 shadow-success'
    }
    if (correct === false) {
      return 'border-error bg-error/5 shadow-error'
    }
    if (selected) {
      return 'border-primary bg-primary/5 shadow-card'
    }
    return 'border-border-light hover:border-primary'
  }

  const getAnimationState = () => {
    if (correct === true) return 'correct'
    if (correct === false) return 'incorrect'
    return 'initial'
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      variants={optionVariants}
      initial="initial"
      animate={getAnimationState()}
      whileHover={disabled ? {} : 'hover'}
      whileTap={disabled ? {} : 'tap'}
      className={`
        w-full p-4 rounded-xl border-2 text-left
        flex items-center gap-4
        transition-colors duration-200
        disabled:cursor-not-allowed
        ${getStateClasses()}
      `}
    >
      {/* Letter indicator */}
      {showLetter && (
        <span className={`
          w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm
          ${correct === true ? 'bg-success text-white' : ''}
          ${correct === false ? 'bg-error text-white' : ''}
          ${correct === null && selected ? 'bg-primary text-white' : ''}
          ${correct === null && !selected ? 'bg-surface border border-border text-text-secondary' : ''}
        `}>
          {correct === true ? (
            <Icons.check className="w-4 h-4" />
          ) : correct === false ? (
            <Icons.x className="w-4 h-4" />
          ) : (
            letter
          )}
        </span>
      )}

      {/* Content */}
      <span className={`
        flex-1 font-medium
        ${correct === true ? 'text-success' : ''}
        ${correct === false ? 'text-error' : ''}
        ${correct === null ? 'text-text-primary' : ''}
      `}>
        {label}
      </span>
    </motion.button>
  )
}

export function ExerciseContainer({ 
  children, 
  title,
  subtitle,
  progress,
  maxProgress,
}) {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header with progress */}
      {(title || progress !== undefined) && (
        <div className="mb-6">
          {progress !== undefined && maxProgress && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-text-secondary">Question {progress} of {maxProgress}</span>
                <span className="font-medium text-text-primary">{Math.round((progress / maxProgress) * 100)}%</span>
              </div>
              <div className="h-2 bg-border-light rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress / maxProgress) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
          {title && (
            <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          )}
          {subtitle && (
            <p className="text-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  )
}

export function ExerciseQuestion({ 
  question,
  hint,
  audio,
  character, // For Chinese characters
}) {
  return (
    <Card className="mb-6 text-center" padding="lg">
      {character && (
        <div className="text-6xl font-bold text-text-primary mb-4">
          {character}
        </div>
      )}
      <p className="text-xl text-text-primary font-medium mb-2">
        {question}
      </p>
      {hint && (
        <p className="text-sm text-text-secondary">{hint}</p>
      )}
      {audio && (
        <button className="mt-4 p-3 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          <Icons.volume className="w-6 h-6" />
        </button>
      )}
    </Card>
  )
}

export function ExerciseFeedback({ 
  correct,
  message,
  explanation,
  onContinue,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-6 rounded-2xl mt-6
        ${correct ? 'bg-success/10 border border-success/20' : 'bg-error/10 border border-error/20'}
      `}
    >
      <div className="flex items-start gap-4">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${correct ? 'bg-success' : 'bg-error'}
        `}>
          {correct ? (
            <Icons.check className="w-5 h-5 text-white" />
          ) : (
            <Icons.x className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${correct ? 'text-success' : 'text-error'}`}>
            {correct ? 'Correct!' : 'Not quite'}
          </h3>
          {message && (
            <p className="text-text-secondary mt-1">{message}</p>
          )}
          {explanation && (
            <p className="text-sm text-text-muted mt-2">{explanation}</p>
          )}
        </div>
      </div>
      {onContinue && (
        <motion.button
          onClick={onContinue}
          className={`
            w-full mt-4 py-3 rounded-xl font-semibold text-white
            ${correct ? 'bg-success hover:bg-success-dark' : 'bg-error hover:bg-error-dark'}
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      )}
    </motion.div>
  )
}
