ALTER TABLE public.itens_cotacao ADD COLUMN IF NOT EXISTS arquivado boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS itens_cotacao_arquivado_idx ON public.itens_cotacao (user_id, arquivado);