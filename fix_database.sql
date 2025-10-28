-- Consolidado: columnas y RPC para productos (colors, label, sale_price)

-- Limpiar posibles firmas previas
DROP FUNCTION IF EXISTS public.admin_upsert_product(
  uuid, uuid, text, text, numeric, uuid, text, integer, boolean, boolean
);
DROP FUNCTION IF EXISTS public.admin_upsert_product(
  uuid, uuid, text, text, numeric, uuid, text, integer, boolean, boolean, text[], text
);
DROP FUNCTION IF EXISTS public.admin_upsert_product(
  uuid, uuid, text, text, numeric, numeric, integer, uuid, text[], text, boolean, boolean, text
);

-- Asegurar columnas necesarias
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS colors text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric;

-- Crear/Reemplazar función admin_upsert_product alineada con el formulario
CREATE OR REPLACE FUNCTION public.admin_upsert_product(
  p_token uuid,
  p_id uuid,
  p_name text,
  p_description text,
  p_price numeric,
  p_sale_price numeric,
  p_stock integer,
  p_category_id uuid,
  p_colors text[],
  p_label text,
  p_is_active boolean,
  p_agotado boolean,
  p_image_url text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_id uuid; BEGIN
  IF NOT public.admin_is_valid(p_token) THEN RAISE EXCEPTION 'Token inválido'; END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.products(
      name, description, price, category_id, image_url,
      stock, agotado, is_active, colors, label, sale_price
    ) VALUES (
      p_name, p_description, p_price, p_category_id, p_image_url,
      p_stock, COALESCE(p_agotado,false), COALESCE(p_is_active,true),
      p_colors, p_label, p_sale_price
    ) RETURNING id INTO v_id;
  ELSE
    UPDATE public.products SET
      name = p_name,
      description = p_description,
      price = p_price,
      category_id = p_category_id,
      image_url = p_image_url,
      stock = p_stock,
      agotado = COALESCE(p_agotado,false),
      is_active = COALESCE(p_is_active,true),
      colors = p_colors,
      label = p_label,
      sale_price = p_sale_price
    WHERE id = p_id
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_upsert_product(
  uuid, uuid, text, text, numeric, numeric, integer, uuid, text[], text, boolean, boolean, text
) TO anon;