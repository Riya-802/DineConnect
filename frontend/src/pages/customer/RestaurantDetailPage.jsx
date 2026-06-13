import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Star, Clock, MapPin, Phone, Plus, Minus, UtensilsCrossed, BookOpen, Truck, ChevronLeft } from 'lucide-react'
import api from '@/api/axiosClient'
import { addItem } from '@/store/slices/cartSlice'
import { selectCartItems } from '@/store/slices/cartSlice'

export default function RestaurantDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)
  const [activeTab, setActiveTab] = useState('menu')
  const [vegOnly, setVegOnly] = useState(false)

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => api.get(`/restaurants/${id}`).then(r => r.data.data),
  })

  const { data: menu = [] } = useQuery({
    queryKey: ['restaurant-menu', id],
    queryFn: () => api.get(`/restaurants/${id}/menu`).then(r => r.data.data || []),
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['restaurant-reviews', id],
    queryFn: () => api.get(`/restaurants/${id}/reviews`).then(r => r.data.data?.reviews || r.data.data || []),
  })

  if (isLoading) return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="skeleton h-64 rounded-card" />
      <div className="skeleton h-8 w-64" />
      <div className="skeleton h-4 w-48" />
    </div>
  )

  const r = restaurant || {}
  const categories = [...new Set(menu.map(m => m.category).filter(Boolean))]
  const filteredMenu = vegOnly ? menu.filter(m => m.isVeg) : menu

  const getCartQty = (itemId) => cartItems.find(i => i._id === itemId)?.quantity || 0

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      {/* Cover */}
      <div className="relative h-56 md:h-72 bg-gradient-to-br from-clay/20 to-ember/10 flex items-center justify-center">
        {r.coverImage ? <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover" /> : <UtensilsCrossed size={60} className="text-clay/20" />}
        <Link to="/restaurants" className="absolute top-4 left-4 bg-cream/90 backdrop-blur p-2 rounded-full shadow-warm-sm">
          <ChevronLeft size={20} />
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-8 relative z-10">
        {/* Info Card */}
        <div className="bg-parchment rounded-card shadow-warm p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">{r.name}</h1>
              <p className="text-clay text-sm mb-3">{r.cuisineTypes?.join(' · ')}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-clay">
                <span className="flex items-center gap-1"><Star size={14} className="fill-flame text-flame" /> {r.avgRating || '–'} ({r.totalRatings || 0})</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {r.estimatedDeliveryTime || 30} min</span>
                <span className="flex items-center gap-1"><MapPin size={14} /> {r.address?.city}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/book/${id}`} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2"><BookOpen size={16} /> Book Table</Link>
              <button onClick={() => setActiveTab('menu')} className="btn-secondary px-5 py-2.5 text-sm flex items-center gap-2"><Truck size={16} /> Order</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-parchment rounded-button p-1 mb-6">
          {['menu', 'tables', 'reviews'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-button capitalize transition-all ${activeTab === tab ? 'bg-cream shadow-warm-sm text-charcoal' : 'text-clay'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => setVegOnly(!vegOnly)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${vegOnly ? 'bg-sage/10 border-sage text-sage' : 'border-clay/20 text-clay'}`}>
                <span className="w-3 h-3 border-2 border-sage rounded-sm flex items-center justify-center">{vegOnly && <span className="w-1.5 h-1.5 bg-sage rounded-full" />}</span>
                Veg Only
              </button>
            </div>
            {categories.length > 0 ? categories.map(cat => (
              <div key={cat} className="mb-8">
                <h3 className="font-display text-lg font-bold mb-3 text-ember">{cat}</h3>
                <div className="space-y-3">
                  {filteredMenu.filter(m => m.category === cat).map(item => {
                    const qty = getCartQty(item._id)
                    return (
                      <div key={item._id} className={`flex gap-4 bg-parchment rounded-card p-4 shadow-warm-sm ${!item.isAvailable ? 'opacity-50' : ''}`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-4 h-4 border-2 rounded-sm ${item.isVeg ? 'border-sage' : 'border-red-500'}`}><span className={`block w-2 h-2 m-auto mt-0.5 rounded-full ${item.isVeg ? 'bg-sage' : 'bg-red-500'}`} /></span>
                            <h4 className="font-medium text-sm">{item.name}</h4>
                          </div>
                          <p className="text-xs text-clay line-clamp-2 mb-2">{item.description}</p>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-sm">₹{item.price}</span>
                            {item.preparationTime && <span className="text-[10px] text-clay flex items-center gap-0.5"><Clock size={10} /> {item.preparationTime} min</span>}
                          </div>
                          {!item.isAvailable && <span className="text-[10px] text-red-500 font-medium mt-1 block">Currently unavailable</span>}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-20 h-20 rounded-button bg-clay/10 overflow-hidden flex items-center justify-center">
                            {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <UtensilsCrossed size={20} className="text-clay/20" />}
                          </div>
                          {item.isAvailable && (qty > 0 ? (
                            <div className="flex items-center gap-2 bg-flame/10 rounded-button px-1">
                              <button onClick={() => dispatch(addItem({ item: { ...item, quantity: -1 }, restaurantId: id, restaurantName: r.name }))} className="p-1 text-ember"><Minus size={14} /></button>
                              <span className="text-xs font-bold w-4 text-center">{qty}</span>
                              <button onClick={() => dispatch(addItem({ item, restaurantId: id, restaurantName: r.name }))} className="p-1 text-ember"><Plus size={14} /></button>
                            </div>
                          ) : (
                            <button onClick={() => dispatch(addItem({ item, restaurantId: id, restaurantName: r.name }))}
                              className="text-xs font-semibold text-flame border border-flame px-4 py-1.5 rounded-button hover:bg-flame/5 transition-colors">ADD</button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )) : (
              <div className="text-center py-12"><UtensilsCrossed size={40} className="mx-auto text-clay/20 mb-3" /><p className="text-clay">No menu items available</p></div>
            )}
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div className="text-center py-12">
            <BookOpen size={40} className="mx-auto text-clay/20 mb-3" />
            <h3 className="font-display text-lg font-bold mb-2">Ready to Dine?</h3>
            <p className="text-clay text-sm mb-4">Select a date and time to see available tables</p>
            <Link to={`/book/${id}`} className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">Book a Table</Link>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <div className="text-center py-12"><Star size={40} className="mx-auto text-clay/20 mb-3" /><p className="text-clay">No reviews yet</p></div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev, i) => (
                  <div key={rev._id || i} className="bg-parchment rounded-card p-4 shadow-warm-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-flame/10 flex items-center justify-center text-xs font-bold text-ember">{rev.customerId?.name?.charAt(0) || '?'}</div>
                      <div className="flex-1"><p className="text-sm font-medium">{rev.customerId?.name || 'Anonymous'}</p></div>
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, j) => <Star key={j} size={12} className={j < rev.rating ? 'fill-flame text-flame' : 'text-parchment'} />)}</div>
                    </div>
                    <p className="text-sm text-charcoal">{rev.comment}</p>
                    {rev.reply && <div className="mt-3 ml-4 pl-3 border-l-2 border-sage/30 text-sm text-clay"><span className="text-xs font-medium text-sage">Owner replied:</span> {rev.reply}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart floating bar */}
      {cartItems.length > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 md:bottom-4 left-0 right-0 md:left-auto md:right-4 md:max-w-sm z-50">
          <Link to={`/order/${id}`} className="block mx-4 md:mx-0 mb-4 md:mb-0 bg-gradient-to-r from-flame to-ember text-white p-4 rounded-card shadow-warm-lg flex items-center justify-between">
            <span className="text-sm font-medium">{cartItems.reduce((s, i) => s + i.quantity, 0)} items · ₹{cartItems.reduce((s, i) => s + i.price * i.quantity, 0)}</span>
            <span className="text-sm font-bold flex items-center gap-1">View Cart <ChevronLeft size={14} className="rotate-180" /></span>
          </Link>
        </motion.div>
      )}
    </div>
  )
}
