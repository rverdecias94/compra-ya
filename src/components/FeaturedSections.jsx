import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import ProductCard from './ProductCard';

export const BestSellersSection = () => {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['bestsellers'],
    queryFn: async () => {
      // Usar la consulta SQL que sabemos que funciona
      const { data, error } = await supabase
        .rpc('get_best_sellers'); // Opción 1: Usar una función RPC

      console.log(data)
      if (error) throw error;

      // Si usamos RPC, procesamos los datos
      if (data) {
        return data.map(item => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          image_url: item.image_url,
          count: item.sales_count,
          sale_price: item.sale_price ? parseFloat(item.sale_price) : null,
          stock: item.stock,
          is_active: item.is_active,
          agotado: item.agotado,
          description: item.description,
          label: item.label,
          colors: item.colors,
        }));
      }

      return [];
    }
  });

  // 🌀 Cargando
  if (isLoading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center">🔥 Productos Más Vendidos</h2>
        <div className="text-center">Cargando productos más vendidos...</div>
      </section>
    );
  }

  // ❌ Error
  if (error) {
    console.error('Error:', error);
    return (
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center">🔥 Productos Más Vendidos</h2>
        <div className="text-center text-red-500">
          Error al cargar productos más vendidos
        </div>
      </section>
    );
  }

  // ℹ️ Sin productos
  if (!products || products.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6 text-center">🔥 Productos Más Vendidos</h2>
        <div className="text-center text-gray-500">
          No hay productos más vendidos disponibles
        </div>
      </section>
    );
  }

  // ✅ Renderizado final
  return (
    <section className="max-w-6xl mx-auto px-4 py-8 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2 text-orange-600 dark:text-orange-400">
          🔥 Productos Más Vendidos
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300">
          Los favoritos de nuestros clientes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <div key={product.id} className="relative">
            <ProductCard product={product} />
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              ¡Popular!
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const FeaturedSections = () => (
  <div className="space-y-12">
    <BestSellersSection />
  </div>
);