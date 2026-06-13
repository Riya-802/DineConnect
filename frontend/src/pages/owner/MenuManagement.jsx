import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react'
import api from '@/api/axiosClient'
import toast from 'react-hot-toast'

export default function MenuManagement() {
  const queryClient = useQueryClient()
  const { data: restaurant } = useQuery({ queryKey: ['owner-restaurant'], queryFn: () => api.get(`/restaurants?owner=me`).then(r => r.data.data?.[0] || null) })
  
  const { data: menu = [], isLoading } = useQuery({
    queryKey: ['owner-menu'],
    queryFn: () => restaurant ? api.get(`/restaurants/${restaurant._id}/menu`).then(r => r.data.data || []) : [],
    enabled: !!restaurant,
  })

  const toggleAvailability = useMutation({
    mutationFn: (id) => api.patch(`/menu/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries(['owner-menu'])
  })

  const deleteItem = useMutation({
    mutationFn: (id) => api.delete(`/menu/${id}`),
    onSuccess: () => { toast.success('Item deleted'); queryClient.invalidateQueries(['owner-menu']) }
  })

  if (isLoading) return <div className="p-8">Loading menu...</div>

  const categories = [...new Set(menu.map(m => m.category))]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Menu Management</h1>
          <p className="text-sm text-clay">Manage your dishes and availability</p>
        </div>
        <button className="btn-primary px-4 py-2 text-sm flex items-center gap-2"><Plus size={16} /> Add Item</button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 bg-parchment rounded-card border-2 border-dashed border-clay/20">
          <p className="text-clay mb-4">No menu items yet. Add your first dish!</p>
          <button className="btn-secondary px-6 py-2.5 text-sm">Add Item</button>
        </div>
      ) : categories.map(cat => (
        <div key={cat} className="mb-8">
          <h2 className="font-display text-lg font-bold mb-4 px-2">{cat}</h2>
          <div className="bg-parchment rounded-card shadow-warm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-cream/50 text-clay text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium text-center">Available</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clay/10">
                {menu.filter(m => m.category === cat).map(item => (
                  <tr key={item._id} className={!item.isAvailable ? 'opacity-60 bg-cream/30' : 'bg-parchment'}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-cream flex items-center justify-center shrink-0 overflow-hidden">
                        {item.images?.[0] ? <img src={item.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-clay/50" />}
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">{item.name}</p>
                        <p className="text-xs text-clay line-clamp-1 w-48">{item.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono">₹{item.price}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-xs ${item.isVeg ? 'text-sage' : 'text-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-sage' : 'bg-red-500'}`} /> {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={item.isAvailable} onChange={() => toggleAvailability.mutate(item._id)} />
                        <div className="w-9 h-5 bg-clay/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sage"></div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-clay hover:bg-cream rounded"><Edit2 size={14} /></button>
                        <button onClick={() => { if(confirm('Delete this item?')) deleteItem.mutate(item._id) }} className="p-1.5 text-clay hover:text-red-500 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
