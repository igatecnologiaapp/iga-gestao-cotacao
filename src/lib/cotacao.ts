export const STATUS_OPTIONS = [
  { value: "em_pesquisa", label: "Em pesquisa" },
  { value: "concluida", label: "Cotação concluída" },
  { value: "em_analise", label: "Em análise" },
  { value: "compra_provavel", label: "Compra provável" },
  { value: "compra_realizada", label: "Compra realizada" },
  { value: "nao_comprar", label: "Não comprar" },
  { value: "arquivada", label: "Arquivada" },
] as const;

export const INTERESSE_OPTIONS = [
  { value: 5, label: "Muito alto" },
  { value: 4, label: "Alto" },
  { value: 3, label: "Médio" },
  { value: 2, label: "Baixo" },
  { value: 1, label: "Sem interesse" },
] as const;

export const UNIDADES = ["UN", "CX", "KG", "LT", "PCT", "FD", "MT", "KIT"] as const;

const UFS_DEMAIS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SE","TO",
].sort();

/** SP primeiro (operação predominante), depois as demais em ordem alfabética. */
export const UFS = ["SP", ...UFS_DEMAIS];

export function statusLabel(value: string) {
  return STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

export function interesseLabel(value: number) {
  return INTERESSE_OPTIONS.find((i) => i.value === value)?.label ?? "Médio";
}

export function brl(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function num(value: number | null | undefined, digits = 0) {
  return (value ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: digits });
}

export function dataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function dataHora(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return mesmoDia
    ? `Hoje — ${hora}`
    : `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" })} — ${hora}`;
}

export function parseValor(input: string): number {
  const cleaned = input.replace(/\s|R\$/g, "").replace(/\./g, "").replace(",", ".");
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : NaN;
}

export function whatsappLink(numero: string | null | undefined) {
  if (!numero) return null;
  const digits = numero.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}`;
}

export function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Chave de agrupamento de produtos (melhoria simples, sem cadastro mestre):
 * remove acentos e pontuação, junta número + unidade ("9 w" -> "9w") e ordena
 * os termos, de modo que "Lâmpada LED 9W", "Lampada Led 9 W" e
 * "Lâmpada 9W LED" caiam no mesmo grupo.
 */
export function chaveProduto(descricao: string) {
  return normalize(descricao)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/(\d)\s+(w|kg|g|ml|l|mm|cm|m|un|pol|v|a)\b/g, "$1$2")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

/** "R$ 10,00 / UN" — deixa explícita a unidade de referência do preço. */
export function precoUnidade(valor: number | null | undefined, unidade?: string | null) {
  return `${brl(valor)} / ${unidade || "UN"}`;
}

/**
 * Indicador de interesse do grupo: média ponderada pela quantidade de
 * avaliações (média simples puxada para o valor neutro 3 quando há poucas
 * avaliações), evitando que um único registro isolado defina o indicador.
 * Regra: (soma + 3 * 2) / (n + 2), arredondada.
 */
export function interesseAgregado(valores: number[]) {
  if (!valores.length) return 3;
  const soma = valores.reduce((a, b) => a + b, 0);
  return Math.round((soma + 3 * 2) / (valores.length + 2));
}

/* ------------------------------------------------------------------ *
 * Referência de mercado (preço médio de venda na internet)
 * ------------------------------------------------------------------ */

/**
 * Faixas de competitividade sobre o custo (percentual do preço médio online
 * acima do preço de compra). Centralizado aqui para futura configuração.
 */
export const FAIXAS_COMPETITIVIDADE = [
  { min: 40, chave: "muito", label: "Muito competitivo", tom: "success" },
  { min: 20, chave: "competitivo", label: "Competitivo", tom: "success" },
  { min: 10, chave: "atencao", label: "Atenção", tom: "warning" },
  { min: -Infinity, chave: "pouco", label: "Pouco competitivo", tom: "destructive" },
] as const;

export const FONTES_PRECO_ONLINE = [
  "Mercado Livre",
  "Amazon",
  "Magazine Luiza",
  "Loja do fabricante",
  "Pesquisa Google",
  "Outro",
] as const;

export type ComparativoMercado = {
  compra: number;
  online: number;
  diferenca: number;
  percentual: number;
  label: string;
  tom: string;
  chave: string;
};

/**
 * Diferença comercial entre o preço de compra e o preço médio online.
 * diferenca = online - compra
 * percentual = ((online - compra) / compra) * 100
 * NÃO é lucro: não considera impostos, frete, comissões e demais custos.
 */
export function compararMercado(
  compra: number | null | undefined,
  online: number | null | undefined,
): ComparativoMercado | null {
  const c = Number(compra);
  const o = Number(online);
  if (!Number.isFinite(c) || !Number.isFinite(o) || c <= 0 || o <= 0) return null;
  const diferenca = o - c;
  const percentual = (diferenca / c) * 100;
  const faixa = FAIXAS_COMPETITIVIDADE.find((f) => percentual >= f.min)!;
  return {
    compra: c,
    online: o,
    diferenca,
    percentual,
    label: faixa.label,
    tom: faixa.tom,
    chave: faixa.chave,
  };
}

export function percentualTexto(valor: number) {
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/** Monta a busca externa (Google) com os dados disponíveis do produto. */
export function buscaPrecoUrl(p: {
  descricao?: string;
  marca?: string;
  modelo?: string;
  codigo?: string;
}) {
  const termo = [p.descricao, p.marca, p.modelo, p.codigo]
    .map((t) => (t ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(termo || "produto")}`;
}
