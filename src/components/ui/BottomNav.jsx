import { memo } from 'react'

const DEFAULT_ITEMS = [
  { id: 'home',     icon: '🏠', label: 'Главная'  },
  { id: 'lessons',  icon: '📖', label: 'Уроки'    },
  { id: 'progress', icon: '📊', label: 'Прогресс' },
  { id: 'ranking',  icon: '🏆', label: 'Рейтинг'  },
  { id: 'profile',  icon: '👤', label: 'Профиль'  },
]

function BottomNav({ active, onNavigate, items = DEFAULT_ITEMS }) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: 'rgba(8,9,15,0.92)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      padding: `10px 0 calc(12px + env(safe-area-inset-bottom))`,
      zIndex: 100,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      {items.map(item => {
        const isActive = active === item.id
        return (
          <div key={item.id} onClick={() => onNavigate?.(item.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, cursor: 'pointer',
              padding: '4px 0', userSelect: 'none',
              transition: 'opacity .15s',
            }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
              transition: 'all .2s',
            }}>
              <span style={{
                fontSize: 22,
                filter: isActive ? 'drop-shadow(0 0 6px rgba(139,132,255,0.7))' : 'none',
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                display: 'block', transition: 'all .2s',
              }}>
                {item.icon}
              </span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.5px',
              color: isActive ? '#8B84FF' : '#4A5070',
              transition: 'color .2s',
            }}>
              {item.label}
            </span>
          </div>
        )
      })}
    </nav>
  )
}

export default memo(BottomNav)
