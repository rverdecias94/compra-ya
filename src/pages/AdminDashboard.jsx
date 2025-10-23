
import React, { useEffect, useState } from 'react';
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

// --- Formulario de Producto (ACTUALIZADO CON GRID) ---
function ProductForm({ onSaved, productToEdit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState(0);
  const [agotado, setAgotado] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [colors, setColors] = useState([]); // array de hex ej: ["#34f213"]
  const [categories, setCategories] = useState([]);
  const { setMessage } = useAdminMessage();

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setDescription(productToEdit.description || '');
      setPrice(productToEdit.price || '');
      setCategoryId(productToEdit.category_id || '');
      setImageUrl(productToEdit.image_url || '');
      setStock(productToEdit.stock || 0);
      setAgotado(productToEdit.agotado || false);
      setIsActive(productToEdit.is_active ?? true);
      setColors(Array.isArray(productToEdit.colors) ? productToEdit.colors : []);
    } else {
      setName(''); setDescription(''); setPrice(''); setCategoryId('');
      setImageUrl(''); setStock(0); setAgotado(false); setIsActive(true);
      setColors([]);
    }
  }, [productToEdit]);

  function addColor() {
    setColors(prev => [...prev, '#000000']);
  }
  function updateColor(idx, value) {
    setColors(prev => prev.map((c, i) => i === idx ? value : c));
  }
  function removeColor(idx) {
    setColors(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    const { data, error } = await supabase.rpc('admin_upsert_product', {
      p_token: getAdminToken(),
      p_id: productToEdit?.id || null,
      p_name: name,
      p_description: description,
      p_price: Number(price),
      p_category_id: categoryId || null,
      p_image_url: imageUrl || null,
      p_stock: Number(stock),
      p_agotado: agotado,
      p_is_active: isActive,
      p_colors: colors,
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Producto guardado exitosamente');
      onSaved?.(data);
    }
  }

  // JSX Actualizado con Grid
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Nombre</label>
        <input className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Descripción</label>
        <textarea className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Descripción" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {/* --- Grid de 2 Columnas --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Precio</label>
          <input type="number" className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Categoría</label>
          <select className="mt-1 w-full px-3 py-2 border rounded-md" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">Seleccionar Categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Stock</label>
          <input type="number" className="mt-1 w-full px-3 py-2 border rounded-md" placeholder="Stock" value={stock} onChange={e => setStock(Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Colores</label>
          <div className="mt-1 space-y-2">
            {colors.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="color" value={c} onChange={(e) => updateColor(idx, e.target.value)} />
                <span className="w-6 h-6 rounded-full border" style={{ backgroundColor: c }}></span>
                <button className="text-sm text-red-600" onClick={() => removeColor(idx)}>Quitar</button>
              </div>
            ))}
            <button type="button" className="px-2 py-1 rounded-md border" onClick={addColor}>+ Agregar color</button>
          </div>
        </div>
      </div>
      {/* --- Fin del Grid --- */}

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Imagen</label>
        <ImageUpload value={imageUrl} onUploaded={setImageUrl} />
      </div>

      <div className="flex items-center gap-4 pt-2">
        <label className="flex items-center gap-2"><input type="checkbox" checked={agotado} onChange={e => setAgotado(e.target.checked)} /> Agotado</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Activo</label>
      </div>

      <div className="pt-4">
        <button className="px-4 py-2 rounded-md bg-green-600 text-white" onClick={handleSave}>
          {productToEdit ? 'Actualizar Producto' : 'Guardar Producto'}
        </button>
      </div>
    </div>
  );
}

// --- Panel de Productos (Sin cambios en la lógica) ---
function ProductsPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { setMessage } = useAdminMessage();

  async function loadProducts() {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*, categories(name)').order('name');
    if (error) setMessage(`Error: ${error.message}`);
    else setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  function handleCreate() {
    setSelectedProduct(null);
    setIsModalOpen(true);
  }

  function handleEdit(product) {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }

  async function handleDelete(productId) {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;

    const { error } = await supabase.rpc('admin_delete_product', {
      p_token: getAdminToken(),
      p_id: productId
    });

    if (error) setMessage(`Error: ${error.message}`);
    else {
      setMessage('Producto eliminado exitosamente');
      loadProducts();
    }
  }

  function onFormSaved() {
    setIsModalOpen(false);
    loadProducts();
  }

  if (loading) return 'Cargando productos...';

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button className="px-4 py-2 rounded-md bg-green-600 text-white" onClick={handleCreate}>
          + Crear Producto
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
            {products.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{p.categories?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">${Number(p.price).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap">{p.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {p.is_active ? 'Activo' : 'Inactivo'} {p.agotado ? '(Agotado)' : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button className="text-blue-600 hover:text-blue-900" onClick={() => handleEdit(p)}>Editar</button>
                  <button className="text-red-600 hover:text-red-900" onClick={() => handleDelete(p.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <div className="text-center py-4">No hay productos</div>}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedProduct ? 'Editar Producto' : 'Crear Producto'}
      >
        <ProductForm onSaved={onFormSaved} productToEdit={selectedProduct} />
      </Modal>
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

// --- Dashboard Principal (Sin cambios) ---
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