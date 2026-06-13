import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, MapPin, Check, X, Users, MessageSquare } from 'lucide-react'
import api from '@/api/axiosClient'

export default function BookingsHistoryPage() {
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', 'history'],
    queryFn: () => api.get('/bookings/user').then(r => r.data.data),
  })

  const bookings = bookingsData?.bookings || []

  if (isLoading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-parchment border-t-flame rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-display text-2xl font-bold mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays size={48} className="mx-auto text-clay/30 mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No bookings yet</h3>
            <p className="text-clay text-sm mb-6">Book a table to enjoy a dine-in experience.</p>
            <Link to="/restaurants" className="btn-primary px-6 py-2.5 text-sm">Find Restaurants</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b, i) => (
              <motion.div key={b._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-parchment rounded-card p-5 shadow-warm-sm flex flex-col md:flex-row gap-4">
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display text-lg font-bold">{b.restaurantId?.name || 'Restaurant'}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                      b.status === 'completed' ? 'bg-sage/10 text-sage' : 
                      b.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 
                      'bg-flame/10 text-ember'
                    }`}>{b.status}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-2 mb-4 text-sm text-clay">
                    <div className="flex items-center gap-1.5"><CalendarDays size={14} /> {b.date}</div>
                    <div className="flex items-center gap-1.5"><Clock size={14} /> {b.timeSlot}</div>
                    <div className="flex items-center gap-1.5"><Users size={14} /> {b.partySize} guests</div>
                    <div className="flex items-center gap-1.5"><MapPin size={14} /> {b.tableId?.tableNumber ? `Table ${b.tableId.tableNumber}` : 'Pending Table'}</div>
                  </div>

                  {b.preOrderItems?.length > 0 && (
                    <div className="bg-cream p-3 rounded-button text-xs mb-3">
                      <p className="font-medium text-ember mb-1.5">Pre-Order Items:</p>
                      <ul className="list-disc list-inside text-clay">
                        {b.preOrderItems.map((item, idx) => (
                          <li key={idx}>{item.name} × {item.quantity}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0 md:w-32">
                  <Link to={`/restaurant/${b.restaurantId?._id}`} className="btn-secondary w-full py-2 text-xs flex items-center justify-center gap-1"><MapPin size={14} /> View Details</Link>
                  {b.status === 'completed' && !b.isReviewed && (
                    <button className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1"><MessageSquare size={14} /> Write Review</button>
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
