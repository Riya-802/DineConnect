import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { User, MapPin, Phone, Mail, Settings, LogOut, ChevronRight, CreditCard } from 'lucide-react'
import { logoutUser } from '@/store/slices/authSlice'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { user } = useSelector((s) => s.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-6">My Profile</h1>

        <div className="bg-parchment rounded-card p-6 shadow-warm-sm mb-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-flame to-ember flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">{user?.name}</h2>
            <p className="text-clay text-sm mb-1 flex items-center gap-1.5"><Mail size={14} /> {user?.email}</p>
            <p className="text-clay text-sm flex items-center gap-1.5"><Phone size={14} /> {user?.phone}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold mb-3">Account Settings</h3>
          
          {[
            { icon: MapPin, label: 'Manage Addresses', desc: 'Add or edit delivery locations' },
            { icon: CreditCard, label: 'Payment Methods', desc: 'Manage saved cards & UPI' },
            { icon: User, label: 'Edit Profile', desc: 'Update name, email or phone' },
            { icon: Settings, label: 'Preferences', desc: 'Notifications & app settings' },
          ].map(({ icon: Icon, label, desc }, i) => (
            <motion.button key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="w-full bg-parchment rounded-card p-4 flex items-center gap-4 hover:shadow-warm transition-shadow text-left">
              <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center shrink-0">
                <Icon size={18} className="text-clay" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-clay">{desc}</p>
              </div>
              <ChevronRight size={18} className="text-clay/50" />
            </motion.button>
          ))}
        </div>

        <button onClick={handleLogout} className="mt-8 w-full btn-secondary py-3.5 text-sm flex items-center justify-center gap-2 border-red-500/20 text-red-500 hover:bg-red-500/5">
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  )
}
