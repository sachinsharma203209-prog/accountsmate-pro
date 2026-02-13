import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const load = () => api.get('/categories').then((r) => setCategories(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Categories</h1>
      <div className="mb-4 space-x-2">
        <input className="border p-2" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="bg-black text-white px-3 py-2" onClick={() => api.post('/categories', { name }).then(() => { setName(''); load(); })}>Create</button>
      </div>
      {categories.map((cat) => (
        <div key={cat.id} className="bg-white border rounded p-3 mb-2 flex justify-between">
          <span>{cat.name}</span>
          <button onClick={() => api.delete(`/categories/${cat.id}`).then(load)} className="text-red-600">Delete</button>
        </div>
      ))}
    </div>
  );
}
