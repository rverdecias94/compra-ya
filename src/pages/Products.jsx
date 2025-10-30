import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import ProductCard from '../components/ProductCard';
import { FeaturedSections } from '../components/FeaturedSections';


export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priceOrder, setPriceOrder] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ['products', page, categoryId, search, priceOrder],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      let query = supabase.from('products').select('*', { count: 'exact' }).eq('is_active', true);
      if (categoryId) query = query.eq('category_id', categoryId);
      if (search.trim().length >= 2) {
        const s = search.trim();
        query = query.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
      }
      if (priceOrder === 'asc') query = query.order('price', { ascending: true });
      else if (priceOrder === 'desc') query = query.order('price', { ascending: false });
      else query = query.order('name', { ascending: true });
      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      return { data, count };
    }
  });

  const products = result?.data || [];
  const total = result?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <FeaturedSections />
      <section id="productos" className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Todos los Productos</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Explora y filtra por nombre, categoría y precio.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
              className="px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
            <select
              value={categoryId}
              onChange={(e) => { setPage(1); setCategoryId(e.target.value); }}
              className="px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            >
              <option value="">Todas</option>
              {(categories || []).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={priceOrder}
              onChange={(e) => { setPage(1); setPriceOrder(e.target.value); }}
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
          <>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center text-neutral-600 dark:text-neutral-300">No hay resultados</div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                className="px-3 py-1 rounded-md border disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>
              <div className="text-sm">Página {page} de {totalPages}</div>
              <button
                className="px-3 py-1 rounded-md border disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}