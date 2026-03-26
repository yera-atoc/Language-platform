import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Card from '../ui/Card'
import Progress from '../ui/Progress'
import { Icons } from '../ui/Icons'

const languageData = {
  chinese: {
    name: 'Chinese',
    nativeName: 'Chinese',
    flag: 'cn',
    color: 'chinese',
    levels: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'HSK7'],
  },
  turkish: {
    name: 'Turkish',
    nativeName: 'Turkce',
    flag: 'tr',
    color: 'turkish',
    levels: ['A1', 'A2', 'B1'],
  },
}

export default function LanguageCard({ 
  language, 
  progress = 0, 
  lessonsCompleted = 0,
  totalLessons = 0,
  index = 0 
}) {
  const data = languageData[language] || { name: language, levels: [] }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/lessons/${language}`}>
        <Card hover className="relative overflow-hidden group">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br from-${data.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          
          <div className="relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              {/* Flag placeholder - using colored circle */}
              <div className={`w-14 h-14 rounded-2xl bg-${data.color}/10 flex items-center justify-center`}>
                <Icons.globe className={`w-7 h-7 text-${data.color}`} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-display font-bold text-xl text-text-primary">
                  {data.name}
                </h3>
                <p className="text-sm text-text-secondary">
                  {data.nativeName}
                </p>
              </div>

              <Icons.arrowRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>

            {/* Levels preview */}
            <div className="flex flex-wrap gap-2 mb-4">
              {data.levels.slice(0, 4).map((level) => (
                <span 
                  key={level}
                  className="px-2 py-1 text-xs font-medium rounded-lg bg-surface border border-border-light text-text-secondary"
                >
                  {level}
                </span>
              ))}
              {data.levels.length > 4 && (
                <span className="px-2 py-1 text-xs font-medium rounded-lg bg-surface border border-border-light text-text-muted">
                  +{data.levels.length - 4} more
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
              <span>{lessonsCompleted} / {totalLessons} lessons</span>
            </div>

            {/* Progress */}
            <Progress value={progress} size="sm" />
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
