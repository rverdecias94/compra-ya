// src/App.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate } from 'react-router-dom';

import Header from './components/Header';
import HeroSlider from './components/HeroSlider';
import ActionMessage from './components/ActionMessage';
import ProductsPage from './pages/Products';
import CartPage from './pages/CartPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { CartProvider } from './context/CartContext';

const queryClient = new QueryClient();

const ProtectedAdmin = ({ children }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (!token) return <Navigate to="/admin" />;
  return children;
};

const Home = () => (
  <>
    <HeroSlider />
    <ProductsPage />
  </>
);

const AppContent = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      <Header />
      <ActionMessage />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/panel" element={<ProtectedAdmin><AdminDashboard /></ProtectedAdmin>} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </QueryClientProvider>
  );
};

export default App;