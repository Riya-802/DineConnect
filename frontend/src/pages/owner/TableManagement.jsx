import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Maximize, Settings } from 'lucide-react'
import api from '@/api/axiosClient'
import toast from 'react-hot-toast'

export default function TableManagement() {
  const queryClient = useQueryClient()
  const { data: restaurant } = useQuery({ queryKey: ['owner-restaurant'], queryFn: () => api.get(`/restaurants?owner=me`).then(r => r.data.data?.[0] || null) })
  
  // Note: We'd normally use a specific owner route to fetch all tables regardless of status
  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['owner-tables'],
    queryFn: () => restaurant ? api.get(`/restaurants/${restaurant._id}/tables`).then(r => r.data.data || []) : [],
    enabled: !!restaurant,
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => api.put(`/tables/${id}/status`, { status }),
    onSuccess: () => { toast.success('Status updated'); queryClient.invalidateQueries(['owner-tables']) }
  })

  const deleteTable = useMutation({
    mutationFn: (id) => api.delete(`/tables/${id}`),
    onSuccess: () => { toast.success('Table deleted'); queryClient.invalidateQueries(['owner-tables']) }
  })

  if (isLoading) return <div className="p-8">Loading tables...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Table Management</h1>
          <p className="text-sm text-clay">Manage your floor plan and table statuses</p>
        </div>
        <button className="btn-primary px-4 py-2 text-sm flex items-center gap-2"><Plus size={16} /> Add Table</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map(t => (
          <div key={t._id} className="bg-parchment rounded-card p-4 shadow-warm border-t-4" style={{ borderColor: t.status === 'available' ? '#5A7A5C' : t.status === 'reserved' ? '#D85A30' : t.status === 'occupied' ? '#993C1D' : '#B07850' }}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">T{t.tableNumber}</h3>
              <div className="flex gap-1">
                <button className="text-clay hover:text-charcoal"><Settings size={14} /></button>
                <button onClick={() => { if(confirm('Delete table?')) deleteTable.mutate(t._id) }} className="text-clay hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            </div>
            
            <p className="text-xs text-clay flex items-center gap-1 mb-3"><Maximize size={12} /> {t.capacity} seats</p>
            
            <select 
              value={t.status}
              onChange={(e) => updateStatus.mutate({ id: t._id, status: e.target.value })}
              className="w-full text-xs py-1.5 px-2 bg-cream rounded border border-clay/20 font-medium capitalize"
              style={{ color: t.status === 'available' ? '#5A7A5C' : t.status === 'reserved' ? '#D85A30' : t.status === 'occupied' ? '#993C1D' : '#B07850' }}
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        ))}
        
        {/* Add Table Ghost Card */}
        <button className="bg-cream/50 rounded-card p-4 border-2 border-dashed border-clay/20 flex flex-col items-center justify-center gap-2 text-clay hover:text-charcoal hover:border-clay/40 hover:bg-cream min-h-[140px] transition-all">
          <div className="w-10 h-10 rounded-full bg-parchment flex items-center justify-center"><Plus size={20} /></div>
          <span className="text-sm font-medium">Add New Table</span>
        </button>
      </div>
    </div>
  )
}
