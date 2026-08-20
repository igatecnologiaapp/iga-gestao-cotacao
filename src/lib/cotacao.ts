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

export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR",
  "PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

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
