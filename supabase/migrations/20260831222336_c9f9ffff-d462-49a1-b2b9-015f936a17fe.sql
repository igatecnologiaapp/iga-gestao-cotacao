ALTER TABLE public.itens_cotacao
  ADD COLUMN IF NOT EXISTS preco_medio_online numeric,
  ADD COLUMN IF NOT EXISTS preco_online_pesquisado_em timestamptz,
  ADD COLUMN IF NOT EXISTS preco_online_fonte text,
  ADD COLUMN IF NOT EXISTS preco_online_url text;

CREATE OR REPLACE FUNCTION public.criar_cotacao_completa(
  p_fornecedor_id uuid,
  p_status text,
  p_observacoes text,
  p_itens jsonb
) RETURNS uuid
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_itens IS NULL OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'A cotação precisa de ao menos um item.';
  END IF;

  INSERT INTO public.cotacoes (fornecedor_id, status, observacoes)
  VALUES (p_fornecedor_id, COALESCE(p_status, 'em_pesquisa'), p_observacoes)
  RETURNING id INTO v_id;

  INSERT INTO public.itens_cotacao (
    cotacao_id, codigo, descricao, valor, quantidade, unidade, marca, modelo,
    garantia, pagamento, qtd_minima, prazo_entrega, frete, observacoes, interesse, oportunidade,
    preco_medio_online, preco_online_pesquisado_em, preco_online_fonte, preco_online_url
  )
  SELECT
    v_id,
    NULLIF(i->>'codigo',''),
    i->>'descricao',
    (i->>'valor')::numeric,
    COALESCE((i->>'quantidade')::numeric, 1),
    COALESCE(NULLIF(i->>'unidade',''), 'UN'),
    NULLIF(i->>'marca',''),
    NULLIF(i->>'modelo',''),
    NULLIF(i->>'garantia',''),
    NULLIF(i->>'pagamento',''),
    NULLIF(i->>'qtd_minima','')::numeric,
    NULLIF(i->>'prazo_entrega',''),
    NULLIF(i->>'frete',''),
    NULLIF(i->>'observacoes',''),
    COALESCE((i->>'interesse')::smallint, 3),
    COALESCE((i->>'oportunidade')::boolean, false),
    NULLIF(i->>'preco_medio_online','')::numeric,
    CASE WHEN NULLIF(i->>'preco_medio_online','') IS NULL THEN NULL
         ELSE COALESCE(NULLIF(i->>'preco_online_pesquisado_em','')::timestamptz, now()) END,
    NULLIF(i->>'preco_online_fonte',''),
    NULLIF(i->>'preco_online_url','')
  FROM jsonb_array_elements(p_itens) AS i;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_cotacao_completa(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_cotacao_completa(uuid, text, text, jsonb) TO authenticated;