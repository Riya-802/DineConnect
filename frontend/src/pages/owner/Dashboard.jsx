import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { TrendingUp, Package, CalendarDays, IndianRupee, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react'
import api from '@/api/axiosClient'

export default function Dashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['owner', 'analytics', 'revenue'],
    queryFn: () => api.get('/analytics/revenue?period=month').then(r => r.data.data),
  })

  if (isLoading) return <div className="p-8">Loading dashboard...</div>

  const stats = [
    { label: 'Total Revenue', value: `₹${analytics?.summary?.totalRevenue || 0}`, trend: '+12%', isPositive: true, icon: IndianRupee },
    { label: 'Total Orders', value: analytics?.summary?.totalOrders || 0, trend: '+5%', isPositive: true, icon: Package },
    { label: 'Total Bookings', value: analytics?.summary?.totalBookings || 0, trend: '-2%', isPositive: false, icon: CalendarDays },
    { label: 'Avg Order Value', value: `₹${analytics?.orderRevenue?.[0]?.avgOrderValue?.toFixed(0) || 0}`, trend: '+8%', isPositive: true, icon: TrendingUp },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Overview</h1>
          <p className="text-sm text-clay">Welcome back, here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/orders-live" className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"><Clock size={16} /> Live Orders</Link>
          <Link to="/bookings-live" className="btn-primary px-4 py-2 text-sm">View Bookings</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="bg-parchment rounded-card p-5 shadow-warm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
                <s.icon size={18} className="text-ember" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${s.isPositive ? 'bg-sage/10 text-sage' : 'bg-red-500/10 text-red-500'}`}>
                {s.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {s.trend}
              </span>
            </div>
            <p className="text-sm font-medium text-clay mb-1">{s.label}</p>
            <h3 className="font-display text-2xl font-bold text-charcoal">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-parchment rounded-card p-6 shadow-warm min-h-[300px]">
          <h3 className="font-display text-lg font-bold mb-4">Revenue Trend (Mock Chart)</h3>
          <div className="h-full w-full flex items-end gap-2 pt-10">
            {[40, 70, 45, 90, 60, 100, 80, 120, 95, 110, 85, 130].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-flame to-ember rounded-t-sm" style={{ height: `${(h/130)*100}%` }} />
            ))}
          </div>
        </div>
        <div className="bg-parchment rounded-card p-6 shadow-warm">
          <h3 className="font-display text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0 text-clay">
                  <Package size={14} />
                </div>
                <div>
                  <p className="text-sm"><span className="font-medium">New Order #{i}123</span> placed</p>
                  <p className="text-xs text-clay">10 mins ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
