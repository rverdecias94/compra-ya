-- 1) Agregar columna de precio rebajado
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sale_price numeric;

-- 2) Reemplazar admin_upsert_product para incluir sale_price (colors = text[])
DROP FUNCTION IF EXISTS public.admin_upsert_product(uuid, uuid, text, text, numeric, uuid, text, integer, boolean, boolean, text[], text, numeric);
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
      p_stock, coalesce(p_agotado,false), coalesce(p_is_active,true),
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
      agotado = coalesce(p_agotado,false),
      is_active = coalesce(p_is_active,true),
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

-- 3) Listado paginado para admin
DROP FUNCTION IF EXISTS public.admin_list_products_page(uuid, integer, integer);
CREATE OR REPLACE FUNCTION public.admin_list_products_page(
  p_token uuid,
  p_page integer,
  p_page_size integer
) RETURNS TABLE (
  id uuid,
  name text,
  description text,
  price numeric,
  sale_price numeric,
  category_id uuid,
  image_url text,
  stock integer,
  agotado boolean,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  colors text[],
  label text,
  category_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_offset integer; BEGIN
  IF NOT public.admin_is_valid(p_token) THEN RAISE EXCEPTION 'Token inválido'; END IF;
  v_offset := GREATEST((coalesce(p_page,1)-1) * coalesce(p_page_size,8), 0);
  RETURN QUERY
  SELECT p.id, p.name, p.description, p.price, p.sale_price, p.category_id, p.image_url,
         p.stock, p.agotado, p.is_active, p.created_at, p.updated_at, p.colors, p.label,
         c.name as category_name
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  ORDER BY p.name
  LIMIT coalesce(p_page_size,8) OFFSET v_offset;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_list_products_page(uuid, integer, integer) TO anon;

-- 4) Conteo total para admin
DROP FUNCTION IF EXISTS public.admin_count_products(uuid);
CREATE OR REPLACE FUNCTION public.admin_count_products(p_token uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_total bigint; BEGIN
  IF NOT public.admin_is_valid(p_token) THEN RAISE EXCEPTION 'Token inválido'; END IF;
  SELECT COUNT(*) INTO v_total FROM public.products;
  RETURN v_total;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_count_products(uuid) TO anon;