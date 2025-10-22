import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceOrder, setPriceOrder] = useState(''); // '', 'asc', 'desc'

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
      if (error) throw error;
      return data;
    }
  });

  const filtered = useMemo(() => {
    let list = products || [];
    if (search.trim().length >= 2) {
      const s = search.trim().toLowerCase();
      list = list.filter(p => (
        p.name?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s)
      ));
    }
    if (categoryId) {
      list = list.filter(p => p.category_id === categoryId);
    }
    if (priceOrder === 'asc') {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (priceOrder === 'desc') {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    }
    return list;
  }, [products, search, categoryId, priceOrder]);

  return (
    <section id="productos" className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Productos</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">Explora y filtra por nombre, categoría y precio.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          >
            <option value="">Todas</option>
            {(categories || []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={priceOrder}
            onChange={(e) => setPriceOrder(e.target.value)}
            className="px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          >
            <option value="">Precio</option>
            <option value="asc">Menor a mayor</option>
            <option value="desc">Mayor a menor</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6">Cargando productos...</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-neutral-600 dark:text-neutral-300">No hay resultados</div>
          )}
        </div>
      )}
    </section>
  );
}