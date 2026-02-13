import { useEffect, useState } from 'react';
import api from '../services/api';

const initial = { name: '', description: '', price: '', imageUrl: '', stock: 0, categoryId: '' };

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get('/products').then((r) => setProducts(r.data));
  useEffect(() => { load(); api.get('/categories').then((r) => setCategories(r.data)); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await api.put(`/products/${editingId}`, form);
    else await api.post('/products', form);
    setForm(initial); setEditingId(null); load();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Products</h1>
      <form onSubmit={submit} className="grid grid-cols-2 gap-2 bg-white border p-4 rounded mb-4">
        <input className="border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="border p-2" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <textarea className="border p-2 col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="border p-2" placeholder="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        <input className="border p-2" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        <select className="border p-2" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
          <option value="">Category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="bg-black text-white p-2">{editingId ? 'Update' : 'Create'}</button>
      </form>
      {products.map((p) => (
        <div key={p.id} className="bg-white border rounded p-3 mb-2 flex justify-between">
          <span>{p.name}</span>
          <div className="space-x-2">
            <button onClick={() => { setEditingId(p.id); setForm({ ...p, categoryId: p.categoryId }); }} className="text-blue-600">Edit</button>
            <button onClick={() => api.delete(`/products/${p.id}`).then(load)} className="text-red-600">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
