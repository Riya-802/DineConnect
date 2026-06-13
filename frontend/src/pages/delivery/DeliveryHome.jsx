import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Clock, CheckCircle } from 'lucide-react'
import api from '@/api/axiosClient'
import useAuth from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export default function DeliveryHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['delivery-orders-available'],
    queryFn: () => api.get('/orders/delivery').then(r => r.data.data || []),
    refetchInterval: 10000,
  })

  // Check if delivery partner already has an active order
  const activeOrder = orders.find(o => o.status === 'picked' && o.deliveryPartnerId === user?._id)

  const acceptOrder = useMutation({
    mutationFn: (id) => api.patch(`/orders/${id}/assign`),
    onSuccess: (res) => {
      toast.success('Order accepted!')
      navigate(`/delivery/active/${res.data.data.order._id}`)
    }
  })

  if (activeOrder) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <Navigation size={48} className="text-flame mb-4 animate-bounce" />
        <h2 className="font-display text-2xl font-bold mb-2">You have an active delivery</h2>
        <p className="text-clay mb-6">Complete your current delivery before accepting new ones.</p>
        <Link to={`/delivery/active/${activeOrder._id}`} className="btn-primary px-6 py-3">View Active Delivery</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      <div className="max-w-xl mx-auto px-4 md:px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1">Available Deliveries</h1>
            <p className="text-sm text-clay flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sage animate-pulse" /> Online & looking for orders</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="skeleton h-32 rounded-card" />)}
          </div>
        ) : orders.filter(o => o.status === 'ready').length === 0 ? (
          <div className="text-center py-20 bg-parchment rounded-card border-2 border-dashed border-clay/20">
            <Clock size={40} className="mx-auto text-clay/30 mb-3" />
            <p className="text-clay">No ready orders nearby.</p>
            <p className="text-xs text-clay/60 mt-1">We'll notify you when orders are ready for pickup.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.filter(o => o.status === 'ready').map((o, i) => (
              <motion.div key={o._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-parchment rounded-card p-5 shadow-warm border-l-4 border-l-flame">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold">{o.restaurantId?.name || 'Restaurant'}</h3>
                  <span className="font-mono font-bold text-ember bg-cream px-2 py-1 rounded text-sm">₹{o.totalAmount}</span>
                </div>
                
                <div className="space-y-3 mb-5 text-sm text-charcoal">
                  <div className="flex gap-3">
                    <div className="mt-1"><MapPin size={14} className="text-flame" /></div>
                    <div><p className="font-medium text-xs text-clay">Pickup</p><p>{o.restaurantId?.address?.street || 'Restaurant Address'}, {o.restaurantId?.address?.city}</p></div>
                  </div>
                  <div className="ml-1.5 border-l-2 border-dashed border-clay/20 h-4" />
                  <div className="flex gap-3">
                    <div className="mt-1"><MapPin size={14} className="text-sage" /></div>
                    <div><p className="font-medium text-xs text-clay">Drop</p><p>{o.deliveryAddress?.label || 'Customer Address'}</p></div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-clay/10 pt-4">
                  <p className="text-xs text-clay">{o.items?.length || 0} items</p>
                  <button onClick={() => acceptOrder.mutate(o._id)} disabled={acceptOrder.isPending}
                    className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2">
                    {acceptOrder.isPending ? 'Accepting...' : 'Accept Order'} <CheckCircle size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
