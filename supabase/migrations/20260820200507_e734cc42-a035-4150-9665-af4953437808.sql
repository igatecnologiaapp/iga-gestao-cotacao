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
    garantia, pagamento, qtd_minima, prazo_entrega, frete, observacoes, interesse, oportunidade
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
    COALESCE((i->>'oportunidade')::boolean, false)
  FROM jsonb_array_elements(p_itens) AS i;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.criar_cotacao_completa(uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.criar_cotacao_completa(uuid, text, text, jsonb) TO authenticated;

CREATE TABLE public.pedidos_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  cotacao_id uuid NOT NULL REFERENCES public.cotacoes(id) ON DELETE CASCADE,
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  mensagem text,
  canal text,
  enviado_em timestamptz,
  fornecedor_confirmado boolean NOT NULL DEFAULT false,
  confirmado_em timestamptz,
  canal_confirmacao text,
  observacao_confirmacao text,
  entrega_prevista date,
  entrega_realizada date,
  observacao_entrega text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pedidos_compra_cotacao_idx ON public.pedidos_compra (cotacao_id);
CREATE INDEX pedidos_compra_user_idx ON public.pedidos_compra (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_compra TO authenticated;
GRANT ALL ON public.pedidos_compra TO service_role;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY pedidos_compra_select ON public.pedidos_compra
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY pedidos_compra_insert ON public.pedidos_compra
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.cotacoes c WHERE c.id = cotacao_id AND c.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.fornecedores f WHERE f.id = fornecedor_id AND f.user_id = auth.uid())
  );

CREATE POLICY pedidos_compra_update ON public.pedidos_compra
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.cotacoes c WHERE c.id = cotacao_id AND c.user_id = auth.uid())
  );

CREATE POLICY pedidos_compra_delete ON public.pedidos_compra
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER pedidos_compra_updated BEFORE UPDATE ON public.pedidos_compra
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();