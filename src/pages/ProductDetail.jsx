import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, incItem, decItem, items } = useCart();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);

  const inCart = useMemo(() => items.find(i => i.product_id === id), [items, id]);
  const atStockLimit = useMemo(() => (inCart ? inCart.quantity >= (product?.stock || 0) : false), [inCart, product]);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setProduct(data);
        setSelectedColor(data?.colors?.[0] || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  useEffect(() => {
    async function loadRelated() {
      if (!product) return;
      // Primero intentamos por la misma categoría
      const { data: sameCat } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('category_id', product.category_id)
        .neq('id', product.id)
        .limit(8);
      if (sameCat && sameCat.length > 0) {
        setRelated(sameCat);
        return;
      }
      // Si no hay productos de la misma categoría, mostramos 3 productos cualquiera
      const { data: fallback } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(3);
      setRelated(fallback || []);
    }
    loadRelated();
  }, [product]);

  function handleAddToCart() {
    if (!product) return;
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
      selected_color: selectedColor || null,
    });
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <button className="text-sm text-neutral-600 dark:text-neutral-300 mb-4" onClick={() => navigate(-1)}>
        ← Volver
      </button>

      {loading ? (
        <div>Cargando producto...</div>
      ) : !product ? (
        <div>No se encontró el producto</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-neutral-500">Sin imagen</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{product.description}</p>

            <div className="mt-3 text-sm">{product.stock > 0 ? `Stock disponible: ${product.stock}` : 'Agotado'}</div>
            <div className="mt-2 font-semibold text-lg">${Number(product.price).toFixed(2)} USD</div>

            {product.colors?.length > 0 && (
              <div className="mt-4">
                <div className="text-sm mb-2">Colores disponibles</div>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color, idx) => (
                    <button
                      type="button"
                      key={idx}
                      aria-label={`color ${color}`}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border ${selectedColor === color ? 'ring-2 ring-green-600 border-green-600' : 'border-neutral-300 dark:border-neutral-700'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              {inCart ? (
                <>
                  <button
                    className="px-3 py-2 rounded-md border"
                    onClick={() => decItem(product.id)}
                  >
                    -
                  </button>
                  <div className="min-w-[28px] text-center">{inCart.quantity}</div>
                  <button
                    className="px-3 py-2 rounded-md border disabled:opacity-50"
                    onClick={() => incItem(product.id)}
                    disabled={atStockLimit}
                  >
                    +
                  </button>
                  <span className="text-sm text-green-700">Agregado al carrito</span>
                </>
              ) : (
                <button
                  className="px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50"
                  disabled={product.agotado || !product.is_active || product.stock <= 0}
                  onClick={handleAddToCart}
                >
                  Añadir al carrito
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Más de esta categoría</h2>
          <Link to="/productos" className="text-sm text-green-700">Ver todos</Link>
        </div>
        {related.length === 0 ? (
          <div className="text-neutral-600 dark:text-neutral-300">Sin productos relacionados</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}