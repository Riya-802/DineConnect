import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, Navigation, Phone, CheckCircle, Package } from 'lucide-react'
import api from '@/api/axiosClient'
import toast from 'react-hot-toast'

export default function ActiveDelivery() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [otp, setOtp] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: ['delivery-order', id],
    queryFn: () => api.get(`/orders/${id}`).then(r => r.data.data),
    refetchInterval: 5000,
  })

  const verifyOtp = useMutation({
    mutationFn: () => api.post(`/orders/${id}/verify-otp`, { otp }),
    onSuccess: () => {
      toast.success('Order delivered successfully! 🎉')
      queryClient.invalidateQueries(['delivery-orders-available'])
      navigate('/delivery/home')
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Invalid OTP')
  })

  if (isLoading) return <div className="p-8 text-center">Loading delivery details...</div>
  if (!order) return <div className="p-8 text-center">Order not found</div>

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Map Placeholder */}
      <div className="h-64 bg-slate-200 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-parchment to-cream flex items-center justify-center opacity-80" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-clay">
          <Navigation size={40} className="mb-2 text-flame drop-shadow-md" />
          <span className="text-sm font-medium">Map Navigation (Mock)</span>
        </div>
      </div>

      <div className="flex-1 max-w-xl w-full mx-auto p-4 md:p-6 -mt-6 relative z-10">
        <div className="bg-parchment rounded-card p-5 shadow-warm mb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">Active Delivery</h2>
            <span className="badge badge-sage px-2 py-1">On the way</span>
          </div>

          <div className="space-y-4 mb-5">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-flame/10 flex items-center justify-center text-flame shrink-0"><MapPin size={18} /></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-clay uppercase tracking-wider mb-0.5">Pickup From</p>
                <p className="font-medium text-charcoal">{order.restaurantId?.name}</p>
                <p className="text-sm text-clay mb-2">{order.restaurantId?.address?.street}</p>
                <a href={`tel:${order.restaurantId?.phone || ''}`} className="inline-flex items-center gap-1 text-xs font-medium text-flame bg-flame/5 px-3 py-1.5 rounded-full"><Phone size={12} /> Call Restaurant</a>
              </div>
            </div>

            <div className="flex gap-4 items-start pt-4 border-t border-clay/10">
              <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center text-sage shrink-0"><MapPin size={18} /></div>
              <div className="flex-1">
                <p className="text-xs font-bold text-clay uppercase tracking-wider mb-0.5">Deliver To</p>
                <p className="font-medium text-charcoal">{order.customerId?.name}</p>
                <p className="text-sm text-clay mb-2">{order.deliveryAddress?.label}</p>
                <a href={`tel:${order.customerId?.phone || ''}`} className="inline-flex items-center gap-1 text-xs font-medium text-flame bg-flame/5 px-3 py-1.5 rounded-full"><Phone size={12} /> Call Customer</a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-parchment rounded-card p-5 shadow-warm mb-4">
          <div className="flex items-center gap-2 mb-3"><Package size={16} className="text-clay" /><h3 className="font-medium text-sm">Order Items</h3></div>
          <ul className="text-sm text-charcoal space-y-1">
            {order.items?.map((item, i) => <li key={i}>{item.quantity} × {item.name}</li>)}
          </ul>
        </div>

        <div className="bg-parchment rounded-card p-5 shadow-warm">
          <h3 className="font-medium text-sm mb-3 text-center">Complete Delivery</h3>
          <p className="text-xs text-clay text-center mb-4">Enter the 4-digit OTP from the customer to complete this delivery.</p>
          <div className="flex gap-2">
            <input type="text" placeholder="Enter OTP" maxLength={4} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="input-warm flex-1 text-center font-mono text-lg tracking-widest font-bold" />
            <button onClick={() => verifyOtp.mutate()} disabled={otp.length !== 4 || verifyOtp.isPending}
              className="btn-primary px-6 flex items-center gap-2">
              Verify <CheckCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
