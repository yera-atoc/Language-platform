import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icons } from '../ui/Icons'
import Avatar from '../ui/Avatar'
import useUserStore from '@store/userStore'

const navItems = [
  { path: '/', label: 'Home', icon: Icons.home },
  { path: '/lessons', label: 'Lessons', icon: Icons.book },
  { path: '/progress', label: 'Progress', icon: Icons.chart },
  { path: '/profile', label: 'Profile', icon: Icons.user },
]

export default function Navigation() {
  const location = useLocation()
  const { user, xp, streak } = useUserStore()

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-lg border-b border-border-light z-50">
        <div className="container-app flex items-center justify-between w-full">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Icons.globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-text-primary">LangPlatform</span>
          </NavLink>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-primary/10 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </NavLink>
              )
            })}
          </div>

          {/* User Stats & Avatar */}
          <div className="flex items-center gap-4">
            {/* XP */}
            <div className="flex items-center gap-1.5 text-sm">
              <Icons.star className="w-5 h-5 text-xp" />
              <span className="font-semibold text-text-primary">{xp || 0}</span>
            </div>
            
            {/* Streak */}
            <div className="flex items-center gap-1.5 text-sm">
              <Icons.fire className="w-5 h-5 text-streak" />
              <span className="font-semibold text-text-primary">{streak || 0}</span>
            </div>

            {/* Avatar */}
            <NavLink to="/profile">
              <Avatar 
                src={user?.photoURL} 
                name={user?.displayName || user?.email} 
                size="sm"
              />
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border-light z-50 safe-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`
                  relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors
                  ${isActive ? 'text-primary' : 'text-text-secondary'}
                `}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-2 w-12 h-1 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Spacers */}
      <div className="hidden md:block h-16" /> {/* Desktop top spacer */}
      <div className="md:hidden h-20" /> {/* Mobile bottom spacer - rendered at page bottom */}
    </>
  )
}
