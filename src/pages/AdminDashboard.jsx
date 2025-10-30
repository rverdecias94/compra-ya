
import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../config/supabase';
import ImageUpload from '../components/ImageUpload';
import { AdminMessageProvider, useAdminMessage } from '../context/AdminMessageContext';
import AdminMessage from '../components/AdminMessage';

// Helper para obtener el token de admin desde localStorage
const getAdminToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);

// --- Componente Modal (ACTUALIZADO) ---
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      {/* Contenedor del Modal: más ancho, altura máxima y layout de flex-col */}
      <div
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-3xl flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Encabezado Fijo */}
        <div className="flex justify-between items-center p-6 border-b dark:border-neutral-700">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Formulario de Producto (COMPLETO CON TODAS LAS FUNCIONALIDADES) ---
function ProductForm({ onSaved, productToEdit }) {
  const [name, setName] = useState(productToEdit?.name || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [specs, setSpecs] = useState(productToEdit?.specs || []);
  const [price, setPrice] = useState(productToEdit?.price || '');
  const [salePrice, setSalePrice] = useState(productToEdit?.sale_price || '');
  const [stock, setStock] = useState(productToEdit?.stock || 0);
  const [categoryId, setCategoryId] = useState(productToEdit?.category_id || '');
  const [colors, setColors] = useState(productToEdit?.colors || []);
  const [label, setLabel] = useState(productToEdit?.label || '');
  const [isActive, setIsActive] = useState(!!productToEdit?.is_active);
  const [agotado, setAgotado] = useState(!!productToEdit?.agotado);
  const [imageUrl, setImageUrl] = useState(productToEdit?.image_url || '');
  const [currentColor, setCurrentColor] = useState('#000000');
  const { setMessage } = useAdminMessage();

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setDescription(productToEdit.description || '');
      setSpecs(productToEdit.specs || []);
      setPrice(productToEdit.price || '');
      setSalePrice(productToEdit.sale_price || '');
      setStock(productToEdit.stock || 0);
      setCategoryId(productToEdit.category_id || '');
      setColors(productToEdit.colors || []);
      setLabel(productToEdit.label || '');
      setIsActive(!!productToEdit.is_active);
      setAgotado(!!productToEdit.agotado);
      setImageUrl(productToEdit.image_url || '');
    }
  }, [productToEdit]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (error) throw error;
      return data;
    }
  });

  // Funciones para el color picker
  const addColor = () => {
    if (currentColor && !colors.includes(currentColor)) {
      setColors([...colors, currentColor]);
    }
  };

  const removeColor = (colorToRemove) => {
    setColors(colors.filter(c => c !== colorToRemove));
  };

  async function handleSave() {
    const token = getAdminToken();
    const { data, error } = await supabase.rpc('admin_upsert_product', {
      p_token: token,
      p_id: productToEdit?.id || null,
      p_name: name,
      p_description: description,
      p_price: Number(price),
      p_sale_price: salePrice ? Number(salePrice) : null,
      p_stock: Number(stock),
      p_category_id: categoryId || null,
      p_colors: colors,
      p_label: label || null,
      p_is_active: isActive,
      p_agotado: agotado,
      p_image_url: imageUrl || null,
      p_specs: specs
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage(productToEdit ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
      onSaved?.(data);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del producto"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="3"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descripción del producto"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Especificaciones</label>
        <textarea
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows="6"
          value={specs.join('\n')}
          onChange={e => setSpecs(e.target.value.split('\n'))}
          placeholder="Especificaciones del producto (una por línea)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Precio</label>
          <input
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Precio rebajado (opcional)</label>
          <input
            type="number"
            step="0.01"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={salePrice}
            onChange={e => setSalePrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      {salePrice && (
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md">
          <span className="text-sm text-gray-600">Vista previa:</span>
          <span className="line-through text-red-600">${Number(price).toLocaleString()}</span>
          <span className="font-semibold text-green-600">${Number(salePrice).toLocaleString()}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cantidad</label>
          <input
            type="number"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={stock}
            onChange={e => setStock(e.target.value)}
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
          >
            <option value="">Sin categoría</option>
            {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Imagen del producto */}
      <div>
        <label className="block text-sm font-medium mb-1">Imagen del producto</label>
        <ImageUpload
          value={imageUrl}
          onUploaded={setImageUrl}
        />
      </div>

      {/* Color picker mejorado */}
      <div>
        <label className="block text-sm font-medium mb-2">Colores disponibles</label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={e => setCurrentColor(e.target.value)}
              className="w-12 h-10 border rounded cursor-pointer"
            />
            <input
              type="text"
              value={currentColor}
              onChange={e => setCurrentColor(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="#000000"
            />
            <button
              type="button"
              onClick={addColor}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Agregar
            </button>
          </div>

          {colors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {colors.map((color, index) => (
                <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs px-1">{color}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(color)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Etiqueta (opcional)</label>
        <input
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Ej: Nuevo, Oferta, Destacado"
        />
        {label === 'Nueva oferta' && (
          <div className="mt-1 text-xs text-blue-600">Esta etiqueta se mostrará en azul</div>
        )}
      </div>

      {/* Checkboxes */}
      <div className="space-y-2">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Producto activo</span>
        </label>

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={agotado}
            onChange={e => setAgotado(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Marcar como agotado</span>
        </label>
      </div>

      <div className="pt-4 border-t">
        <button
          className="w-full px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 font-medium"
          onClick={handleSave}
        >
          {productToEdit ? 'Actualizar producto' : 'Crear producto'}
        </button>
      </div>
    </div>
  );
}

// --- Panel de Productos (Sin cambios en la lógica) ---
function ProductsPanel() {
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { setMessage } = useAdminMessage();

  const loadPage = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAdminToken();
      if (!token) throw new Error('No admin token');
      const { data: list, error: err1 } = await supabase.rpc('admin_list_products_page', { p_token: token, p_page: page, p_page_size: pageSize });
      if (err1) throw err1;
      const { data: cnt, error: err2 } = await supabase.rpc('admin_count_products', { p_token: token });
      if (err2) throw err2;
      setProducts(list || []);
      setTotal(Number(cnt || 0));
    } catch (e) {
      console.error(e);
      setError('Error cargando productos paginados (RPC)');
      setMessage('Error cargando productos paginados (RPC)');
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPage(); }, [page]);

  function handleCreate() { setSelectedProduct(null); setIsModalOpen(true); }
  function handleEdit(p) { setSelectedProduct(p); setIsModalOpen(true); }
  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    const { error: delErr } = await supabase.rpc('admin_delete_product', { p_token: getAdminToken(), p_id: id });
    if (delErr) {
      setError(delErr.message);
      setMessage(`Error: ${delErr.message}`);
    } else {
      setMessage('Producto eliminado exitosamente');
      loadPage();
    }
  }
  function onFormSaved() { setIsModalOpen(false); loadPage(); }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Listado de productos</h3>
        <div className="flex items-center gap-2">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="px-3 py-1.5 rounded-md bg-green-600 text-white" onClick={handleCreate}>+ Crear producto</button>
        </div>
      </div>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Nombre</th>
                <th className="p-2">Precio</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Etiqueta</th>
                <th className="p-2">Cantidad</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">
                    {p.sale_price ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-red-600">${Number(p.price).toLocaleString()}</span>
                        <span className="font-semibold">${Number(p.sale_price).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span>${Number(p.price).toLocaleString()}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {p.agotado ? <span className="text-red-600">Agotado</span> : <span className="text-green-600">Activo</span>}
                  </td>
                  <td className="p-2">
                    {p.label === 'Nueva oferta' ? (
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">Nueva oferta</span>
                    ) : p.label ? (
                      <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700">{p.label}</span>
                    ) : (
                      <span className="text-neutral-400 flex justify-center">-</span>
                    )}
                  </td>
                  <td className="p-2">{p.stock}</td>
                  <td className="p-2 text-right space-x-2">
                    <div className="flex justify-start gap-2">
                      <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEdit(p)}>Editar</button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(p.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td className="p-2" colSpan="6">Sin productos</td></tr>
              )}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button className="px-3 py-1 rounded-md border disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>← Anterior</button>
            <div className="text-sm">Página {page} de {totalPages}</div>
            <button className="px-3 py-1 rounded-md border disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente →</button>
          </div>
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedProduct ? 'Editar producto' : 'Crear producto'}>
            <ProductForm onSaved={onFormSaved} productToEdit={selectedProduct} />
          </Modal>
        </>
      )}
    </div>
  );
}

// --- Formulario de Categoría (Sin cambios) ---
function CategoryForm({ onSaved, categoryToEdit }) {
  const [name, setName] = useState('');
  const { setMessage } = useAdminMessage();

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
    } else {
      setName('');
    }
  }, [categoryToEdit]);

  async function handleSave() {
    const { data, error } = await supabase.rpc('admin_upsert_category', {
      p_token: getAdminToken(),
      p_id: categoryToEdit?.id || null,
      p_name: name,
    });
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Categoría guardada exitosamente');
      onSaved?.(data);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nombre de categoría</label>
        <input className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Nombre de categoría" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <button className="px-4 py-2 rounded-md bg-green-600 text-white" onClick={handleSave}>
        {categoryToEdit ? 'Actualizar Categoría' : 'Guardar Categoría'}
      </button>
    </div>
  );
}

// --- Panel de Categorías (Sin cambios en la lógica) ---
function CategoriesPanel() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { setMessage } = useAdminMessage();

  async function loadCategories() {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) setMessage(`Error: ${error.message}`);
    else setCategories(data || []);
    setLoading(false);
  }

  useEffect(() => { loadCategories(); }, []);

  function handleCreate() {
    setSelectedCategory(null);
    setIsModalOpen(true);
  }

  function handleEdit(category) {
    setSelectedCategory(category);
    setIsModalOpen(true);
  }

  async function handleDelete(categoryId) {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) return;

    const { error } = await supabase.rpc('admin_delete_category', {
      p_token: getAdminToken(),
      p_id: categoryId
    });

    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Categoría eliminada exitosamente');
      loadCategories();
    }
  }

  function onFormSaved() {
    setIsModalOpen(false);
    loadCategories();
  }

  if (loading) return 'Cargando categorías...';

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="px-4 py-2 rounded-md bg-green-600 text-white" onClick={handleCreate}>
          + Crear Categoría
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
            {categories.map(c => (
              <tr key={c.id}>
                <td className="px-6 py-4 whitespace-nowrap">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEdit(c)}>Editar</button>
                  <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 && <div className="text-center py-4">No hay categorías</div>}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCategory ? 'Editar Categoría' : 'Crear Categoría'}
      >
        <CategoryForm onSaved={onFormSaved} categoryToEdit={selectedCategory} />
      </Modal>
    </div>
  );
}


