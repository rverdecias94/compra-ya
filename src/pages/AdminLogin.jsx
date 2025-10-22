import React, { useState } from 'react';
import { supabase } from '../config/supabase';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase.rpc('verify_admin_login', {
        p_username: username,
        p_password: password,
      });
      if (error) throw error;
      const session = Array.isArray(data) ? data[0] : data;
      if (!session?.token) {
        setErrorMsg('Usuario o contraseña incorrectos');
        return;
      }
      localStorage.setItem('admin_token', session.token);
      navigate('/admin/panel');
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-md mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold">Acceso administrador</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        />
        {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
        <button
          type="submit"
          className="w-full px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50"
          disabled={loading}
        >
          Entrar
        </button>
      </form>
    </section>
  );
}