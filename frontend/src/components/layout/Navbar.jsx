import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Bell,
  ChevronDown,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ClipboardList,
  Search,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';

// ── Inline SVG: Fork + Knife logo icon ───────────────────────────────────────
const ForkKnifeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-7 h-7 text-[#D85A30]"
    aria-hidden="true"
  >
    {/* Fork */}
    <line x1="3" y1="2" x2="3" y2="8" />
    <line x1="3" y1="12" x2="3" y2="22" />
    <line x1="1" y1="2" x2="5" y2="2" />
    <line x1="1" y1="8" x2="5" y2="8" />
    {/* Knife */}
    <path d="M21 2v6l-2 4v10" />
    <path d="M21 2c-2 0-4 2-4 6l2 4" />
  </svg>
);

// ── Star rating helper ────────────────────────────────────────────────────────
const ROUTES_WITH_SEARCH = ['/restaurants', '/home', '/'];

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux slices (adjust slice paths as needed)
  const { user, isAuthenticated } = useSelector((s) => s.auth ?? {});
  const cartCount = useSelector((s) => s.cart?.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0);
  const unreadNotifications = useSelector((s) => s.notifications?.unread ?? 0);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const showSearch = ROUTES_WITH_SEARCH.includes(location.pathname);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch({ type: 'auth/logout' });
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const roleLabel = user?.role === 'owner'
    ? 'Owner'
    : user?.role === 'delivery'
    ? 'Delivery'
    : null;

  // ── Dropdown menu items by role ─────────────────────────────────────────────
  const dropdownItems = [
    { label: 'My Profile', icon: User, href: '/profile' },
    ...(user?.role === 'customer'
      ? [
          { label: 'My Orders', icon: ClipboardList, href: '/orders' },
          { label: 'My Bookings', icon: CalendarDays, href: '/bookings' },
        ]
      : []),
    ...(user?.role === 'owner'
      ? [{ label: 'Dashboard', icon: ShieldCheck, href: '/owner/dashboard' }]
      : []),
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-lg">
      <div className="w-full px-4 sm:px-8 md:px-16">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <ForkKnifeIcon />
            <div className="flex flex-col leading-tight">
              <span
                className="text-white font-bold text-xl tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                DineConnect
              </span>
              <span className="hidden sm:block text-[10px] text-white/50 font-medium tracking-wide -mt-0.5">
                From our kitchen to your table
              </span>
            </div>
          </Link>

          {/* ── Center Search ─────────────────────────────────────────────── */}
          {showSearch && (
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-md mx-4"
            >
              <div className="relative w-full">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search restaurants or cuisine…"
                  className="w-full pl-11 pr-4 py-3 text-sm bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]/50 focus:border-[#FF4D4D] transition-all backdrop-blur-sm"
                />
              </div>
            </form>
          )}

          {/* ── Right Side ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center px-6 py-2.5 text-sm font-semibold text-[#FF4D4D] border border-[#FF4D4D]/50 rounded-full hover:bg-[#FF4D4D]/10 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#FF4D4D] to-[#FF8C42] rounded-full hover:shadow-lg hover:shadow-[#FF4D4D]/25 transition-all"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                {/* Role badge (owner / delivery) */}
                {roleLabel && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-[#993C1D] rounded-full">
                    <ShieldCheck size={11} />
                    {roleLabel}
                  </span>
                )}

                {/* Cart icon (customers only) */}
                {user?.role === 'customer' && (
                  <button
                    onClick={() => dispatch({ type: 'ui/toggleCart' })}
                    className="relative p-2 rounded-full hover:bg-[#F5ECD9] transition-colors"
                    aria-label="Open cart"
                  >
                    <ShoppingCart size={20} className="text-[#2C2416]" />
                    {cartCount > 0 && (
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.6 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-[#D85A30] rounded-full px-1"
                      >
                        {cartCount > 99 ? '99+' : cartCount}
                      </motion.span>
                    )}
                  </button>
                )}

                {/* Notifications bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen((p) => !p)}
                    className="relative p-2 rounded-full hover:bg-[#F5ECD9] transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={20} className="text-[#2C2416]" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-[#D85A30] rounded-full px-1">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-72 bg-[#FDF6EE] rounded-xl shadow-xl border border-[#B07850]/15 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-[#B07850]/10 flex items-center justify-between">
                          <span className="font-semibold text-[#2C2416] text-sm">Notifications</span>
                          {unreadNotifications > 0 && (
                            <button
                              className="text-xs text-[#D85A30] hover:underline"
                              onClick={() => dispatch({ type: 'notifications/markAllRead' })}
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {unreadNotifications === 0 ? (
                            <p className="text-center text-sm text-[#B07850] py-8">
                              You're all caught up! 🎉
                            </p>
                          ) : (
                            <p className="text-center text-sm text-[#B07850] py-8">
                              {unreadNotifications} unread notification{unreadNotifications > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="px-4 py-2 border-t border-[#B07850]/10">
                          <Link
                            to="/notifications"
                            className="text-xs text-[#D85A30] hover:underline"
                            onClick={() => setNotifOpen(false)}
                          >
                            View all notifications →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Avatar dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[#F5ECD9] transition-colors"
                    aria-label="Account menu"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-[#D85A30]/30"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#D85A30] flex items-center justify-center text-white text-sm font-bold">
                        {user?.name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                    )}
                    <ChevronDown
                      size={14}
                      className={`text-[#B07850] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 bg-[#FDF6EE] rounded-xl shadow-xl border border-[#B07850]/15 overflow-hidden z-50"
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-[#B07850]/10">
                          <p className="text-sm font-semibold text-[#2C2416] truncate">{user?.name}</p>
                          <p className="text-xs text-[#B07850] truncate">{user?.email}</p>
                        </div>

                        {/* Menu items */}
                        <div className="py-1">
                          {dropdownItems.map(({ label, icon: Icon, href }) => (
                            <Link
                              key={href}
                              to={href}
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#2C2416] hover:bg-[#F5ECD9] hover:text-[#D85A30] transition-colors"
                            >
                              <Icon size={15} className="shrink-0" />
                              {label}
                            </Link>
                          ))}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-[#B07850]/10 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Hamburger (mobile) */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors ml-1"
              onClick={() => setMobileOpen((p) => !p)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        {showSearch && (
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurants or cuisine…"
                className="w-full pl-11 pr-4 py-3 text-sm bg-white/5 border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF4D4D]/50 focus:border-[#FF4D4D] transition-all backdrop-blur-sm"
              />
            </div>
          </form>
        )}
      </div>

      {/* ── Mobile Drawer ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-[#B07850]/10 bg-[#FDF6EE]"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/restaurants"
                    className="px-3 py-2.5 text-sm font-medium text-[#2C2416] rounded-lg hover:bg-[#F5ECD9]"
                  >
                    Browse Restaurants
                  </Link>
                  <Link
                    to="/login"
                    className="px-3 py-2.5 text-sm font-medium text-[#D85A30] rounded-lg hover:bg-[#F5ECD9]"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="mt-1 px-3 py-2.5 text-sm font-medium text-center text-white bg-[#D85A30] rounded-lg hover:bg-[#993C1D]"
                  >
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 px-3 py-3 mb-1 bg-[#F5ECD9] rounded-xl">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#D85A30] flex items-center justify-center text-white font-bold">
                        {user?.name?.[0]?.toUpperCase() ?? 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-[#2C2416]">{user?.name}</p>
                      <p className="text-xs text-[#B07850]">{user?.email}</p>
                    </div>
                  </div>

                  {dropdownItems.map(({ label, icon: Icon, href }) => (
                    <Link
                      key={href}
                      to={href}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#2C2416] rounded-lg hover:bg-[#F5ECD9]"
                    >
                      <Icon size={16} />
                      {label}
                    </Link>
                  ))}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 mt-1"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
