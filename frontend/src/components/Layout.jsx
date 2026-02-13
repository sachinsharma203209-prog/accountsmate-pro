import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className="bg-white shadow-sm p-4 flex justify-between">
        <div className="space-x-3">
          <Link to="/" className="font-bold">Shop</Link>
          <Link to="/cart">Cart</Link>
          {user && <Link to="/orders">Orders</Link>}
          {user?.role === 'ADMIN' && <Link to="/admin">Admin</Link>}
        </div>
        <div>
          {user ? (
            <button onClick={logout} className="text-red-600">Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-4"><Outlet /></main>
    </div>
  );
}
