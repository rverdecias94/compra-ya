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

// Validación y normalización de teléfono cubano (+53 y 8 dígitos)
function isValidCubanPhone(input) { return /^\+53\s?\d{8}$/.test(input.trim()); }
function normalizeCubanPhone(input) {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 8) return `+53 ${digits}`;
  if (digits.startsWith('53') && digits.length === 10) return `+53 ${digits.slice(2)}`;
  return input;
}

export default function CartPage() {
  const { items, totalAmount, incItem, decItem, removeItem, clear } = useCart();
  const [shippingMethod, setShippingMethod] = useState('recogida');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+53');
  const [customerAddress, setCustomerAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [loading, setLoading] = useState(false);

  const cartTotal = useMemo(
    () => Number(totalAmount) + Number(shippingFee || 0),
    [totalAmount, shippingFee]
  );

  const nameValid = useMemo(() => /^[A-Za-zÁÉÍÓÚÑáéíóúÜü\s]{2,}$/.test(customerName.trim()), [customerName]);
  const phoneValid = useMemo(() => isValidCubanPhone(customerPhone), [customerPhone]);
  const isFormValid = useMemo(() => {
    if (!nameValid || !phoneValid) return false;
    if (shippingMethod === 'domicilio' && (!deliveryZone.trim() || !customerAddress.trim())) return false;
    return true;
  }, [nameValid, phoneValid, deliveryZone, customerAddress, shippingMethod]);

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

      // Generar mensaje WhatsApp (sin ID de orden)
      const msgLines = [];
      msgLines.push('*Pedido - Compra Ya!*');
      msgLines.push('');
      items.forEach(i => {
        const colorName = i.selected_color ? hexToColorName(i.selected_color) : null;
        const colorTag = colorName ? ` (${colorName})` : '';
        msgLines.push(`• ${i.name}${colorTag} x${i.quantity} = $${(i.quantity * i.price).toFixed(2)}`);
      });
      msgLines.push('');
      msgLines.push(`Subtotal: $${Number(totalAmount).toFixed(2)}`);
      if (shippingMethod === 'domicilio') {
        msgLines.push(`Mensajería: (Por definir dependiendo del lugar)`);
        msgLines.push(`Zona: ${deliveryZone}`);
        msgLines.push(`Dirección: ${customerAddress}`);
      }
      msgLines.push(`Total: $${cartTotal.toFixed(2)}`);
      msgLines.push('');
      msgLines.push(`Nombre: ${customerName}`);
      msgLines.push(`Teléfono: ${customerPhone}`);
      const text = encodeURIComponent(msgLines.join('\n'));
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

      // Crear orden en Supabase después de generar el mensaje
      const { data, error } = await supabase.rpc('create_order', {
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_address: shippingMethod === 'domicilio' ? customerAddress : null,
        p_shipping_method: shippingMethod,
        p_delivery_zone: shippingMethod === 'domicilio' ? deliveryZone : null,
        p_shipping_fee: shippingMethod === 'domicilio' ? Number(shippingFee || 0) : 0,
        p_whatsapp_message: decodeURIComponent(text),
        p_whatsapp_url: waUrl,
        p_items: itemsPayload,
      });

      if (error) throw error;

      // Abrir WhatsApp y limpiar carrito
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
              <div>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={customerName}
                  onChange={(e) => {
                    const v = e.target.value;
                    const cleaned = v.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúÜü\s]/g, '');
                    setCustomerName(cleaned);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
                {customerName && !nameValid && (
                  <div className="mt-1 text-xs text-red-600">Ingresa solo letras y espacios.</div>
                )}
              </div>
              <div>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="Tu teléfono (+53 XXXXXXXX)"
                  value={customerPhone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d\+\s]/g, '');
                    setCustomerPhone(v);
                  }}
                  onBlur={() => {
                    const norm = normalizeCubanPhone(customerPhone);
                    setCustomerPhone(norm);
                  }}
                  className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
                {customerPhone && !phoneValid && (
                  <div className="mt-1 text-xs text-red-600">Formato requerido: +53 XXXXXXXX (8 dígitos).</div>
                )}
              </div>
            </div>

            <button
              className="mt-4 w-full px-4 py-2 rounded-md bg-green-600 text-white disabled:opacity-50"
              onClick={handleCheckout}
              disabled={loading || items.length === 0 || !isFormValid}
            >
              {loading ? 'Enviando...' : 'Enviar pedido por WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
