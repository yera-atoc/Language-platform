import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const Card = forwardRef(({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'md',
  hover = false,
  animate = false,
  onClick,
  ...props 
}, ref) => {
  const variants = {
    default: 'bg-surface border border-border-light shadow-card',
    elevated: 'bg-surface shadow-elevated',
    outline: 'bg-transparent border-2 border-border',
    ghost: 'bg-transparent',
  }

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const hoverClasses = hover 
    ? 'transition-all duration-200 hover:shadow-elevated hover:border-primary/20 hover:-translate-y-0.5 cursor-pointer' 
    : ''

  const baseClasses = `
    rounded-2xl
    ${variants[variant]}
    ${paddings[padding]}
    ${hoverClasses}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  if (animate) {
    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={hover ? { y: -4 } : {}}
        transition={{ duration: 0.3 }}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div ref={ref} className={baseClasses} onClick={onClick} {...props}>
      {children}
    </div>
  )
})

Card.displayName = 'Card'

export default Card
