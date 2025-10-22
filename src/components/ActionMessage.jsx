import React, { useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function ActionMessage() {
  const { message, clearMessage } = useCart();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => clearMessage(), 2000);
    return () => clearTimeout(t);
  }, [message, clearMessage]);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="px-4 py-2 rounded-md bg-green-600 text-white shadow-md">
        {message}
      </div>
    </div>
  );
}