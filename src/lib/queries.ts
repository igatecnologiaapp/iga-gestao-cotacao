import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { chaveProduto, interesseAgregado } from "./cotacao";

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
    qc.invalidateQueries({ queryKey: ["pedidos"] });
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
  /** Interesse agregado (média ponderada) — ver interesseAgregado. */
  interesse: number;
  /** Interesse do registro mais recente. */
  interesseRecente: number;
  /** Unidades distintas encontradas — comparação só é segura com uma unidade. */
  unidades: string[];
};

/** Agrupa todos os itens cotados por chave normalizada da descrição. */
export function agruparProdutos(cotacoes: CotacaoFull[]): ProdutoResumo[] {
  const mapa = new Map<string, ProdutoResumo>();
  for (const cot of cotacoes) {
    for (const item of cot.itens ?? []) {
      const chave = chaveProduto(item.descricao);
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
          interesseRecente: 3,
          unidades: [],
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
    g.interesse = interesseAgregado(g.registros.map((r) => r.item.interesse));
    g.unidades = [...new Set(g.registros.map((r) => r.item.unidade ?? "UN"))];
    const cronologico = [...g.registros].sort(
      (a, b) => +new Date(a.cotacao.created_at) - +new Date(b.cotacao.created_at),
    );
    g.interesseRecente = cronologico.at(-1)?.item.interesse ?? 3;
    g.registros.sort((a, b) => Number(a.item.valor) - Number(b.item.valor));
  }
  lista.sort((a, b) => b.registros.length - a.registros.length);
  return lista;
}

/** Histórico cronológico (mais antigo → mais recente) de um grupo de produto. */
export function historicoProduto(grupo: ProdutoResumo) {
  return [...grupo.registros].sort(
    (a, b) => +new Date(a.cotacao.created_at) - +new Date(b.cotacao.created_at),
  );
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
  return interesseAgregado(itens.map((i) => i.interesse));
}

export type Pedido = Database["public"]["Tables"]["pedidos_compra"]["Row"];
export type PedidoItem = {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valor: number;
  subtotal: number;
  condicoes: string;
};

export async function fetchPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function usePedidos() {
  return useQuery({ queryKey: ["pedidos"], queryFn: fetchPedidos });
}
