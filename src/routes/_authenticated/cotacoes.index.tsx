import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Search } from "lucide-react";
import { useCotacoes, totalCotacao, interessePredominante } from "@/lib/queries";
import { STATUS_OPTIONS, brl, dataHora, interesseLabel, normalize } from "@/lib/cotacao";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/cotacoes/")({
  head: () => ({
    meta: [
      { title: "Cotações — Cotação Rápida" },
      { name: "description", content: "Todas as cotações registradas, com filtros rápidos." },
      { property: "og:title", content: "Cotações — Cotação Rápida" },
      { property: "og:description", content: "Todas as cotações registradas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cotacoes,
});

const PERIODOS = [
  { value: "todos", label: "Todo período" },
  { value: "hoje", label: "Hoje" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
];

function Cotacoes() {
  const { data: cotacoes = [], isLoading } = useCotacoes();
  const [termo, setTermo] = useState("");
  const [status, setStatus] = useState("todos");
  const [segmento, setSegmento] = useState("todos");
  const [uf, setUf] = useState("todos");
  const [periodo, setPeriodo] = useState("todos");
  const [interesse, setInteresse] = useState("todos");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const segmentos = useMemo(
    () => [...new Set(cotacoes.map((c) => c.fornecedor?.segmento_nome).filter(Boolean))] as string[],
    [cotacoes],
  );
  const ufs = useMemo(
    () => [...new Set(cotacoes.map((c) => c.fornecedor?.uf).filter(Boolean))] as string[],
    [cotacoes],
  );

  const filtradas = useMemo(() => {
    const t = normalize(termo);
    const agora = Date.now();
    return cotacoes.filter((c) => {
      if (status !== "todos" && c.status !== status) return false;
      if (segmento !== "todos" && c.fornecedor?.segmento_nome !== segmento) return false;
      if (uf !== "todos" && c.fornecedor?.uf !== uf) return false;
      if (interesse !== "todos" && interessePredominante(c) !== Number(interesse)) return false;
      if (periodo !== "todos") {
        const criada = new Date(c.created_at);
        if (periodo === "hoje") {
          if (criada.toDateString() !== new Date().toDateString()) return false;
        } else {
          const dias = Number(periodo);
          if (agora - criada.getTime() > dias * 86400000) return false;
        }
      }
      if (!t) return true;
      const texto = [
        c.fornecedor?.nome,
        c.fornecedor?.segmento_nome,
        c.fornecedor?.bairro,
        ...(c.itens ?? []).map((i) => `${i.descricao} ${i.codigo ?? ""} ${i.marca ?? ""}`),
      ]
        .filter(Boolean)
        .join(" ");
      return normalize(texto).includes(t);
    });
  }, [cotacoes, termo, status, segmento, uf, periodo, interesse]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Cotações</h1>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-9"
            placeholder="Fornecedor ou produto"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>
        <Button
          variant={mostrarFiltros ? "default" : "outline"}
          className="h-12"
          onClick={() => setMostrarFiltros((v) => !v)}
        >
          <Filter className="size-4" /> Filtros
        </Button>
      </div>

      {mostrarFiltros && (
        <div className="surface grid grid-cols-2 gap-2 p-3">
          <Filtro value={status} onChange={setStatus} placeholder="Status">
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </Filtro>
          <Filtro value={periodo} onChange={setPeriodo} placeholder="Período" comTodos={false}>
            {PERIODOS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </Filtro>
          <Filtro value={segmento} onChange={setSegmento} placeholder="Segmento">
            {segmentos.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </Filtro>
          <Filtro value={uf} onChange={setUf} placeholder="UF">
            {ufs.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </Filtro>
          <Filtro value={interesse} onChange={setInteresse} placeholder="Interesse">
            {[5, 4, 3, 2, 1].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {interesseLabel(n)}
              </SelectItem>
            ))}
          </Filtro>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : filtradas.length === 0 ? (
        <p className="surface p-6 text-center text-sm text-muted-foreground">
          Nenhuma cotação encontrada com esses filtros.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtradas.map((c) => (
            <li key={c.id}>
              <Link to="/cotacoes/$id" params={{ id: c.id }} className="surface block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold">{c.fornecedor?.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.fornecedor?.segmento_nome} · {c.fornecedor?.bairro}/{c.fornecedor?.uf}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold">{brl(totalCotacao(c))}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={c.status} />
                  <span>{c.itens?.length ?? 0} produtos</span>
                  <span>· Interesse {interesseLabel(interessePredominante(c))}</span>
                  <span>· {dataHora(c.created_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Filtro({
  value,
  onChange,
  placeholder,
  children,
  comTodos = true,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
  comTodos?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {comTodos && <SelectItem value="todos">{placeholder}: todos</SelectItem>}
        {children}
      </SelectContent>
    </Select>
  );
}
