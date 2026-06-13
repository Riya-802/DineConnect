import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, Clock, MapPin, Truck, RefreshCw, MessageSquare } from 'lucide-react'
import api from '@/api/axiosClient'

export default function OrdersHistoryPage() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', 'history'],
    queryFn: () => api.get('/orders/user').then(r => r.data.data),
  })

  const orders = ordersData?.orders || []

  if (isLoading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-parchment border-t-flame rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-clay/30 mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No orders yet</h3>
            <p className="text-clay text-sm mb-6">Order some delicious food to your doorstep.</p>
            <Link to="/home" className="btn-primary px-6 py-2.5 text-sm">Order Now</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o, i) => (
              <motion.div key={o._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-parchment rounded-card p-5 shadow-warm-sm flex flex-col md:flex-row gap-4">
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display text-lg font-bold">{o.restaurantId?.name || 'Restaurant'}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      o.status === 'delivered' ? 'bg-sage/10 text-sage' : 
                      o.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 
                      'bg-flame/10 text-ember'
                    }`}>{o.status}</span>
                  </div>
                  
                  <p className="text-xs text-clay mb-3">Order #{o._id.slice(-8)} • {new Date(o.createdAt).toLocaleString()}</p>
                  
                  <p className="text-sm text-charcoal mb-3 line-clamp-2">
                    {o.items?.map(item => `${item.quantity} × ${item.name}`).join(', ')}
                  </p>

                  <div className="flex items-center gap-4 text-sm font-medium">
                    <span className="text-ember">₹{o.totalAmount}</span>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 md:w-32 border-t md:border-t-0 border-clay/10 pt-3 md:pt-0 mt-3 md:mt-0">
                  {['placed', 'accepted', 'preparing', 'ready', 'picked'].includes(o.status) ? (
                    <Link to={`/track/${o._id}`} className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1"><Truck size={14} /> Track Order</Link>
                  ) : (
                    <>
                      <button className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1"><RefreshCw size={14} /> Reorder</button>
                      {o.status === 'delivered' && !o.isReviewed && (
                        <button className="text-xs text-flame font-medium hover:underline flex items-center justify-center gap-1 mt-1"><MessageSquare size={14} /> Review</button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
