import { useQuery } from '@tanstack/react-query'
import { BarChart3, PieChart, TrendingUp, IndianRupee, Sparkles } from 'lucide-react'
import api from '@/api/axiosClient'

import useAuth from '@/hooks/useAuth'

export default function Analytics() {
  const { user } = useAuth()
  
  const { data: popItems, isLoading: popLoading } = useQuery({
    queryKey: ['owner', 'analytics', 'popular'],
    queryFn: () => api.get('/analytics/popular-items').then(r => r.data.data),
  })

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['owner', 'ai-insights', user?.restaurantId],
    queryFn: () => api.get(`/ai/insights/${user?.restaurantId}`).then(r => r.data.data),
    enabled: !!user?.restaurantId,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">Analytics & Reports</h1>
        <p className="text-sm text-clay">Deep dive into your restaurant's performance</p>
      </div>

      {user?.restaurantId && (
        <div className="bg-gradient-to-r from-flame/10 to-ember/10 border border-flame/20 rounded-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-r from-flame to-ember rounded-full text-white"><Sparkles size={16} /></div>
            <h3 className="font-display text-lg font-bold text-charcoal">AI Review Insights</h3>
          </div>
          {insightsLoading ? (
            <div className="animate-pulse flex gap-2 items-center text-clay"><div className="w-4 h-4 border-2 border-flame border-t-transparent rounded-full animate-spin" /> Analyzing recent reviews...</div>
          ) : (
            <div className="prose prose-sm prose-p:my-1 prose-li:my-0 text-charcoal" dangerouslySetInnerHTML={{ __html: insights?.insights?.replace(/\n/g, '<br/>') || 'No insights available.' }} />
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-parchment rounded-card p-6 shadow-warm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-lg font-bold">Revenue Breakdown</h3>
            <select className="bg-cream border border-clay/10 text-xs px-2 py-1 rounded"><option>This Month</option></select>
          </div>
          <div className="flex items-center justify-center h-48 text-clay text-sm flex-col gap-2">
            <PieChart size={48} className="text-clay/20" />
            [Pie Chart Placeholder]
            <div className="flex gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs"><div className="w-2 h-2 rounded-full bg-flame" /> Dine-in (45%)</span>
              <span className="flex items-center gap-1 text-xs"><div className="w-2 h-2 rounded-full bg-sage" /> Delivery (55%)</span>
            </div>
          </div>
        </div>

        <div className="bg-parchment rounded-card p-6 shadow-warm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-lg font-bold">Popular Items</h3>
            <select className="bg-cream border border-clay/10 text-xs px-2 py-1 rounded"><option>This Week</option></select>
          </div>
          {popLoading ? <div className="h-48 flex items-center justify-center">Loading...</div> : (
            <div className="space-y-4">
              {popItems?.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 text-center text-sm font-bold text-clay">#{i+1}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-charcoal">{item.name}</span>
                      <span className="font-mono text-xs">{item.totalQuantity} ordered</span>
                    </div>
                    <div className="h-1.5 w-full bg-cream rounded-full overflow-hidden">
                      <div className="h-full bg-flame rounded-full" style={{ width: `${(item.totalQuantity / popItems[0].totalQuantity) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-parchment rounded-card p-6 shadow-warm">
        <h3 className="font-display text-lg font-bold mb-6">Order Volume by Time</h3>
        <div className="h-64 flex items-end gap-1 text-xs text-clay text-center">
          {/* Mock bar chart */}
          {Array.from({ length: 24 }).map((_, i) => {
            const h = Math.sin((i / 24) * Math.PI * 2) * 50 + 50 + (Math.random() * 20);
            return (
              <div key={i} className="flex-1 flex flex-col justify-end group">
                <div className="w-full bg-sage/20 group-hover:bg-sage/40 transition-colors rounded-t-sm relative" style={{ height: `${h}%` }}>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal text-white px-2 py-1 rounded text-[10px] pointer-events-none transition-opacity">{Math.round(h)} orders</div>
                </div>
                <span className="mt-2 text-[10px] opacity-50">{i % 3 === 0 ? `${i}:00` : ''}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
