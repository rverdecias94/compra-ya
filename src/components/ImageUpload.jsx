import React, { useState } from 'react';
import { supabase } from '../config/supabase';

export default function ImageUpload({ value, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `products/${crypto.randomUUID()}.${ext}`;
      const bucket = supabase.storage.from('product-images');
      const { error: upError } = await bucket.upload(path, file, { upsert: false });
      if (upError) throw upError;
      const { data } = bucket.getPublicUrl(path);
      onUploaded?.(data.publicUrl);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Imagen del producto</label>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading && <div className="text-sm text-neutral-600 dark:text-neutral-300">Subiendo...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {value && (
        <div className="mt-2 flex items-center gap-3">
          <img src={value} alt="preview" className="w-20 h-20 object-cover rounded-md border" />
          <a href={value} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Ver imagen</a>
        </div>
      )}
    </div>
  );
}