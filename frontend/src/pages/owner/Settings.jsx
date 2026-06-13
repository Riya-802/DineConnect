import { useState } from 'react'
import { User, Store, Lock, Bell, IndianRupee } from 'lucide-react'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('restaurant')

  const tabs = [
    { id: 'restaurant', label: 'Restaurant Profile', icon: Store },
    { id: 'account', label: 'My Account', icon: User },
    { id: 'payouts', label: 'Payouts & Taxes', icon: IndianRupee },
    { id: 'security', label: 'Security', icon: Lock },
  ]

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-parchment rounded-card p-2 shadow-warm-sm flex flex-col gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-button text-sm font-medium transition-colors text-left ${activeTab === t.id ? 'bg-cream text-flame' : 'text-clay hover:bg-cream/50'}`}>
                <t.icon size={18} /> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-parchment rounded-card p-6 shadow-warm-sm">
          {activeTab === 'restaurant' && (
            <div className="space-y-6">
              <h2 className="font-display text-xl font-bold border-b border-clay/10 pb-4">Restaurant Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-clay mb-1.5">Restaurant Name</label>
                  <input type="text" defaultValue="Grandma's Kitchen" className="input-warm w-full max-w-md px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-clay mb-1.5">Description</label>
                  <textarea defaultValue="Authentic home-style Indian cuisine..." rows={3} className="input-warm w-full max-w-md px-4 py-2" />
                </div>
                <div className="grid grid-cols-2 max-w-md gap-4">
                  <div>
                    <label className="block text-sm font-medium text-clay mb-1.5">Preparation Time (mins)</label>
                    <input type="number" defaultValue="30" className="input-warm w-full px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-clay mb-1.5">Min Order Amount</label>
                    <input type="number" defaultValue="199" className="input-warm w-full px-4 py-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-clay mb-1.5">Cover Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-cream rounded border border-clay/20 flex items-center justify-center text-xs text-clay">Image</div>
                    <button className="btn-secondary px-4 py-2 text-xs">Upload New</button>
                  </div>
                </div>
              </div>
              <div className="pt-4"><button className="btn-primary px-6 py-2.5 text-sm">Save Changes</button></div>
            </div>
          )}

          {activeTab !== 'restaurant' && (
            <div className="py-12 text-center text-clay">
              <p>Settings for "{tabs.find(t=>t.id===activeTab)?.label}"</p>
              <p className="text-xs mt-2">(UI implementation placeholder)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
