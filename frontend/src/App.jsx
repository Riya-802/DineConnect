import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { fetchProfile } from './store/slices/authSlice'

// Layout
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'
import AIChatWidget from './components/ui/AIChatWidget'

// Pages — lazy loaded
const LandingPage          = lazy(() => import('./pages/public/LandingPage'))
const LoginPage            = lazy(() => import('./pages/public/LoginPage'))
const RegisterPage         = lazy(() => import('./pages/public/RegisterPage'))
const HomePage             = lazy(() => import('./pages/customer/HomePage'))
const RestaurantsPage      = lazy(() => import('./pages/customer/RestaurantsPage'))
const RestaurantDetailPage = lazy(() => import('./pages/customer/RestaurantDetailPage'))
const BookingPage          = lazy(() => import('./pages/customer/BookingPage'))
const OrderPage            = lazy(() => import('./pages/customer/OrderPage'))
const TrackOrderPage       = lazy(() => import('./pages/customer/TrackOrderPage'))
const BookingsHistoryPage  = lazy(() => import('./pages/customer/BookingsHistoryPage'))
const OrdersHistoryPage    = lazy(() => import('./pages/customer/OrdersHistoryPage'))
const ProfilePage          = lazy(() => import('./pages/customer/ProfilePage'))
const OwnerDashboard       = lazy(() => import('./pages/owner/Dashboard'))
const OwnerOrdersLive      = lazy(() => import('./pages/owner/OrdersLive'))
const OwnerBookingsLive    = lazy(() => import('./pages/owner/BookingsLive'))
const OwnerMenu            = lazy(() => import('./pages/owner/MenuManagement'))
const OwnerTables          = lazy(() => import('./pages/owner/TableManagement'))
const OwnerAnalytics       = lazy(() => import('./pages/owner/Analytics'))
const OwnerSettings        = lazy(() => import('./pages/owner/Settings'))
const DeliveryHome         = lazy(() => import('./pages/delivery/DeliveryHome'))
const DeliveryActive       = lazy(() => import('./pages/delivery/ActiveDelivery'))
const DeliveryHistory      = lazy(() => import('./pages/delivery/DeliveryHistory'))

// ── Loading fallback ─────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-parchment border-t-flame rounded-full animate-spin" />
      <p className="text-clay font-sans text-sm">Loading...</p>
    </div>
  </div>
)

// ── Route guard ──────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((s) => s.auth)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/home" replace />
  return children
}

// ── Page transition ──────────────────────────────────────────────
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
)

// ── Owner layout ─────────────────────────────────────────────────
const OwnerLayout = ({ children }) => (
  <div className="flex min-h-screen bg-cream">
    <Sidebar />
    <main className="flex-1 md:ml-60 p-4 md:p-8">{children}</main>
  </div>
)

// ── Determine layout visibility ──────────────────────────────────
const noNavRoutes = ['/login', '/register']
const noFooterRoutes = ['/login', '/register', '/track', '/delivery']
const ownerRoutes = ['/dashboard', '/orders-live', '/bookings-live', '/menu', '/tables', '/analytics', '/settings']

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { isAuthenticated, user } = useSelector((s) => s.auth)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token && !user) dispatch(fetchProfile())
  }, [dispatch, user])

  const isOwnerRoute = ownerRoutes.some((r) => location.pathname.startsWith(r))
  const isDeliveryRoute = location.pathname.startsWith('/delivery')
  const showNav = !noNavRoutes.includes(location.pathname)
  const showFooter = !noFooterRoutes.some((r) => location.pathname.startsWith(r)) && !isOwnerRoute && !isDeliveryRoute
  const showBottomNav = isAuthenticated && user?.role === 'customer' && !isOwnerRoute && !isDeliveryRoute && !noNavRoutes.includes(location.pathname)

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">
      {showNav && !isOwnerRoute && <Navbar />}

      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public */}
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />

            {/* Customer */}
            <Route path="/home" element={<ProtectedRoute allowedRoles={['customer']}><PageTransition><HomePage /></PageTransition></ProtectedRoute>} />
            <Route path="/restaurants" element={<ProtectedRoute allowedRoles={['customer']}><PageTransition><RestaurantsPage /></PageTransition></ProtectedRoute>} />
            <Route path="/restaurant/:id" element={<ProtectedRoute allowedRoles={['customer']}><PageTransition><RestaurantDetailPage /></PageTransition></ProtectedRoute>} />
            <Route path="/book/:id" element={<ProtectedRoute allowedRoles={['customer']}><PageTransition><BookingPage /></PageTransition></ProtectedRoute>} />
            <Route path="/order/:id" element={<ProtectedRoute allowedRoles={['customer']}><PageTransition><OrderPage /></PageTransition></ProtectedRoute>} />
            <Route path="/track/:id" element={<ProtectedRoute allowedRoles={['customer']}><PageTransition><TrackOrderPage /></PageTransition></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute allowedRoles={['customer']}><PageTransition><BookingsHistoryPage /></PageTransition></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={['customer']}><PageTransition><OrdersHistoryPage /></PageTransition></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />

            {/* Owner Dashboard */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout><PageTransition><OwnerDashboard /></PageTransition></OwnerLayout></ProtectedRoute>} />
            <Route path="/orders-live" element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout><PageTransition><OwnerOrdersLive /></PageTransition></OwnerLayout></ProtectedRoute>} />
            <Route path="/bookings-live" element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout><PageTransition><OwnerBookingsLive /></PageTransition></OwnerLayout></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout><PageTransition><OwnerMenu /></PageTransition></OwnerLayout></ProtectedRoute>} />
            <Route path="/tables" element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout><PageTransition><OwnerTables /></PageTransition></OwnerLayout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout><PageTransition><OwnerAnalytics /></PageTransition></OwnerLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['owner']}><OwnerLayout><PageTransition><OwnerSettings /></PageTransition></OwnerLayout></ProtectedRoute>} />

            {/* Delivery Partner */}
            <Route path="/delivery/home" element={<ProtectedRoute allowedRoles={['delivery']}><PageTransition><DeliveryHome /></PageTransition></ProtectedRoute>} />
            <Route path="/delivery/active/:id" element={<ProtectedRoute allowedRoles={['delivery']}><PageTransition><DeliveryActive /></PageTransition></ProtectedRoute>} />
            <Route path="/delivery/history" element={<ProtectedRoute allowedRoles={['delivery']}><PageTransition><DeliveryHistory /></PageTransition></ProtectedRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>

      {showFooter && <Footer />}
      {showBottomNav && <BottomNav />}
      {showBottomNav && <AIChatWidget />}
    </div>
  )
}

export default App
