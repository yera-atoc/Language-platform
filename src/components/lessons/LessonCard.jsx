import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Progress from '../ui/Progress'
import { Icons } from '../ui/Icons'

const levelColors = {
  hsk1: 'a1',
  hsk2: 'a2',
  hsk3: 'b1',
  hsk4: 'b2',
  hsk5: 'c1',
  hsk6: 'c2',
  hsk7: 'c2',
  a1: 'a1',
  a2: 'a2',
  b1: 'b1',
}

export default function LessonCard({ 
  lesson,
  language,
  level,
  progress = 0,
  isLocked = false,
  isCompleted = false,
  index = 0,
}) {
  const levelColor = levelColors[level?.toLowerCase()] || 'primary'
  
  const cardContent = (
    <Card 
      hover={!isLocked}
      className={`
        relative overflow-hidden transition-all duration-300
        ${isLocked ? 'opacity-60' : ''}
        ${isCompleted ? 'ring-2 ring-success/30' : ''}
      `}
    >
      {/* Level indicator strip */}
      <div className={`absolute top-0 left-0 w-1 h-full bg-level-${levelColor}`} />
      
      <div className="pl-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={levelColor} size="sm">
                {level?.toUpperCase()}
              </Badge>
              {isCompleted && (
                <span className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Icons.check className="w-3 h-3 text-white" />
                </span>
              )}
            </div>
            <h3 className="font-semibold text-text-primary text-lg leading-tight">
              {lesson?.title || `Lesson ${index + 1}`}
            </h3>
          </div>
          
          {isLocked ? (
            <div className="w-10 h-10 rounded-xl bg-text-muted/10 flex items-center justify-center">
              <Icons.lock className="w-5 h-5 text-text-muted" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icons.play className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>

        {/* Description */}
        {lesson?.description && (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2">
            {lesson.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
          {lesson?.vocabulary?.length > 0 && (
            <span className="flex items-center gap-1">
              <Icons.book className="w-4 h-4" />
              {lesson.vocabulary.length} words
            </span>
          )}
          {lesson?.exercises?.length > 0 && (
            <span className="flex items-center gap-1">
              <Icons.lightning className="w-4 h-4" />
              {lesson.exercises.length} exercises
            </span>
          )}
        </div>

        {/* Progress */}
        {!isLocked && progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-secondary">Progress</span>
              <span className="font-medium text-text-primary">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} size="sm" variant={isCompleted ? 'success' : 'primary'} />
          </div>
        )}
      </div>
    </Card>
  )

  if (isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        {cardContent}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/lesson/${language}/${level}/lesson_${index + 1}`}>
        {cardContent}
      </Link>
    </motion.div>
  )
}
