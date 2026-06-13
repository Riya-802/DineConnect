import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Phone, User, Mail, Lock, Store, Truck, ChefHat, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { registerUser, verifyOTP, completeProfile, clearError, clearOtp } from '@/store/slices/authSlice'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [role, setRole] = useState('customer')
  const [timer, setTimer] = useState(60)
  const otpRefs = useRef([])
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((s) => s.auth)

  useEffect(() => {
    if (step === 2 && timer > 0) {
      const t = setTimeout(() => setTimer(timer - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [step, timer])

  const handleStep1 = async (e) => {
    e.preventDefault()
    // Use a unique fake email so Mongoose unique index doesn't throw E11000 duplicate key error
    const result = await dispatch(registerUser({ phone, name: 'User', email: `temp_${phone}@dineconnect.local`, password: 'temp', role: 'customer' }))
    if (registerUser.fulfilled.match(result)) { setStep(2); setTimer(60) }
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const newOtp = [...otp]
    newOtp[i] = val
    setOtp(newOtp)
    if (val && i < 3) otpRefs.current[i + 1]?.focus()
  }

  const handleOtpKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length < 4) return
    const result = await dispatch(verifyOTP({ phone, otp: otpString }))
    if (verifyOTP.fulfilled.match(result)) setStep(3)
  }

  const handleStep3 = async (e) => {
    e.preventDefault()
    if (password !== confirmPass) return
    const result = await dispatch(completeProfile({ name, email, password, role }))
    if (completeProfile.fulfilled.match(result)) {
      navigate(role === 'owner' ? '/dashboard' : role === 'delivery' ? '/delivery/home' : '/home')
    }
  }

  const roles = [
    { value: 'customer', icon: User, label: 'Customer', desc: 'Order food & book tables' },
    { value: 'owner', icon: Store, label: 'Restaurant Owner', desc: 'Manage your restaurant' },
    { value: 'delivery', icon: Truck, label: 'Delivery Partner', desc: 'Deliver orders' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-hero-gradient px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-flame to-ember flex items-center justify-center">
            <ChefHat size={20} className="text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-charcoal">DineConnect</h1>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8 max-w-xs mx-auto">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step >= s ? 'bg-flame text-white' : 'bg-parchment text-clay'}`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-flame' : 'bg-clay/20'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-cream rounded-card shadow-warm-lg p-8">
          {error && <div className="bg-flame/10 text-ember text-sm px-4 py-3 rounded-input mb-4">{error}</div>}

          {/* Step 1: Phone */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold mb-1">Create Your Account</h2>
                <p className="text-clay text-sm">We'll send a verification code to your phone</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-clay mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm text-clay font-medium">+91</span>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={10}
                    placeholder="98765 43210" className="input-warm w-full pr-4 py-3 text-sm" style={{ paddingLeft: '4.5rem' }} />
                </div>
              </div>
              <button type="submit" disabled={isLoading || phone.length < 10}
                className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-5">
              <div className="text-center mb-6">
                <h2 className="font-display text-xl font-bold mb-1">Verify Your Phone</h2>
                <p className="text-clay text-sm">Enter the 4-digit code sent to +91 {phone}</p>
              </div>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input key={i} ref={(el) => (otpRefs.current[i] = el)}
                    type="text" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold input-warm rounded-button" />
                ))}
              </div>
              <p className="text-center text-xs text-clay">
                {timer > 0 ? `Resend in ${timer}s` : <button type="button" onClick={() => setTimer(60)} className="text-flame font-medium">Resend OTP</button>}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3 text-sm flex items-center justify-center gap-1">
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="submit" disabled={isLoading || otp.join('').length < 4}
                  className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Verify <ArrowRight size={16} /></>}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Profile */}
          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="font-display text-xl font-bold mb-1">Complete Your Profile</h2>
                <p className="text-clay text-sm">Almost there! Tell us about yourself.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-clay mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    placeholder="John Doe" className="input-warm w-full pr-4 py-3 text-sm" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-clay mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="you@example.com" className="input-warm w-full pr-4 py-3 text-sm" style={{ paddingLeft: '2.5rem' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-clay mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="••••••" className="input-warm w-full pr-4 py-2.5 text-sm" style={{ paddingLeft: '2.5rem' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-clay mb-1.5">Confirm</label>
                  <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required
                    placeholder="••••••" className="input-warm w-full px-4 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-clay mb-2">I am a...</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(({ value, icon: Icon, label }) => (
                    <button key={value} type="button" onClick={() => setRole(value)}
                      className={`p-3 rounded-button text-center border-2 transition-all ${role === value ? 'border-flame bg-flame/5' : 'border-clay/15 hover:border-clay/40'}`}>
                      <Icon size={20} className={`mx-auto mb-1 ${role === value ? 'text-flame' : 'text-clay'}`} />
                      <span className="text-xs font-medium block">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
                Create Account <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-clay mt-6">
          Already have an account? <Link to="/login" className="text-flame font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
