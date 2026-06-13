import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, MapPin, Star, Clock, UtensilsCrossed, LayoutGrid, List, Map as MapIcon } from 'lucide-react'
import api from '@/api/axiosClient'

const CUISINES = ['All', 'Indian', 'Chinese', 'Italian', 'Japanese', 'Mexican', 'Healthy', 'Continental', 'Thai']
const SORT_OPTIONS = [{ value: 'relevance', label: 'Relevance' }, { value: 'rating', label: 'Rating' }, { value: 'delivery_time', label: 'Delivery Time' }]

export default function RestaurantsPage() {
  const [search, setSearch] = useState('')
  const [cuisine, setCuisine] = useState('All')
  const [sort, setSort] = useState('relevance')
  const [view, setView] = useState('grid')

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ['restaurants', search, cuisine, sort],
    queryFn: () => api.get(`/restaurants?search=${search}&cuisine=${cuisine === 'All' ? '' : cuisine}&sort=${sort}&limit=20`).then(r => Array.isArray(r.data.data) ? r.data.data : r.data.data?.restaurants || []),
  })

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <h1 className="font-display text-2xl font-bold mb-5">Discover Restaurants</h1>

        {/* Search + Filters */}
        <div className="sticky top-16 z-20 bg-cream/95 backdrop-blur-sm pb-4 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-clay/5 mb-6">
          <div className="flex gap-3 mb-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-clay" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search restaurants or dishes..."
                className="input-warm w-full pl-10 pr-4 py-2.5 text-sm rounded-button" />
            </div>
            <select value={sort} onChange={e => setSort(e.target.value)} className="input-warm px-3 py-2.5 text-sm rounded-button">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="hidden md:flex bg-parchment rounded-button p-0.5">
              {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`p-2 rounded-button ${view === v ? 'bg-cream shadow-warm-sm' : 'text-clay'}`}>
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CUISINES.map(c => (
              <button key={c} onClick={() => setCuisine(c)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${cuisine === c ? 'bg-flame text-white' : 'bg-parchment text-clay hover:bg-flame/10'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className={`grid ${view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''} gap-5`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-parchment rounded-card overflow-hidden">
                <div className="aspect-[4/3] skeleton" /><div className="p-4 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed size={48} className="mx-auto text-clay/30 mb-4" />
            <h3 className="font-display text-lg font-bold mb-2">No restaurants found</h3>
            <p className="text-clay text-sm">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className={`grid ${view === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''} gap-5`}>
            {restaurants.map((r, i) => (
              <motion.div key={r._id || i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={`/restaurant/${r._id}`}
                  className={`block bg-parchment rounded-card shadow-warm-sm overflow-hidden hover:shadow-warm hover:-translate-y-0.5 transition-all group ${view === 'list' ? 'flex' : ''}`}>
                  <div className={`${view === 'list' ? 'w-40 shrink-0' : 'aspect-[4/3]'} bg-gradient-to-br from-clay/10 to-ember/5 flex items-center justify-center relative overflow-hidden`}>
                    {r.coverImage ? <img src={r.coverImage} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <UtensilsCrossed size={24} className="text-clay/20" />}
                  </div>
                  <div className="p-3.5 flex-1">
                    <h3 className="font-display text-base font-bold mb-1 group-hover:text-ember transition-colors">{r.name}</h3>
                    <p className="text-xs text-clay mb-2 line-clamp-1">{r.cuisineTypes?.join(' · ')}</p>
                    <div className="flex items-center gap-3 text-xs text-clay">
                      <span className="flex items-center gap-0.5"><Star size={11} className="fill-flame text-flame" /> {r.avgRating || '–'}</span>
                      <span className="flex items-center gap-0.5"><Clock size={11} /> {r.estimatedDeliveryTime || 30} min</span>
                      {r.minOrderAmount > 0 && <span>Min ₹{r.minOrderAmount}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
