import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Mail, Lock, Phone, Eye, EyeOff, ChefHat, ArrowRight, Loader2 } from 'lucide-react'
import { loginUser } from '@/store/slices/authSlice'

export default function LoginPage() {
  const [mode, setMode] = useState('email') // 'email' | 'phone'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((s) => s.auth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = mode === 'email' ? { email, password } : { phone }
    const result = await dispatch(loginUser(payload))
    if (loginUser.fulfilled.match(result)) {
      const role = result.payload.user?.role
      navigate(role === 'owner' ? '/dashboard' : role === 'delivery' ? '/delivery/home' : '/home')
    }
  }

  return (
    <div className="min-h-screen flex bg-cream">
      {/* Left — illustration (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-parchment to-cream items-center justify-center relative overflow-hidden">
        <div className="max-w-md text-center px-12 relative z-10">
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-flame to-ember flex items-center justify-center">
            <ChefHat size={40} className="text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-charcoal mb-4">Welcome back to the table</h2>
          <p className="text-clay leading-relaxed">
            "The best meals are the ones shared with family. DineConnect made our weekly family dinners effortless."
          </p>
          <p className="text-sm text-ember font-medium mt-4">— The Sharma Family</p>
        </div>
        <div className="absolute top-20 right-10 w-40 h-40 bg-flame/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-sage/5 rounded-full blur-3xl" />
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-flame to-ember flex items-center justify-center">
              <ChefHat size={20} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-charcoal">DineConnect</h1>
          </div>

          <h2 className="font-display text-2xl font-bold mb-2">Sign in</h2>
          <p className="text-clay mb-8">Welcome back! Let's get you to your table.</p>

          {/* Tab switcher */}
          <div className="flex bg-parchment rounded-button p-1 mb-6">
            {[['email', 'Email & Password'], ['phone', 'Phone OTP']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-button transition-all ${mode === m ? 'bg-cream shadow-warm-sm text-charcoal' : 'text-clay'}`}>
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-flame/10 text-ember text-sm px-4 py-3 rounded-input mb-4">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'email' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-clay mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      placeholder="you@example.com"
                      className="input-warm w-full pr-4 py-3 text-sm" style={{ paddingLeft: '2.5rem' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-sm font-medium text-clay">Password</label>
                    <Link to="/forgot-password" className="text-xs text-flame hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="input-warm w-full pr-12 py-3 text-sm" style={{ paddingLeft: '2.5rem' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-clay hover:text-charcoal">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-clay mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-clay font-medium">+91</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required
                    placeholder="98765 43210" maxLength={10}
                    className="input-warm w-full pr-4 py-3 text-sm" style={{ paddingLeft: '4.5rem' }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <><span>{mode === 'phone' ? 'Send OTP' : 'Sign In'}</span> <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-clay mt-6">
            Don't have an account? <Link to="/register" className="text-flame font-medium hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
