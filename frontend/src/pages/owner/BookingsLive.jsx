import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, CalendarDays, Clock, Users, Coffee } from 'lucide-react'
import api from '@/api/axiosClient'
import toast from 'react-hot-toast'

export default function BookingsLive() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('pending')

  const { data: restaurant } = useQuery({ queryKey: ['owner-restaurant'], queryFn: () => api.get(`/restaurants?owner=me`).then(r => r.data.data?.[0] || null) })
  
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['owner-bookings', activeTab],
    queryFn: () => restaurant ? api.get(`/bookings/restaurant/${restaurant._id}?status=${activeTab}`).then(r => r.data.data || []) : [],
    enabled: !!restaurant,
    refetchInterval: 15000,
  })

  const confirmBooking = useMutation({
    mutationFn: (id) => api.patch(`/bookings/${id}/confirm`),
    onSuccess: () => { toast.success('Booking confirmed'); queryClient.invalidateQueries(['owner-bookings']) }
  })

  const seatCustomer = useMutation({
    mutationFn: (id) => api.patch(`/bookings/${id}/seat`),
    onSuccess: () => { toast.success('Customer seated'); queryClient.invalidateQueries(['owner-bookings']) }
  })

  const completeBooking = useMutation({
    mutationFn: (id) => api.patch(`/bookings/${id}/complete`),
    onSuccess: () => { toast.success('Booking completed'); queryClient.invalidateQueries(['owner-bookings']) }
  })

  if (isLoading) return <div className="p-8">Loading live bookings...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Live Bookings</h1>
          <p className="text-sm text-clay">Manage incoming reservations and pre-orders</p>
        </div>
      </div>

      <div className="flex gap-2 bg-parchment rounded-button p-1 mb-6 max-w-lg">
        {['pending', 'confirmed', 'seated'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-button capitalize transition-all ${activeTab === tab ? 'bg-cream shadow-warm-sm' : 'text-clay hover:text-charcoal'}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {bookings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-clay">No bookings in "{activeTab}" status right now.</div>
        ) : bookings.map(b => (
          <div key={b._id} className="bg-parchment rounded-card p-5 shadow-warm flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center text-sm font-bold text-ember">{b.customerId?.name?.charAt(0) || 'C'}</div>
                <div><h3 className="font-bold text-sm">{b.customerId?.name || 'Customer'}</h3><p className="text-xs text-clay">{b.customerId?.phone}</p></div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm text-charcoal">
                <div className="flex items-center gap-1.5"><CalendarDays size={14} className="text-clay" /> {b.date}</div>
                <div className="flex items-center gap-1.5"><Clock size={14} className="text-clay" /> {b.timeSlot}</div>
                <div className="flex items-center gap-1.5"><Users size={14} className="text-clay" /> {b.partySize} guests</div>
                <div className="flex items-center gap-1.5"><span className="font-bold text-ember">T{b.tableId?.tableNumber}</span></div>
              </div>

              {b.preOrderItems?.length > 0 && (
                <div className="bg-cream rounded-card p-3 mb-2">
                  <p className="text-xs font-bold text-ember mb-1 flex items-center gap-1"><Coffee size={12} /> Pre-order List</p>
                  <ul className="text-xs text-clay space-y-1">
                    {b.preOrderItems.map((item, idx) => <li key={idx}>{item.quantity} × {item.name}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 md:w-32 border-t md:border-t-0 border-clay/10 pt-4 md:pt-0">
              {b.status === 'pending' && <button onClick={() => confirmBooking.mutate(b._id)} className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1"><Check size={14} /> Confirm</button>}
              {b.status === 'confirmed' && <button onClick={() => seatCustomer.mutate(b._id)} className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1">Seat Guest</button>}
              {b.status === 'seated' && <button onClick={() => completeBooking.mutate(b._id)} className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1">Complete</button>}
              {b.status === 'pending' && <button className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1 text-red-500 hover:bg-red-500/10"><X size={14} /> Reject</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
