import { ChefHat, MessageCircle, Share2, Video, Mail, Phone, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream/80 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-flame to-ember flex items-center justify-center">
                <ChefHat size={20} className="text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-cream">DineConnect</h3>
            </div>
            <p className="text-sm leading-relaxed text-cream/60 mb-6">
              From our kitchen to your table — or yours to ours. Experience the warmth of home cooking, wherever you are.
            </p>
            <div className="flex gap-3">
              {[MessageCircle, Share2, Video].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-cream/10 flex items-center justify-center hover:bg-flame/80 transition-colors">
                  <Icon size={16} className="text-cream/80" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-sans font-semibold text-cream mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[['Browse Restaurants', '/restaurants'], ['Book a Table', '/restaurants'], ['Order Delivery', '/home'], ['My Orders', '/orders'], ['My Bookings', '/bookings']].map(([label, path]) => (
                <li key={label}><Link to={path} className="text-sm text-cream/60 hover:text-flame transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* For Restaurants */}
          <div>
            <h4 className="font-sans font-semibold text-cream mb-4">For Restaurants</h4>
            <ul className="space-y-2.5">
              {['Partner with us', 'Owner Dashboard', 'Manage Menu', 'Table Management', 'Analytics'].map((label) => (
                <li key={label}><a href="#" className="text-sm text-cream/60 hover:text-flame transition-colors">{label}</a></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-sans font-semibold text-cream mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-cream/60">
                <Mail size={14} className="text-flame shrink-0" />
                <span>hello@dineconnect.app</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-cream/60">
                <Phone size={14} className="text-flame shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-cream/60">
                <MapPin size={14} className="text-flame shrink-0 mt-0.5" />
                <span>Bangalore, Karnataka, India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cream/10 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-cream/40">
          <span>© 2026 DineConnect. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-cream transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-cream transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-cream transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
