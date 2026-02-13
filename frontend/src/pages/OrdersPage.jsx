import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get('/orders/my').then((r) => setOrders(r.data)); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {orders.map((o) => (
        <Link key={o.id} to={`/orders/${o.id}`} className="block bg-white rounded border p-3 mb-2">
          Order #{o.id} - ${Number(o.totalAmount).toFixed(2)} - {o.paymentStatus} / {o.orderStatus}
        </Link>
      ))}
    </div>
  );
}
