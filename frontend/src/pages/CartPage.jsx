import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import api from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

export default function CartPage() {
  const [cart, setCart] = useState(null);

  const load = () => api.get('/cart').then((r) => setCart(r.data));
  useEffect(() => { load(); }, []);

  const update = (itemId, quantity) => api.put(`/cart/items/${itemId}`, { quantity }).then(load);
  const remove = (itemId) => api.delete(`/cart/items/${itemId}`).then(load);

  const checkout = async () => {
    const stripe = await stripePromise;
    const { data } = await api.post('/checkout/session');
    if (data.id) await stripe.redirectToCheckout({ sessionId: data.id });
  };

  if (!cart) return <p>Loading...</p>;
  const total = cart.items.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cart</h1>
      <div className="space-y-3">
        {cart.items.map((item) => (
          <div className="bg-white p-3 border rounded flex justify-between" key={item.id}>
            <div>{item.product.name} (${Number(item.product.price).toFixed(2)})</div>
            <div className="space-x-2">
              <input type="number" min="1" value={item.quantity} onChange={(e) => update(item.id, Number(e.target.value))} className="w-16 border" />
              <button onClick={() => remove(item.id)} className="text-red-600">Remove</button>
            </div>
          </div>
        ))}
      </div>
      <p className="font-bold mt-4">Total: ${total.toFixed(2)}</p>
      <button onClick={checkout} className="bg-green-600 text-white px-4 py-2 rounded mt-3">Checkout</button>
    </div>
  );
}
