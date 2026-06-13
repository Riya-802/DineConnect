import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, IndianRupee, MapPin } from 'lucide-react'
import api from '@/api/axiosClient'
import useAuth from '@/hooks/useAuth'

export default function DeliveryHistory() {
  const { user } = useAuth()
  
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['delivery-history'],
    // Normally this would be a specific endpoint for delivery history, using standard orders endpoint for now
    queryFn: () => api.get('/orders/delivery').then(r => (r.data.data || []).filter(o => o.status === 'delivered')),
  })

  if (isLoading) return <div className="p-8 text-center">Loading history...</div>

  // Mock earnings calculation (₹40 flat rate per delivery)
  const totalDeliveries = orders.length
  const totalEarnings = totalDeliveries * 40

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      <div className="max-w-xl mx-auto px-4 md:px-6 py-6">
        <h1 className="font-display text-2xl font-bold mb-6">Delivery History</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-flame to-ember rounded-card p-4 text-white shadow-warm-sm">
            <p className="text-white/80 text-xs font-medium mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Total Deliveries</p>
            <p className="font-display text-2xl font-bold">{totalDeliveries}</p>
          </div>
          <div className="bg-parchment border border-clay/10 rounded-card p-4 shadow-warm-sm">
            <p className="text-clay text-xs font-medium mb-1 flex items-center gap-1"><IndianRupee size={12} /> Total Earnings</p>
            <p className="font-display text-2xl font-bold text-charcoal">₹{totalEarnings}</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-clay text-sm">You haven't completed any deliveries yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o._id} className="bg-parchment rounded-card p-4 shadow-warm-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center shrink-0 text-sage"><CheckCircle2 size={20} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{o.restaurantId?.name || 'Restaurant'}</p>
                  <p className="text-xs text-clay flex items-center gap-1 mt-0.5"><MapPin size={10} /> to {o.deliveryAddress?.label?.split(',')[0] || 'Customer'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-ember">+₹40</p>
                  <p className="text-[10px] text-clay mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
