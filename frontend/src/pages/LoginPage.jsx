import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    if (isRegister) await register(form.name, form.email, form.password);
    else await login(form.email, form.password);
    navigate(location.state?.from || '/');
  };

  return (
    <form onSubmit={submit} className="max-w-md mx-auto bg-white rounded border p-6 space-y-3">
      <h1 className="font-bold text-xl">{isRegister ? 'Register' : 'Login'}</h1>
      {isRegister && <input className="w-full border p-2" placeholder="Name" onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />}
      <input className="w-full border p-2" placeholder="Email" onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      <input type="password" className="w-full border p-2" placeholder="Password" onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
      <button className="w-full bg-black text-white py-2">Submit</button>
      <button type="button" onClick={() => setIsRegister((v) => !v)} className="text-blue-600">
        {isRegister ? 'Have an account? Login' : 'Need account? Register'}
      </button>
    </form>
  );
}
