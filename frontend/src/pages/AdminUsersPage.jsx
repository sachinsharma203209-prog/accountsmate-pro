import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const load = () => api.get('/admin/users').then((r) => setUsers(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Users</h1>
      {users.map((u) => (
        <div key={u.id} className="bg-white border rounded p-3 mb-2 flex justify-between items-center">
          <span>{u.email}</span>
          <select value={u.role} onChange={(e) => api.patch(`/admin/users/${u.id}/role`, { role: e.target.value }).then(load)}>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      ))}
    </div>
  );
}
