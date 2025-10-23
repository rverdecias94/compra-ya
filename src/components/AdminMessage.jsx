import React from 'react';
import { useAdminMessage } from '../context/AdminMessageContext';

export default function AdminMessage() {
  const { message, clearMessage } = useAdminMessage();

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
      <span>{message}</span>
      <button 
        onClick={clearMessage}
        className="ml-2 text-white hover:text-green-200 font-bold"
      >
        ×
      </button>
    </div>
  );
}