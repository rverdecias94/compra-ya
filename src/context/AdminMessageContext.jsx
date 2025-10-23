import React, { createContext, useContext, useReducer } from 'react';

const AdminMessageContext = createContext();

const initialState = {
  message: null
};

function adminMessageReducer(state, action) {
  switch (action.type) {
    case 'SET_MESSAGE':
      return { ...state, message: action.payload };
    case 'CLEAR_MESSAGE':
      return { ...state, message: null };
    default:
      return state;
  }
}

export function AdminMessageProvider({ children }) {
  const [state, dispatch] = useReducer(adminMessageReducer, initialState);

  const setMessage = (message) => {
    dispatch({ type: 'SET_MESSAGE', payload: message });
    // Auto-clear message after 3 seconds
    setTimeout(() => {
      dispatch({ type: 'CLEAR_MESSAGE' });
    }, 3000);
  };

  const clearMessage = () => {
    dispatch({ type: 'CLEAR_MESSAGE' });
  };

  return (
    <AdminMessageContext.Provider value={{
      message: state.message,
      setMessage,
      clearMessage
    }}>
      {children}
    </AdminMessageContext.Provider>
  );
}

export function useAdminMessage() {
  const context = useContext(AdminMessageContext);
  if (!context) {
    throw new Error('useAdminMessage must be used within an AdminMessageProvider');
  }
  return context;
}