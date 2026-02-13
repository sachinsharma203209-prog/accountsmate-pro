import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

export default function OrderDetailsPage() {
  const [order, setOrder] = useState(null);
  const { id } = useParams();
  useEffect(() => { api.get(`/orders/${id}`).then((r) => setOrder(r.data)); }, [id]);

  if (!order) return <p>Loading...</p>;
  return (
    <div className="bg-white border p-4 rounded">
      <h1 className="font-bold text-xl">Order #{order.id}</h1>
      <p>Status: {order.paymentStatus} / {order.orderStatus}</p>
      <ul className="list-disc pl-5 mt-3">
        {order.items.map((i) => <li key={i.id}>{i.product.name} x {i.quantity}</li>)}
      </ul>
    </div>
  );
}
