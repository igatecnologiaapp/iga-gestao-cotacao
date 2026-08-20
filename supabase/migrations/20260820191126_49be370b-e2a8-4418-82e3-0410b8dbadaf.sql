
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.segmentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX segmentos_user_nome_idx ON public.segmentos (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(nome));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.segmentos TO authenticated;
GRANT ALL ON public.segmentos TO service_role;
ALTER TABLE public.segmentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "segmentos_select" ON public.segmentos FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "segmentos_insert" ON public.segmentos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "segmentos_update" ON public.segmentos FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "segmentos_delete" ON public.segmentos FOR DELETE TO authenticated USING (user_id = auth.uid());

INSERT INTO public.segmentos (user_id, nome) VALUES
 (NULL,'Alimentos'),(NULL,'Bebidas'),(NULL,'Informática'),(NULL,'Iluminação'),
 (NULL,'Material elétrico'),(NULL,'Material de construção'),(NULL,'Embalagens'),
 (NULL,'Limpeza'),(NULL,'Equipamentos'),(NULL,'Ferramentas'),(NULL,'Escritório'),
 (NULL,'Distribuidor'),(NULL,'Atacadista'),(NULL,'Indústria'),(NULL,'Outros');

CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  nome text NOT NULL,
  contato text NOT NULL,
  segmento_id uuid REFERENCES public.segmentos ON DELETE SET NULL,
  segmento_nome text,
  bairro text NOT NULL,
  uf text NOT NULL,
  endereco text,
  cidade text,
  vendedor text,
  telefone text,
  whatsapp text,
  email text,
  site text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedores_all" ON public.fornecedores FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER fornecedores_updated BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX fornecedores_user_idx ON public.fornecedores (user_id, nome);

CREATE TABLE public.cotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'em_pesquisa',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cotacoes_status_chk CHECK (status IN ('em_pesquisa','concluida','em_analise','compra_provavel','compra_realizada','nao_comprar','arquivada'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT ALL ON public.cotacoes TO service_role;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cotacoes_all" ON public.cotacoes FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER cotacoes_updated BEFORE UPDATE ON public.cotacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX cotacoes_user_created_idx ON public.cotacoes (user_id, created_at DESC);

CREATE TABLE public.itens_cotacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  cotacao_id uuid NOT NULL REFERENCES public.cotacoes ON DELETE CASCADE,
  codigo text,
  descricao text NOT NULL,
  valor numeric(14,2) NOT NULL,
  quantidade numeric(14,3) DEFAULT 1,
  unidade text DEFAULT 'UN',
  marca text,
  modelo text,
  garantia text,
  pagamento text,
  qtd_minima numeric(14,3),
  prazo_entrega text,
  frete text,
  observacoes text,
  interesse smallint NOT NULL DEFAULT 3,
  oportunidade boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT itens_interesse_chk CHECK (interesse BETWEEN 1 AND 5)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itens_cotacao TO authenticated;
GRANT ALL ON public.itens_cotacao TO service_role;
ALTER TABLE public.itens_cotacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itens_all" ON public.itens_cotacao FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER itens_updated BEFORE UPDATE ON public.itens_cotacao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX itens_cotacao_idx ON public.itens_cotacao (cotacao_id);
CREATE INDEX itens_user_desc_idx ON public.itens_cotacao (user_id, lower(descricao));
