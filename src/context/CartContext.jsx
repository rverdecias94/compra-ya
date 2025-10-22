import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

const CartContext = createContext(null);

const initialState = {
  items: [], // {product_id, name, price, image_url, stock, quantity}
};

function reducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      return action.payload || state;
    }
    case 'ADD': {
      const { item } = action.payload;
      const existing = state.items.find(i => i.product_id === item.product_id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + 1, existing.stock);
        return {
          ...state,
          items: state.items.map(i => i.product_id === item.product_id ? { ...i, quantity: nextQty } : i)
        };
      }
      return { ...state, items: [...state.items, { ...item, quantity: 1 }] };
    }
    case 'INC': {
      const { product_id } = action.payload;
      return {
        ...state,
        items: state.items.map(i => {
          if (i.product_id === product_id) {
            const nextQty = Math.min(i.quantity + 1, i.stock);
            return { ...i, quantity: nextQty };
          }
          return i;
        })
      };
    }
    case 'DEC': {
      const { product_id } = action.payload;
      return {
        ...state,
        items: state.items.flatMap(i => {
          if (i.product_id === product_id) {
            const nextQty = i.quantity - 1;
            if (nextQty <= 0) return [];
            return [{ ...i, quantity: nextQty }];
          }
          return [i];
        })
      };
    }
    case 'REMOVE': {
      const { product_id } = action.payload;
      return { ...state, items: state.items.filter(i => i.product_id !== product_id) };
    }
    case 'CLEAR': {
      return { ...state, items: [] };
    }
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [message, setMessage] = useState(null); // simple action message

  // Init from localStorage
  useEffect(() => {
    const raw = localStorage.getItem('cart');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        dispatch({ type: 'INIT', payload: parsed });
      } catch (e) {
        console.warn('Could not parse cart from localStorage');
      }
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const totalItems = useMemo(() => state.items.reduce((acc, i) => acc + i.quantity, 0), [state.items]);
  const totalAmount = useMemo(() => state.items.reduce((acc, i) => acc + i.quantity * i.price, 0), [state.items]);

  const api = {
    items: state.items,
    totalItems,
    totalAmount,
    addItem: (item) => {
      dispatch({ type: 'ADD', payload: { item } });
      setMessage(`Añadido: ${item.name}`);
    },
    incItem: (product_id) => {
      dispatch({ type: 'INC', payload: { product_id } });
      const p = state.items.find(i => i.product_id === product_id);
      setMessage(`Cantidad aumentada: ${p?.name ?? ''}`);
    },
    decItem: (product_id) => {
      const p = state.items.find(i => i.product_id === product_id);
      dispatch({ type: 'DEC', payload: { product_id } });
      setMessage(`Cantidad reducida: ${p?.name ?? ''}`);
    },
    removeItem: (product_id) => {
      const p = state.items.find(i => i.product_id === product_id);
      dispatch({ type: 'REMOVE', payload: { product_id } });
      setMessage(`Eliminado del carrito: ${p?.name ?? ''}`);
    },
    clear: () => {
      dispatch({ type: 'CLEAR' });
      setMessage('Carrito limpiado');
    },
    message,
    clearMessage: () => setMessage(null),
  };

  return (
    <CartContext.Provider value={api}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}