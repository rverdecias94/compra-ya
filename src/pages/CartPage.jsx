import React, { useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../config/supabase';

const WHATSAPP_NUMBER = '58582428';

// Municipios de La Habana para entrega a domicilio
const HAVANA_MUNICIPALITIES = [
  'Plaza de la Revolución',
  'Centro Habana',
  'Habana Vieja',
  'Cerro',
  'Diez de Octubre',
  'La Lisa',
  'Marianao',
  'Playa',
  'Boyeros',
  'Arroyo Naranjo',
  'San Miguel del Padrón',
  'Guanabacoa',
  'Regla',
  'Cotorro',
  'Habana del Este',
];

// Conversión de HEX a nombre aproximado en español para WhatsApp
const COLOR_REFERENCES = [
  { name: 'negro', rgb: [0, 0, 0] },
  { name: 'blanco', rgb: [255, 255, 255] },
  { name: 'rojo', rgb: [255, 0, 0] },
  { name: 'verde', rgb: [0, 128, 0] },
  { name: 'azul', rgb: [0, 0, 255] },
  { name: 'amarillo', rgb: [255, 255, 0] },
  { name: 'cian', rgb: [0, 255, 255] },
  { name: 'magenta', rgb: [255, 0, 255] },
  { name: 'naranja', rgb: [255, 165, 0] },
  { name: 'morado', rgb: [128, 0, 128] },
  { name: 'rosa', rgb: [255, 192, 203] },
  { name: 'marrón', rgb: [165, 42, 42] },
  { name: 'gris', rgb: [128, 128, 128] },
  { name: 'gris claro', rgb: [211, 211, 211] },
  { name: 'gris oscuro', rgb: [64, 64, 64] },
];

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return [r, g, b];
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return [r, g, b];
  }
  return null;
}

function hexToColorName(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  let bestName = hex;
  let bestDist = Infinity;
  for (const ref of COLOR_REFERENCES) {
    const [rr, gg, bb] = ref.rgb;
    const d = Math.sqrt((rgb[0] - rr) ** 2 + (rgb[1] - gg) ** 2 + (rgb[2] - bb) ** 2);
    if (d < bestDist) {
      bestDist = d;
      bestName = ref.name;
    }
  }
  return bestName;
}