// --- Panel de Órdenes (Sin cambios en la lógica) ---
// --- Panel de Órdenes (ACTUALIZADO) ---
function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setMessage } = useAdminMessage();

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_orders', {
        p_token: getAdminToken(),
        p_limit: 200
      });
      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      setMessage(`Error: ${e.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(orderId, status) {
    const { error } = await supabase.rpc('admin_update_order_status', {
      p_token: getAdminToken(),
      p_order_id: orderId,
      p_status: status
    });
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage(`Estado actualizado a: ${status}`);
      load();
    }
  }

  async function deleteOrder(orderId) {
    if (!window.confirm('¿Eliminar esta orden? Esta acción no se puede deshacer.')) return;
    const { error } = await supabase.rpc('admin_delete_order', {
      p_token: getAdminToken(),
      p_order_id: orderId,
    });
    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Orden eliminada exitosamente');
      load();
    }
  }

  // Función auxiliar para obtener clases de color según el estado
  const getStatusClasses = (status, currentStatus, isButton = false) => {
    const baseClasses = isButton
      ? 'px-2 py-1 border rounded-md transition-colors duration-200'
      : 'border rounded-md p-3';

    if (status === currentStatus) {
      // Estilos cuando el estado coincide con el estado actual de la orden
      switch (status) {
        case 'recibido':
          return isButton
            ? `${baseClasses} bg-blue-600 text-white border-blue-600`
            : `${baseClasses} border-blue-600 bg-blue-50 dark:bg-blue-900/20`;
        case 'procesado':
          return isButton
            ? `${baseClasses} bg-yellow-600 text-white border-yellow-600`
            : `${baseClasses} border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20`;
        case 'entregado':
          return isButton
            ? `${baseClasses} bg-green-600 text-white border-green-600`
            : `${baseClasses} border-green-600 bg-green-50 dark:bg-green-900/20`;
        case 'cancelado':
          return isButton
            ? `${baseClasses} bg-red-600 text-white border-red-600`
            : `${baseClasses} border-red-600 bg-red-50 dark:bg-red-900/20`;
        default:
          return baseClasses;
      }
    } else {
      // Estilos para botones no activos (solo para botones)
      if (isButton) {
        return `${baseClasses} bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700`;
      }
      return baseClasses;
    }
  };

  return (
    <div>
      {loading ? 'Cargando...' : (
        <div className="space-y-3">
          {orders.map(o => {
            return (
              <div key={o.id} className={getStatusClasses(o.status, o.status, false)}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Pedido {o.id.slice(0, 8)} • {new Date(o.created_at).toLocaleString()}</div>
                    <div className="text-xs">Cliente: {o.customer_name || '—'} | Tel: {o.customer_phone || '—'}</div>
                    <div className="text-xs">Total: ${Number(o.total_amount).toFixed(2)} • Estado: <span className="font-medium">{o.status}</span></div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                    {['recibido', 'procesado', 'entregado', 'cancelado'].map(status => (
                      <button
                        key={status}
                        className={`${getStatusClasses(status, o.status, true)} text-xs whitespace-nowrap flex-shrink-0`}
                        onClick={() => updateStatus(o.id, status)}
                      >
                        {status}
                      </button>
                    ))}
                    <button
                      className="px-2 py-1 border border-red-300 dark:border-red-700 rounded-md text-red-600 dark:text-red-400 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 text-xs whitespace-nowrap flex-shrink-0"
                      onClick={() => deleteOrder(o.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && <div className="text-sm text-neutral-600 dark:text-neutral-300">No hay órdenes</div>}
        </div>
      )}
    </div>
  );
}

function AdminDashboardContent() {
  const [tab, setTab] = useState('productos');
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold">Panel de administración</h2>
      <div className="mt-4 flex items-center gap-3 border-b dark:border-neutral-700">
        {['productos', 'categorias', 'ordenes'].map(t => (
          <button
            key={t}
            className={`capitalize px-3 py-2 -mb-px ${tab === t ? 'border-b-2 border-green-600 text-green-600' : 'text-neutral-500'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 'productos' && <ProductsPanel />}
        {tab === 'categorias' && <CategoriesPanel />}
        {tab === 'ordenes' && <OrdersPanel />}
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  return (
    <AdminMessageProvider>
      <AdminMessage />
      <AdminDashboardContent />
    </AdminMessageProvider>
  );
}