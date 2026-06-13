import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MapPin, Phone, Clock, Check, Package, Truck, ChefHat } from 'lucide-react'
import api from '@/api/axiosClient'

const STATUSES = [
  { key: 'placed',    label: 'Order Placed',    icon: Package },
  { key: 'accepted',  label: 'Accepted',        icon: Check },
  { key: 'preparing', label: 'Preparing',        icon: ChefHat },
  { key: 'ready',     label: 'Ready',            icon: Package },
  { key: 'picked',    label: 'On The Way',       icon: Truck },
  { key: 'delivered', label: 'Delivered',         icon: MapPin },
]

export default function TrackOrderPage() {
  const { id } = useParams()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data.data),
    refetchInterval: 10000, // poll every 10s
  })

  if (isLoading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-parchment border-t-flame rounded-full animate-spin" />
    </div>
  )

  const o = order || {}
  const currentIdx = STATUSES.findIndex(s => s.key === o.status) || 0

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-2">Track Order</h1>
        <p className="text-sm text-clay mb-8">Order #{o._id?.slice(-8)}</p>

        {/* Animated map placeholder */}
        <div className="relative h-48 bg-gradient-to-br from-parchment to-cream rounded-card shadow-warm mb-8 overflow-hidden flex items-center justify-center">
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Truck size={48} className="text-flame" />
          </motion.div>
          <p className="absolute bottom-3 left-3 text-xs text-clay bg-cream/80 px-2 py-1 rounded-full">Live tracking via Socket.io</p>
        </div>

        {/* Status timeline */}
        <div className="bg-parchment rounded-card p-6 shadow-warm mb-6">
          <h3 className="font-medium text-sm mb-5">Order Status</h3>
          <div className="space-y-0">
            {STATUSES.map(({ key, label, icon: Icon }, i) => {
              const isCompleted = i <= currentIdx
              const isCurrent = i === currentIdx
              return (
                <div key={key} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-sage text-white' : 'bg-cream border-2 border-clay/20 text-clay'} ${isCurrent ? 'ring-2 ring-flame ring-offset-2' : ''}`}>
                      <Icon size={14} />
                    </div>
                    {i < STATUSES.length - 1 && <div className={`w-0.5 h-8 ${isCompleted ? 'bg-sage' : 'bg-clay/15'}`} />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-charcoal' : 'text-clay'}`}>{label}</p>
                    {o.timeline?.find(t => t.status === key) && (
                      <p className="text-[10px] text-clay">{new Date(o.timeline.find(t => t.status === key).timestamp).toLocaleTimeString()}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* OTP */}
        {o.otp && o.status !== 'delivered' && (
          <div className="bg-flame/5 border border-flame/20 rounded-card p-4 text-center mb-6">
            <p className="text-xs text-clay mb-1">Share this OTP with delivery partner</p>
            <p className="font-mono text-3xl font-bold text-flame tracking-widest">{o.otp}</p>
          </div>
        )}

        {/* Order items */}
        <div className="bg-parchment rounded-card p-5 shadow-warm">
          <h3 className="text-sm font-medium mb-3">Order Items</h3>
          <div className="space-y-2 text-sm">
            {o.items?.map((item, i) => (
              <div key={i} className="flex justify-between"><span className="text-clay">{item.name} × {item.quantity}</span><span>₹{item.price * item.quantity}</span></div>
            ))}
            <div className="flex justify-between pt-2 border-t border-clay/10 font-bold"><span>Total</span><span className="text-ember">₹{o.totalAmount}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
