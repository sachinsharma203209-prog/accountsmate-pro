import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setStats(r.data)); }, []);
  if (!stats) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 border rounded">Sales: ${stats.totalSales.toFixed(2)}</div>
        <div className="bg-white p-4 border rounded">Orders: {stats.totalOrders}</div>
        <div className="bg-white p-4 border rounded">Users: {stats.totalUsers}</div>
        <div className="bg-white p-4 border rounded">Products: {stats.totalProducts}</div>
      </div>
      <div className="space-x-3">
        <Link to="/admin/products" className="text-blue-600">Manage Products</Link>
        <Link to="/admin/categories" className="text-blue-600">Manage Categories</Link>
        <Link to="/admin/orders" className="text-blue-600">Manage Orders</Link>
        <Link to="/admin/users" className="text-blue-600">Manage Users</Link>
      </div>
    </div>
  );
}
