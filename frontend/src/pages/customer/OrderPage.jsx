import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { ChevronLeft, Minus, Plus, Trash2, Loader2, MapPin } from 'lucide-react'
import { addItem, removeItem, clearCart, selectCartItems, selectCartTotal, selectRestaurantName } from '@/store/slices/cartSlice'
import { useMutation } from '@tanstack/react-query'
import api from '@/api/axiosClient'
import toast from 'react-hot-toast'

export default function OrderPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)
  const total = useSelector(selectCartTotal)
  const restaurantName = useSelector(selectRestaurantName)

  const deliveryFee = 30
  const taxes = Math.round(total * 0.05 * 100) / 100
  const grandTotal = total + deliveryFee + taxes

  const placeMutation = useMutation({
    mutationFn: (data) => api.post('/orders', data),
    onSuccess: (res) => {
      dispatch(clearCart())
      toast.success('Order placed! 🎉')
      navigate(`/track/${res.data.data?.order?._id || 'success'}`)
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Order failed'),
  })

  const handlePlaceOrder = () => {
    placeMutation.mutate({
      restaurantId: id,
      items: cartItems.map(i => ({ menuItemId: i._id, quantity: i.quantity })),
      deliveryAddress: { lat: 12.97, lng: 77.59, label: 'Home — 123 Main Street' },
      paymentMethod: 'razorpay',
    })
  }

  if (!cartItems.length) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center"><p className="text-clay mb-4">Your cart is empty</p><Link to="/home" className="btn-primary px-6 py-2.5 text-sm">Browse Restaurants</Link></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-clay mb-4"><ChevronLeft size={16} /> Back</button>
        <h1 className="font-display text-2xl font-bold mb-5">Your Order</h1>

        <div className="bg-parchment rounded-card p-5 shadow-warm mb-5">
          <p className="text-sm font-medium mb-4">{restaurantName || 'Restaurant'}</p>
          <div className="space-y-3">
            {cartItems.map(item => (
              <div key={item._id} className="flex items-center gap-3">
                <div className="flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-clay">₹{item.price} each</p></div>
                <div className="flex items-center gap-2 bg-cream rounded-button px-1.5">
                  <button onClick={() => dispatch(removeItem(item._id))} className="p-1 text-clay"><Minus size={12} /></button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => dispatch(addItem({ item, restaurantId: id }))} className="p-1 text-flame"><Plus size={12} /></button>
                </div>
                <span className="text-sm font-mono w-16 text-right">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-parchment rounded-card p-5 shadow-warm mb-5">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2"><MapPin size={14} className="text-flame" /> Delivery Address</h3>
          <p className="text-sm text-clay">Home — 123 Main Street, Bangalore</p>
        </div>

        <div className="bg-parchment rounded-card p-5 shadow-warm mb-6">
          <h3 className="text-sm font-medium mb-3">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-clay">Subtotal</span><span>₹{total}</span></div>
            <div className="flex justify-between"><span className="text-clay">Delivery Fee</span><span>₹{deliveryFee}</span></div>
            <div className="flex justify-between"><span className="text-clay">Taxes (5% GST)</span><span>₹{taxes}</span></div>
            <div className="flex justify-between pt-2 border-t border-clay/10 font-bold"><span>Total</span><span className="text-ember">₹{grandTotal}</span></div>
          </div>
        </div>

        <button onClick={handlePlaceOrder} disabled={placeMutation.isPending}
          className="btn-primary w-full py-4 text-sm flex items-center justify-center gap-2">
          {placeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : `Pay ₹${grandTotal}`}
        </button>
      </div>
    </div>
  )
}
