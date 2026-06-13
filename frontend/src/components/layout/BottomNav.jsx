import { Link, useLocation } from 'react-router-dom'
import { Home, Search, ClipboardList, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { path: '/home',     icon: Home,          label: 'Home' },
  { path: '/restaurants', icon: Search,     label: 'Discover' },
  { path: '/orders',  icon: ClipboardList,  label: 'Orders' },
  { path: '/profile', icon: User,           label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-cream border-t border-clay/10 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.startsWith(path)
          return (
            <Link key={path} to={path} className="flex flex-col items-center gap-0.5 py-1 px-3">
              <motion.div whileTap={{ scale: 0.9 }} className="relative">
                <Icon size={22} className={isActive ? 'text-flame' : 'text-clay'} strokeWidth={isActive ? 2.5 : 1.8} />
                {isActive && (
                  <motion.div layoutId="bottomDot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-flame rounded-full" />
                )}
              </motion.div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-flame' : 'text-clay'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
