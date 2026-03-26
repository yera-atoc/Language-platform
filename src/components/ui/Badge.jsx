const variants = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-text-secondary/10 text-text-secondary',
  // Level badges
  a1: 'bg-level-a1/10 text-level-a1',
  a2: 'bg-level-a2/10 text-level-a2',
  b1: 'bg-level-b1/10 text-level-b1',
  b2: 'bg-level-b2/10 text-level-b2',
  c1: 'bg-level-c1/10 text-level-c1',
  c2: 'bg-level-c2/10 text-level-c2',
  // Language badges
  chinese: 'bg-chinese/10 text-chinese',
  turkish: 'bg-turkish/10 text-turkish',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export default function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  className = '',
  ...props 
}) {
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 
        font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
