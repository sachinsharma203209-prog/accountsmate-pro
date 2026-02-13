import { useEffect, useState } from 'react';
import api from '../services/api';

const statuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const load = () => api.get('/orders').then((r) => setOrders(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Orders</h1>
      {orders.map((o) => (
        <div key={o.id} className="bg-white border rounded p-3 mb-2 flex justify-between items-center">
          <span>#{o.id} - ${Number(o.totalAmount).toFixed(2)} - {o.orderStatus}</span>
          <select value={o.orderStatus} onChange={(e) => api.put(`/orders/${o.id}/status`, { orderStatus: e.target.value }).then(load)}>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
