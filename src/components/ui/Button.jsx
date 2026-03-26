import { forwardRef } from 'react'
import { motion } from 'framer-motion'

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-button hover:shadow-button-hover',
  secondary: 'bg-surface text-text-primary border border-border hover:border-primary hover:text-primary',
  ghost: 'text-text-secondary hover:bg-surface hover:text-text-primary',
  success: 'bg-success text-white hover:bg-success-dark shadow-success',
  error: 'bg-error text-white hover:bg-error-dark shadow-error',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
  icon: 'p-3',
}

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  rounded = 'xl',
  as = 'button',
  animate = true,
  ...props 
}, ref) => {
  const Component = animate ? motion.button : as

  const baseClasses = `
    inline-flex items-center justify-center gap-2 
    font-semibold rounded-${rounded}
    transition-all duration-200 
    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  const motionProps = animate ? {
    whileHover: disabled ? {} : { scale: 1.02 },
    whileTap: disabled ? {} : { scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 17 }
  } : {}

  return (
    <Component
      ref={ref}
      className={baseClasses}
      disabled={disabled || loading}
      {...motionProps}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
        </>
      )}
    </Component>
  )
})

Button.displayName = 'Button'

export default Button
