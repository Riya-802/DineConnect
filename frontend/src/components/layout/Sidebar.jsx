import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, CalendarCheck, UtensilsCrossed, Grid3X3, BarChart3, Settings, LogOut, ChefHat, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { logoutUser } from '@/store/slices/authSlice'
import useAuth from '@/hooks/useAuth'

const navItems = [
  { path: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/orders-live',   icon: ClipboardList,   label: 'Live Orders' },
  { path: '/bookings-live', icon: CalendarCheck,    label: 'Bookings' },
  { path: '/menu',          icon: UtensilsCrossed,  label: 'Menu' },
  { path: '/tables',        icon: Grid3X3,          label: 'Tables' },
  { path: '/analytics',     icon: BarChart3,        label: 'Analytics' },
  { path: '/settings',      icon: Settings,         label: 'Settings' },
]

export default function Sidebar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 md:hidden bg-parchment p-2 rounded-button shadow-warm">
        {collapsed ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`fixed top-0 left-0 h-full bg-parchment border-r border-clay/10 shadow-warm z-40
        transition-transform duration-300 flex flex-col
        ${collapsed ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        w-60`}>

        {/* Logo */}
        <div className="p-6 border-b border-clay/10">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-flame to-ember flex items-center justify-center">
              <ChefHat size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-ember leading-tight">DineConnect</h1>
              <span className="text-xs text-clay">Owner Panel</span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path
            return (
              <Link key={path} to={path}
                onClick={() => setCollapsed(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-flame to-ember text-white shadow-warm'
                    : 'text-charcoal hover:bg-cream/60 hover:text-ember'}`}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-clay/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-flame to-ember flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || 'O'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'Owner'}</p>
              <p className="text-xs text-clay truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => dispatch(logoutUser())}
            className="flex items-center gap-2 text-sm text-clay hover:text-flame transition-colors w-full px-2 py-1.5 rounded-input hover:bg-cream/60">
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {collapsed && <div className="fixed inset-0 bg-charcoal/40 z-30 md:hidden" onClick={() => setCollapsed(false)} />}
    </>
  )
}