export default function CartPage() {
  const { items, totalAmount, incItem, decItem, removeItem, clear } = useCart();
  const [shippingMethod, setShippingMethod] = useState('recogida');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [loading, setLoading] = useState(false);

  const cartTotal = useMemo(
    () => Number(totalAmount) + Number(shippingFee || 0),
    [totalAmount, shippingFee]
  );

  const isFormValid = useMemo(() => {
    if (!customerName.trim() || !customerPhone.trim()) return false;
    if (shippingMethod === 'domicilio' && (!deliveryZone.trim() || !customerAddress.trim())) return false;
    return true;
  }, [customerName, customerPhone, deliveryZone, customerAddress, shippingMethod]);

  async function handleCheckout() {
    if (items.length === 0 || !isFormValid) return;

    setLoading(true);
    try {
      const itemsPayload = items.map(i => ({
        product_id: i.product_id,
        name: i.name,
        unit_price: i.price,
        quantity: i.quantity,
        selected_color: i.selected_color || null,
      }));

      // Crear orden en Supabase
      const { data, error } = await supabase.rpc('create_order', {
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_address: shippingMethod === 'domicilio' ? customerAddress : null,
        p_shipping_method: shippingMethod,
        p_delivery_zone: shippingMethod === 'domicilio' ? deliveryZone : null,
        p_shipping_fee: shippingMethod === 'domicilio' ? Number(shippingFee || 0) : 0,
        p_whatsapp_message: null,
        p_whatsapp_url: null,
        p_items: itemsPayload,
      });

      if (error) throw error;
      let orderId = data?.order_id || data?.id || (Array.isArray(data) ? data[0]?.order_id || data[0]?.id : null);

      // Fallback: si no tenemos ID, buscar la última orden por teléfono
      if (!orderId) {
        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id, customer_phone, created_at')
          .eq('customer_phone', customerPhone)
          .order('created_at', { ascending: false })
          .limit(1);
        orderId = recentOrders?.[0]?.id || null;
      }

      if (!orderId) {
        throw new Error('No se pudo obtener el número de orden. Intenta nuevamente.');
      }

      // Generar mensaje WhatsApp (con nombre de color aproximado)
      const msgLines = [];
      msgLines.push('*Pedido - Compra Ya!*');
      msgLines.push('');
      msgLines.push(`🧾 *Referencia del pedido:* ${orderId}`);
      msgLines.push('');
      items.forEach(i => {
        const colorName = i.selected_color ? hexToColorName(i.selected_color) : null;
        const colorTag = colorName ? ` (${colorName})` : '';
        msgLines.push(`• ${i.name}${colorTag} x${i.quantity} = $${(i.quantity * i.price).toFixed(2)}`);
      });
      msgLines.push('');
      msgLines.push(`Subtotal: $${Number(totalAmount).toFixed(2)}`);
      if (shippingMethod === 'domicilio') {
        msgLines.push(`Mensajería: $${Number(shippingFee || 0).toFixed(2)}`);
        msgLines.push(`Zona: ${deliveryZone}`);
        msgLines.push(`Dirección: ${customerAddress}`);
      }
      msgLines.push(`Total: $${cartTotal.toFixed(2)}`);
      msgLines.push('');
      msgLines.push(`Nombre: ${customerName}`);
      msgLines.push(`Teléfono: ${customerPhone}`);

      const text = encodeURIComponent(msgLines.join('\n'));
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

      await supabase
        .from('orders')
        .update({ whatsapp_message: decodeURIComponent(text), whatsapp_url: waUrl })
        .eq('id', orderId);

      window.open(waUrl, '_blank');
      clear();
    } catch (e) {
      alert('Error al crear el pedido: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-semibold">Tu carrito</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-neutral-600 dark:text-neutral-300">No hay productos en el carrito.</p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-6 mt-6">
          <div className="sm:col-span-2 space-y-4">
            {items.map(i => (
              <div key={i.product_id} className="flex items-center justify-between border rounded-md p-3">
                <div className="flex items-center gap-3">
                  {i.image_url ? (
                    <img src={i.image_url} alt={i.name} className="w-16 h-16 rounded-md object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-neutral-200 dark:bg-neutral-800" />
                  )}
                  <div>
                    <div className="font-semibold text-sm">{i.name}</div>
                    <div className="text-xs text-neutral-600 dark:text-neutral-300">${i.price.toFixed(2)}</div>
                    {i.selected_color && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                        <span>Color:</span>
                        <span className="inline-block w-4 h-4 rounded-full border" style={{ backgroundColor: i.selected_color }}></span>
                        <span>{i.selected_color}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-2 py-1 rounded-md border" onClick={() => decItem(i.product_id)}>-</button>
                  <div className="min-w-[24px] text-center">{i.quantity}</div>
                  <button
                    className="px-2 py-1 rounded-md border disabled:opacity-50"
                    onClick={() => incItem(i.product_id)}
                    disabled={i.quantity >= i.stock}
                  >
                    +
                  </button>
                  <button className="px-2 py-1 rounded-md border" onClick={() => removeItem(i.product_id)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border rounded-md p-4">
            <h3 className="font-semibold">Resumen</h3>
            <div className="mt-2 text-sm">Subtotal: ${Number(totalAmount).toFixed(2)}</div>

            <div className="mt-4">
              <label className="text-sm font-medium">Entrega</label>
              <select
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              >
                <option value="recogida">Recogida en tienda</option>
                <option value="domicilio">Entrega a domicilio</option>
              </select>
            </div>

            {shippingMethod === 'domicilio' && (
              <div className="mt-3 space-y-3">
                <select
                  value={deliveryZone}
                  onChange={(e) => setDeliveryZone(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                >
                  <option value="">Selecciona municipio</option>
                  {HAVANA_MUNICIPALITIES.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Dirección exacta"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>
            )}

            <div className="mt-3 text-sm">Total: ${cartTotal.toFixed(2)}</div>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Tu nombre"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
              <input
                type="tel"
                placeholder="Tu teléfono"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </div>

            <button
              className="mt-4 w-full px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50"
              onClick={handleCheckout}
              disabled={loading || items.length === 0 || !isFormValid}
            >
              {loading ? 'Enviando...' : 'Enviar por WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
