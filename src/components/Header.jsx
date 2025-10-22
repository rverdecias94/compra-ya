import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Sun, Moon } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { totalItems } = useCart();
  const [theme, setTheme] = useState('system');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'system';
    setTheme(stored);
  }, []);

  useEffect(() => {
    const isLight = theme === 'light' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    document.documentElement.classList.toggle('light', !!isLight);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur dark:bg-neutral-900/80 border-neutral-200 dark:border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-bold text-lg tracking-tight">
            <img src="/images/logo.png" alt="Compra Ya!" srcset="" className="w-36 h-12" />
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300">
            <Link to="/productos">Productos</Link>
            <Link to="/carrito">Carrito</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Abrir carrito"
            className="relative p-2 rounded-md border border-neutral-200 dark:border-neutral-700"
            onClick={() => navigate('/carrito')}
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 text-xs bg-green-600 text-white rounded-full px-1 min-w-[20px] text-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}