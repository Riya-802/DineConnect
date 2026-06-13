import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, Users, ChevronLeft, Check, UtensilsCrossed, Loader2, Sparkles } from 'lucide-react'
import api from '@/api/axiosClient'
import toast from 'react-hot-toast'

const TIME_SLOTS = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00']

export default function BookingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState(2)
  const [selectedTable, setSelectedTable] = useState(null)
  const [preOrderItems, setPreOrderItems] = useState([])

  const { data: restaurant } = useQuery({ queryKey: ['restaurant', id], queryFn: () => api.get(`/restaurants/${id}`).then(r => r.data.data) })
  const { data: tables = [] } = useQuery({ queryKey: ['tables', id, date, time], queryFn: () => api.get(`/restaurants/${id}/tables?date=${date}&timeSlot=${time}`).then(r => r.data.data || []), enabled: !!time })
  const { data: menu = [] } = useQuery({ queryKey: ['menu', id], queryFn: () => api.get(`/restaurants/${id}/menu`).then(r => r.data.data || []) })

  const bookMutation = useMutation({
    mutationFn: (data) => api.post('/bookings', data),
    onSuccess: () => { toast.success('Table booked! 🎉'); navigate('/bookings') },
    onError: (e) => toast.error(e.response?.data?.message || 'Booking failed'),
  })

  const suggestComboMutation = useMutation({
    mutationFn: () => api.post('/ai/suggest-combo', { restaurantId: id, partySize: guests }).then(r => r.data.data),
    onSuccess: (data) => {
      if (data.suggestedItems && data.suggestedItems.length > 0) {
        const newPreOrders = [...preOrderItems];
        data.suggestedItems.forEach(suggestedName => {
           const matchedItem = menu.find(m => m.name.toLowerCase().includes(suggestedName.toLowerCase()) || suggestedName.toLowerCase().includes(m.name.toLowerCase()));
           if (matchedItem) {
             const existing = newPreOrders.find(i => i.menuItemId === matchedItem._id);
             if (existing) Object.assign(existing, { quantity: existing.quantity + 1 });
             else newPreOrders.push({ menuItemId: matchedItem._id, name: matchedItem.name, price: matchedItem.price, quantity: 1 });
           }
        });
        setPreOrderItems([...newPreOrders]);
        toast.success('Combo added to pre-order!');
      }
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to suggest combo')
  })

  const addPreOrder = (item) => {
    const existing = preOrderItems.find(i => i.menuItemId === item._id)
    if (existing) setPreOrderItems(preOrderItems.map(i => i.menuItemId === item._id ? { ...i, quantity: i.quantity + 1 } : i))
    else setPreOrderItems([...preOrderItems, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }])
  }

  const removePreOrder = (menuItemId) => {
    setPreOrderItems(preOrderItems.map(i => i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i).filter(i => i.quantity > 0))
  }

  const preOrderTotal = preOrderItems.reduce((s, i) => s + i.price * i.quantity, 0)

  const handleBook = () => {
    bookMutation.mutate({ restaurantId: id, tableId: selectedTable, date, timeSlot: time, partySize: guests, preOrderItems })
  }

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="flex items-center gap-1 text-sm text-clay mb-4 hover:text-charcoal"><ChevronLeft size={16} /> Back</button>
        <h1 className="font-display text-2xl font-bold mb-2">Book a Table at {restaurant?.name}</h1>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8 max-w-xs">
          {['Date & Time', 'Select Table', 'Pre-Order'].map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${step > i + 1 ? 'bg-sage text-white' : step === i + 1 ? 'bg-flame text-white' : 'bg-parchment text-clay'}`}>{step > i + 1 ? <Check size={12} /> : i + 1}</div>
              {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? 'bg-sage' : 'bg-clay/20'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Date & Time */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="bg-parchment rounded-card p-5 shadow-warm-sm">
              <label className="flex items-center gap-2 text-sm font-medium mb-3"><CalendarDays size={16} className="text-flame" /> Select Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
                className="input-warm w-full py-3 text-sm" />
            </div>
            <div className="bg-parchment rounded-card p-5 shadow-warm-sm">
              <label className="flex items-center gap-2 text-sm font-medium mb-3"><Clock size={16} className="text-flame" /> Select Time</label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map(t => (
                  <button key={t} onClick={() => setTime(t)}
                    className={`py-2.5 rounded-button text-sm font-medium transition-all ${time === t ? 'bg-flame text-white' : 'bg-cream hover:bg-flame/10 text-clay'}`}>{t}</button>
                ))}
              </div>
            </div>
            <div className="bg-parchment rounded-card p-5 shadow-warm-sm">
              <label className="flex items-center gap-2 text-sm font-medium mb-3"><Users size={16} className="text-flame" /> Number of Guests</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-10 h-10 rounded-full bg-cream border border-clay/20 flex items-center justify-center text-lg">−</button>
                <span className="text-2xl font-bold w-12 text-center">{guests}</span>
                <button onClick={() => setGuests(Math.min(12, guests + 1))} className="w-10 h-10 rounded-full bg-cream border border-clay/20 flex items-center justify-center text-lg">+</button>
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!time} className="btn-primary w-full py-3.5 text-sm">Continue</button>
          </motion.div>
        )}

        {/* Step 2: Table */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <p className="text-sm text-clay">{date} at {time} · {guests} guests</p>
            {tables.length === 0 ? (
              <div className="text-center py-12"><p className="text-clay">No tables available for this slot</p></div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tables.map(t => (
                  <button key={t._id} onClick={() => t.capacity >= guests && setSelectedTable(t._id)} disabled={t.capacity < guests}
                    className={`p-4 rounded-card border-2 transition-all text-center ${selectedTable === t._id ? 'border-flame bg-flame/5' : t.capacity < guests ? 'border-clay/10 opacity-40' : 'border-clay/15 hover:border-clay/40 bg-parchment'}`}>
                    <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-cream flex items-center justify-center"><span className="text-lg">🪑</span></div>
                    <p className="font-bold text-sm">Table {t.tableNumber}</p>
                    <p className="text-xs text-clay">{t.capacity} seats · {t.location || 'Indoor'}</p>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep(3)} disabled={!selectedTable} className="btn-primary w-full py-3.5 text-sm">Continue to Pre-Order</button>
          </motion.div>
        )}

        {/* Step 3: Pre-order */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div className="flex justify-between items-start mb-3 gap-2">
              <p className="text-sm text-clay">Pre-order dishes so they're ready when you arrive (optional)</p>
              <button onClick={() => suggestComboMutation.mutate()} disabled={suggestComboMutation.isPending} className="text-xs font-bold text-flame flex items-center gap-1 bg-flame/10 px-3 py-1.5 rounded-full hover:bg-flame/20 transition-colors shrink-0">
                {suggestComboMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Suggest
              </button>
            </div>
            
            {suggestComboMutation.data?.comboText && (
              <div className="bg-sage/10 border border-sage/30 rounded-card p-3 mb-4 text-sm text-charcoal flex gap-2 items-start">
                <Sparkles size={16} className="text-sage shrink-0 mt-0.5" />
                <p>{suggestComboMutation.data.comboText}</p>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {menu.filter(m => m.isAvailable).map(item => {
                const qty = preOrderItems.find(i => i.menuItemId === item._id)?.quantity || 0
                return (
                  <div key={item._id} className="flex items-center gap-3 bg-parchment rounded-card p-3 shadow-warm-sm">
                    <div className="w-14 h-14 rounded-button bg-clay/10 shrink-0 flex items-center justify-center overflow-hidden">
                      {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <UtensilsCrossed size={16} className="text-clay/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-clay">₹{item.price}</p>
                    </div>
                    {qty > 0 ? (
                      <div className="flex items-center gap-2 bg-flame/10 rounded-button px-1.5">
                        <button onClick={() => removePreOrder(item._id)} className="p-1 text-ember text-sm">−</button>
                        <span className="text-xs font-bold w-4 text-center">{qty}</span>
                        <button onClick={() => addPreOrder(item)} className="p-1 text-ember text-sm">+</button>
                      </div>
                    ) : (
                      <button onClick={() => addPreOrder(item)} className="text-xs font-semibold text-flame border border-flame px-3 py-1 rounded-button">ADD</button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="bg-parchment rounded-card p-4 shadow-warm-sm">
              <div className="flex justify-between text-sm mb-2"><span className="text-clay">Pre-order total</span><span className="font-bold">₹{preOrderTotal}</span></div>
              <p className="text-[10px] text-clay">You can skip pre-ordering and order at the restaurant instead</p>
            </div>
            <button onClick={handleBook} disabled={bookMutation.isPending}
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2">
              {bookMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <>Confirm Booking <Check size={16} /></>}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
