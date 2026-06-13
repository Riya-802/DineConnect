import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, ChefHat, Package, Truck, Phone } from 'lucide-react'
import api from '@/api/axiosClient'
import toast from 'react-hot-toast'
import useAuth from '@/hooks/useAuth'

export default function OrdersLive() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('placed')

  const { data: restaurant } = useQuery({ queryKey: ['owner-restaurant'], queryFn: () => api.get(`/restaurants?owner=me`).then(r => r.data.data?.[0] || null) })
  
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['owner-orders', activeTab],
    queryFn: () => restaurant ? api.get(`/orders/restaurant/${restaurant._id}?status=${activeTab}`).then(r => r.data.data || []) : [],
    enabled: !!restaurant,
    refetchInterval: 10000,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Order status updated')
      queryClient.invalidateQueries(['owner-orders'])
    }
  })

  const acceptOrder = useMutation({
    mutationFn: (id) => api.patch(`/orders/${id}/accept`),
    onSuccess: () => {
      toast.success('Order accepted')
      queryClient.invalidateQueries(['owner-orders'])
    }
  })

  if (isLoading) return <div className="p-8">Loading live orders...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Live Orders</h1>
          <p className="text-sm text-clay">Manage incoming delivery orders</p>
        </div>
      </div>

      <div className="flex gap-2 bg-parchment rounded-button p-1 mb-6 max-w-lg">
        {['placed', 'accepted', 'preparing', 'ready'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-button capitalize transition-all ${activeTab === tab ? 'bg-cream shadow-warm-sm' : 'text-clay hover:text-charcoal'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {orders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-clay">No orders in "{activeTab}" status right now.</div>
        ) : orders.map(o => (
          <div key={o._id} className="bg-parchment rounded-card p-5 shadow-warm flex flex-col">
            <div className="flex justify-between items-start mb-3 border-b border-clay/10 pb-3">
              <div>
                <h3 className="font-bold">Order #{o._id.slice(-6)}</h3>
                <p className="text-xs text-clay">{new Date(o.createdAt).toLocaleTimeString()}</p>
              </div>
              <span className="font-mono font-bold text-ember bg-cream px-2 py-1 rounded">₹{o.totalAmount}</span>
            </div>

            <div className="flex-1 mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                <div className="w-6 h-6 rounded-full bg-cream flex items-center justify-center text-xs">{o.customerId?.name?.charAt(0) || 'C'}</div>
                {o.customerId?.name || 'Customer'}
                <button className="ml-auto text-clay hover:text-charcoal"><Phone size={14} /></button>
              </div>
              <ul className="text-sm space-y-1">
                {o.items?.map((item, i) => (
                  <li key={i} className="flex justify-between"><span className="text-clay">{item.quantity} × {item.name}</span></li>
                ))}
              </ul>
            </div>

            <div className="mt-auto pt-4 border-t border-clay/10 flex gap-2">
              {o.status === 'placed' && (
                <button onClick={() => acceptOrder.mutate(o._id)} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1"><Check size={14} /> Accept</button>
              )}
              {o.status === 'accepted' && (
                <button onClick={() => updateStatus.mutate({ id: o._id, status: 'preparing' })} className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-1"><ChefHat size={14} /> Start Cooking</button>
              )}
              {o.status === 'preparing' && (
                <button onClick={() => updateStatus.mutate({ id: o._id, status: 'ready' })} className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-1"><Package size={14} /> Mark Ready</button>
              )}
              {o.status === 'ready' && (
                <button disabled className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-1 opacity-50 cursor-not-allowed"><Truck size={14} /> Waiting for Pickup</button>
              )}
              {o.status === 'placed' && (
                <button onClick={() => updateStatus.mutate({ id: o._id, status: 'cancelled' })} className="btn-secondary w-10 py-2 flex items-center justify-center text-red-500 border-red-500/20 hover:bg-red-500/10"><X size={14} /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
