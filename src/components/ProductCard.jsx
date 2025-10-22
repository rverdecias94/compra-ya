import React from 'react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem, incItem, decItem, items } = useCart();
  const inCart = items.find(i => i.product_id === product.id);
  const atStockLimit = inCart ? inCart.quantity >= product.stock : false;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 flex flex-col">
      <div className="aspect-square rounded-md overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-3">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-500">Sin imagen</div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{product.name}</h3>
          {!product.is_active || product.agotado ? (
            <span className="px-2 py-0.5 text-xs rounded-md bg-neutral-200 dark:bg-neutral-700">Agotado</span>
          ) : null}
        </div>
        {product.colors?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {product.colors.map((color, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700"
              >
                {color}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">{product.description}</p>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="font-semibold">${Number(product.price).toFixed(2)}</div>
        {inCart ? (
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700"
              onClick={() => decItem(product.id)}
            >
              -
            </button>
            <div className="min-w-[24px] text-center">{inCart.quantity}</div>
            <button
              className="px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
              onClick={() => incItem(product.id)}
              disabled={atStockLimit}
            >
              +
            </button>
          </div>
        ) : (
          <button
            className="px-3 py-1.5 rounded-md bg-green-600 text-white disabled:opacity-50"
            disabled={product.agotado || !product.is_active || product.stock <= 0}
            onClick={() => addItem({
              product_id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
              stock: product.stock
            })}
          >
            Añadir al carrito
          </button>
        )}
      </div>
    </div>
  );
}