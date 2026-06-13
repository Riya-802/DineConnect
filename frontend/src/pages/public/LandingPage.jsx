import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Clock, Star, ChevronRight, UtensilsCrossed, Sparkles } from 'lucide-react'

const MOCK_RESTAURANTS = [
  { _id: '1', name: 'Grandma\'s Kitchen', cuisineTypes: ['Indian', 'Home Style'], coverImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=500&q=80', avgRating: 4.8, totalRatings: 342, estimatedDeliveryTime: 30, minOrderAmount: 199 },
  { _id: '2', name: 'The Clay Oven', cuisineTypes: ['Tandoori', 'North Indian'], coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=80', avgRating: 4.6, totalRatings: 215, estimatedDeliveryTime: 35, minOrderAmount: 249 },
  { _id: '3', name: 'Saffron Tales', cuisineTypes: ['Mughlai', 'Biryani'], coverImage: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?auto=format&fit=crop&w=500&q=80', avgRating: 4.9, totalRatings: 528, estimatedDeliveryTime: 40, minOrderAmount: 299 },
  { _id: '4', name: 'Herb & Spice', cuisineTypes: ['Continental', 'Italian'], coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=80', avgRating: 4.5, totalRatings: 180, estimatedDeliveryTime: 25, minOrderAmount: 349 },
]

const CATEGORIES = [
  { name: 'Offers', icon: '🔥' },
  { name: 'Healthy', icon: '🥗' },
  { name: 'Pizza', icon: '🍕' },
  { name: 'Asian', icon: '🍜' },
  { name: 'Desserts', icon: '🍰' },
  { name: 'Burgers', icon: '🍔' }
]

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0D12] pb-24">
      {/* ═══ FEATURED HERO BANNER ═══ */}
      <section className="w-full">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full h-[300px] md:h-[500px] overflow-hidden shadow-2xl group"
        >
          {/* Background Image */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 md:px-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={12} className="text-[#FF4D4D]" /> Editor's Pick
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
              Midnight Cravings?<br />We've got you covered.
            </h1>
            <p className="text-white/70 text-sm md:text-base max-w-md mb-5">
              Order now and get 50% off on your first late-night delivery.
            </p>
            <Link to="/restaurants" className="inline-flex items-center gap-2 bg-[#FF4D4D] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#FF8C42] transition-colors shadow-lg shadow-[#FF4D4D]/25">
              Explore Now <ChevronRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ═══ CATEGORIES HORIZONTAL SCROLL ═══ */}
      <section className="w-full px-4 md:px-16 py-8">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="flex gap-4 md:gap-8 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {CATEGORIES.map((cat, i) => (
            <motion.div 
              key={cat.name} 
              variants={fadeUp}
              className="snap-start shrink-0 flex flex-col items-center gap-2"
            >
              <button className="w-16 h-16 md:w-20 md:h-20 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-2xl md:text-3xl hover:bg-white/10 transition-colors shadow-lg">
                {cat.icon}
              </button>
              <span className="text-xs md:text-sm font-medium text-[#94A3B8]">{cat.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══ POPULAR NEAR YOU ═══ */}
      <section className="w-full px-4 md:px-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">Popular Near You</h2>
          <Link to="/restaurants" className="text-sm font-medium text-[#FF4D4D] flex items-center gap-1 hover:text-[#FF8C42] transition-colors">
            See All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_RESTAURANTS.map((r, i) => (
            <Link to={`/restaurant/${r._id}`} key={r._id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card overflow-hidden group cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative h-48 w-full overflow-hidden bg-white/5">
                  <img 
                    src={r.coverImage} 
                    alt={r.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {r.cuisineTypes.slice(0, 2).map((c) => (
                      <span key={c} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md rounded-md border border-white/10">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white leading-tight">{r.name}</h3>
                    <div className="flex items-center gap-1 bg-[#00E676]/10 text-[#00E676] px-1.5 py-0.5 rounded text-xs font-bold">
                      <Star size={12} className="fill-[#00E676]" /> {r.avgRating}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-[#94A3B8] font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-[#FF4D4D]" /> {r.estimatedDeliveryTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-[#FF4D4D]" /> 2.4 km
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ PROMO SECTION ═══ */}
      <section className="w-full px-4 md:px-16 mt-12 mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative w-full rounded-[32px] overflow-hidden bg-gradient-to-r from-[#FF4D4D] to-[#FF8C42] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-[#FF4D4D]/20"
        >
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-3">Dine In. Delivered.</h2>
            <p className="text-white/90 text-sm md:text-base max-w-md mb-6">
              Skip the wait. Book a table with pre-orders, and your food will be ready the moment you sit down.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 bg-white text-[#FF4D4D] px-6 py-3 rounded-full font-bold hover:shadow-lg transition-all">
              Join DineConnect Free
            </Link>
          </div>
          <div className="relative z-10 flex-shrink-0">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl">
              <UtensilsCrossed size={64} className="text-white" />
            </div>
          </div>
          
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </motion.div>
      </section>
    </div>
  )
}
