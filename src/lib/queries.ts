import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { normalize } from "./cotacao";

export type Fornecedor = Database["public"]["Tables"]["fornecedores"]["Row"];
export type Segmento = Database["public"]["Tables"]["segmentos"]["Row"];
export type Item = Database["public"]["Tables"]["itens_cotacao"]["Row"];
export type Cotacao = Database["public"]["Tables"]["cotacoes"]["Row"];
export type CotacaoFull = Cotacao & { fornecedor: Fornecedor | null; itens: Item[] };

export async function fetchCotacoes(): Promise<CotacaoFull[]> {
  const { data, error } = await supabase
    .from("cotacoes")
    .select("*, fornecedor:fornecedores(*), itens:itens_cotacao(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CotacaoFull[];
}

export async function fetchFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase.from("fornecedores").select("*").order("nome");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSegmentos(): Promise<Segmento[]> {
  const { data, error } = await supabase.from("segmentos").select("*").order("nome");
  if (error) throw error;
  return data ?? [];
}

export function useCotacoes() {
  return useQuery({ queryKey: ["cotacoes"], queryFn: fetchCotacoes });
}

export function useFornecedores() {
  return useQuery({ queryKey: ["fornecedores"], queryFn: fetchFornecedores });
}

export function useSegmentos() {
  return useQuery({ queryKey: ["segmentos"], queryFn: fetchSegmentos });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["cotacoes"] });
    qc.invalidateQueries({ queryKey: ["fornecedores"] });
    qc.invalidateQueries({ queryKey: ["segmentos"] });
  };
}

export type ProdutoResumo = {
  chave: string;
  descricao: string;
  registros: Array<{
    item: Item;
    cotacao: CotacaoFull;
  }>;
  fornecedores: number;
  menor: number;
  maior: number;
  medio: number;
  interesse: number;
};

/** Agrupa todos os itens cotados por descrição (chave normalizada). */
export function agruparProdutos(cotacoes: CotacaoFull[]): ProdutoResumo[] {
  const mapa = new Map<string, ProdutoResumo>();
  for (const cot of cotacoes) {
    for (const item of cot.itens ?? []) {
      const chave = normalize(item.descricao);
      let grupo = mapa.get(chave);
      if (!grupo) {
        grupo = {
          chave,
          descricao: item.descricao,
          registros: [],
          fornecedores: 0,
          menor: 0,
          maior: 0,
          medio: 0,
          interesse: 0,
        };
        mapa.set(chave, grupo);
      }
      grupo.registros.push({ item, cotacao: cot });
    }
  }
  const lista = [...mapa.values()];
  for (const g of lista) {
    const valores = g.registros.map((r) => Number(r.item.valor));
    g.menor = Math.min(...valores);
    g.maior = Math.max(...valores);
    g.medio = valores.reduce((a, b) => a + b, 0) / valores.length;
    g.fornecedores = new Set(g.registros.map((r) => r.cotacao.fornecedor_id)).size;
    g.interesse = Math.max(...g.registros.map((r) => r.item.interesse));
    g.registros.sort((a, b) => Number(a.item.valor) - Number(b.item.valor));
  }
  lista.sort((a, b) => b.registros.length - a.registros.length);
  return lista;
}

export function totalCotacao(cot: CotacaoFull) {
  return (cot.itens ?? []).reduce(
    (soma, i) => soma + Number(i.valor) * Number(i.quantidade ?? 1),
    0,
  );
}

export function interessePredominante(cot: CotacaoFull) {
  const itens = cot.itens ?? [];
  if (!itens.length) return 3;
  return Math.max(...itens.map((i) => i.interesse));
}
