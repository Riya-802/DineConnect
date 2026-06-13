import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, MapPin, Clock, Star, UtensilsCrossed, BookOpen, Truck, TrendingUp } from 'lucide-react'
import api from '@/api/axiosClient'
import useAuth from '@/hooks/useAuth'

const CUISINES = ['🍛 Indian', '🍜 Chinese', '🍕 Italian', '🍣 Japanese', '🌮 Mexican', '🥗 Healthy', '🍔 Burgers', '🧁 Desserts']

export default function HomePage() {
  const { user } = useAuth()
  const [mode, setMode] = useState('delivery') // 'dine-in' | 'delivery'
  const [searchQuery, setSearchQuery] = useState('')

  const { data: restaurants, isLoading } = useQuery({
    queryKey: ['restaurants', 'nearby'],
    queryFn: () => api.get('/restaurants?limit=8').then(r => Array.isArray(r.data.data) ? r.data.data : r.data.data?.restaurants || []),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">{greeting()}, {user?.name?.split(' ')[0]} 🍳</h1>
          <p className="text-clay text-sm">What would you like today?</p>
        </motion.div>

        {/* Search */}
        <div className="relative mt-5 mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-clay" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search restaurants, dishes, cuisines..."
            className="input-warm w-full pl-11 pr-4 py-3.5 text-sm rounded-button" />
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-parchment rounded-full p-1 flex shadow-warm-sm">
            {[['dine-in', BookOpen, 'Dine In'], ['delivery', Truck, 'Delivery']].map(([m, Icon, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${mode === m ? 'bg-gradient-to-r from-flame to-ember text-white shadow-warm' : 'text-clay'}`}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine Chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {CUISINES.map(c => (
            <Link key={c} to={`/restaurants?cuisine=${c.split(' ')[1]}`}
              className="shrink-0 bg-parchment px-4 py-2 rounded-full text-sm font-medium hover:bg-flame/10 hover:text-ember transition-colors whitespace-nowrap">
              {c}
            </Link>
          ))}
        </div>

        {/* Nearby Restaurants */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-display text-xl font-bold">Nearby Restaurants</h2>
            <Link to="/restaurants" className="text-flame text-sm font-medium">View all →</Link>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-parchment rounded-card overflow-hidden">
                  <div className="aspect-[4/3] skeleton" />
                  <div className="p-4 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(restaurants || []).slice(0, 8).map((r, i) => (
                <motion.div key={r._id || i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link to={`/restaurant/${r._id}`} className="block bg-parchment rounded-card shadow-warm-sm overflow-hidden hover:shadow-warm hover:-translate-y-0.5 transition-all group">
                    <div className="aspect-[4/3] bg-gradient-to-br from-clay/10 to-ember/5 flex items-center justify-center relative overflow-hidden">
                      {r.coverImage ? <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <UtensilsCrossed size={30} className="text-clay/20" />}
                      <div className="absolute top-2 left-2 flex gap-1">{r.cuisineTypes?.slice(0, 2).map(c => <span key={c} className="badge badge-flame text-[9px]">{c}</span>)}</div>
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-display text-base font-bold mb-1 group-hover:text-ember transition-colors">{r.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-clay">
                        <span className="flex items-center gap-0.5"><Star size={11} className="fill-flame text-flame" /> {r.avgRating || '4.5'}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock size={11} /> {r.estimatedDeliveryTime || 30} min</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Trending */}
        <div>
          <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2"><TrendingUp size={20} className="text-flame" /> Trending This Week</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {['Family Thali Combo', 'Weekend Brunch Specials', 'Home Chef Collection'].map((title, i) => (
              <div key={title} className="bg-gradient-to-br from-parchment to-cream rounded-card p-5 shadow-warm-sm hover:shadow-warm transition-shadow">
                <div className="w-10 h-10 rounded-full bg-flame/10 flex items-center justify-center mb-3"><TrendingUp size={18} className="text-flame" /></div>
                <h3 className="font-medium text-sm mb-1">{title}</h3>
                <p className="text-xs text-clay">Explore curated picks →</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
