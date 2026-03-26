const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
}

export default function Avatar({ 
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  className = '',
  ...props 
}) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const colors = [
    'bg-primary',
    'bg-success',
    'bg-warning',
    'bg-error',
    'bg-level-c2',
  ]

  // Generate consistent color from name
  const colorIndex = name 
    ? name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`
          rounded-full object-cover
          ${sizes[size]}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      />
    )
  }

  return (
    <div
      className={`
        rounded-full flex items-center justify-center font-semibold text-white
        ${sizes[size]}
        ${colors[colorIndex]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {initials}
    </div>
  )
}
