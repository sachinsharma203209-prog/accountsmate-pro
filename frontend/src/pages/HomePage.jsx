import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', categoryId: '' });

  useEffect(() => { api.get('/categories').then((r) => setCategories(r.data)); }, []);
  useEffect(() => {
    api.get('/products', { params: filters }).then((r) => setProducts(r.data));
  }, [filters]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Products</h1>
      <div className="flex gap-2 mb-4">
        <input placeholder="Search" className="border p-2" onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} />
        <select className="border p-2" onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {products.map((p) => (
          <Link to={`/products/${p.id}`} key={p.id} className="bg-white p-4 rounded border">
            <img src={p.imageUrl || 'https://placehold.co/300x200'} alt={p.name} className="mb-2 h-40 w-full object-cover" />
            <h2 className="font-semibold">{p.name}</h2>
            <p>${Number(p.price).toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
