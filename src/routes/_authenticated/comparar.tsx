import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { useCotacoes, agruparProdutos, historicoProduto } from "@/lib/queries";
import { brl, dataCurta, dataHora, normalize, precoUnidade } from "@/lib/cotacao";
import { SeloCompetitividade } from "@/components/PrecoMercado";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/comparar")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    ...(typeof search["q"] === "string" ? { q: search["q"] as string } : {}),
  }),

  head: () => ({
    meta: [
      { title: "Comparar preços — Cotação Rápida" },
      { name: "description", content: "Compare o preço de um produto entre todos os fornecedores." },
      { property: "og:title", content: "Comparar preços" },
      { property: "og:description", content: "Compare fornecedores e condições comerciais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Comparar,
});

function Comparar() {
  const { q } = Route.useSearch();
  const { data: cotacoes = [], isLoading } = useCotacoes();
  const [termo, setTermo] = useState("");
  const [selecionado, setSelecionado] = useState<string | null>(q ?? null);

  const grupos = useMemo(() => agruparProdutos(cotacoes), [cotacoes]);
  const grupo = grupos.find((g) => g.chave === selecionado) ?? null;

  const lista = useMemo(() => {
    const t = normalize(termo);
    return t ? grupos.filter((g) => normalize(g.descricao).includes(t)) : grupos;
  }, [grupos, termo]);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  if (grupo) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelecionado(null)}
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> Todos os produtos
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight">{grupo.descricao}</h1>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Resumo rotulo="Menor" valor={brl(grupo.menor)} destaque="success" />
          <Resumo rotulo="Médio" valor={brl(grupo.medio)} />
          <Resumo rotulo="Maior" valor={brl(grupo.maior)} destaque="destructive" />
        </div>

        {grupo.precoOnline != null && (
          <div className="surface p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Referência de mercado — preço médio online
            </p>
            <p className="text-lg font-extrabold">{brl(grupo.precoOnline)}</p>
            <p className="text-[11px] text-muted-foreground">
              {grupo.precoOnlineEm
                ? `Pesquisado em ${new Date(grupo.precoOnlineEm).toLocaleDateString("pt-BR")}`
                : ""}
              {grupo.precoOnlineFonte ? ` · ${grupo.precoOnlineFonte}` : ""} · não entra no cálculo
              de menor/maior fornecedor.
            </p>
          </div>
        )}

        {grupo.unidades.length > 1 && (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            Atenção: este produto foi cotado em unidades diferentes ({grupo.unidades.join(", ")}).
            Confira a unidade antes de comparar os preços.
          </p>
        )}



        <ul className="space-y-2">
          {grupo.registros.map(({ item, cotacao }) => {
            const valor = Number(item.valor);
            const menor = valor === grupo.menor;
            const maior = valor === grupo.maior && grupo.maior !== grupo.menor;
            return (
              <li key={item.id}>
                <Link
                  to="/cotacoes/$id"
                  params={{ id: cotacao.id }}
                  className={
                    "surface block p-4 " +
                    (menor ? "ring-2 ring-success" : maior ? "ring-2 ring-destructive/50" : "")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{cotacao.fornecedor?.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {cotacao.fornecedor?.bairro}/{cotacao.fornecedor?.uf} ·{" "}
                        {dataCurta(cotacao.created_at)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-extrabold">
                        {precoUnidade(valor, item.unidade)}
                      </p>
                      {menor && (
                        <span className="text-[11px] font-extrabold uppercase text-success">
                          menor preço
                        </span>
                      )}
                      {maior && (
                        <span className="text-[11px] font-extrabold uppercase text-destructive">
                          maior preço
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {item.pagamento && <Tag>Pagamento: {item.pagamento}</Tag>}
                    {item.qtd_minima && <Tag>Compra mínima: {item.qtd_minima}</Tag>}
                    {item.prazo_entrega && <Tag>Entrega: {item.prazo_entrega}</Tag>}
                    {item.frete && <Tag>Frete: {item.frete}</Tag>}
                    {item.garantia && <Tag>Garantia: {item.garantia}</Tag>}
                  </div>
                  {grupo.precoOnline != null && (
                    <div className="mt-2">
                      <SeloCompetitividade compra={valor} online={grupo.precoOnline} />
                    </div>
                  )}

                </Link>
                <Link
                  to="/cotacoes/$id"
                  params={{ id: cotacao.id }}
                  className="mt-1 block rounded-xl border border-border px-3 py-2.5 text-center text-xs font-extrabold uppercase tracking-wide"
                >
                  Decidir compra com este fornecedor
                </Link>
              </li>

            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          O menor preço nem sempre é a melhor condição: confira compra mínima, pagamento e frete.
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
            Histórico de preços
          </h2>
          <ul className="surface divide-y divide-border">
            {historicoProduto(grupo).map(({ item, cotacao }) => (
              <li key={`h-${item.id}`} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{cotacao.fornecedor?.nome}</p>
                  <p className="text-xs text-muted-foreground">{dataHora(cotacao.created_at)}</p>
                </div>
                <span className="shrink-0 text-sm font-extrabold">
                  {precoUnidade(Number(item.valor), item.unidade)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Comparar preços</h1>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-9"
          placeholder="Buscar produto cotado"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
      </div>
      {lista.length === 0 ? (
        <p className="surface p-6 text-center text-sm text-muted-foreground">
          Nenhum produto cotado ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((g) => (
            <li key={g.chave}>
              <button
                onClick={() => setSelecionado(g.chave)}
                className="surface flex w-full items-center justify-between p-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{g.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.fornecedores} fornecedor(es) · {g.registros.length} cotações
                  </p>
                </div>
                <span className="shrink-0 pl-3 text-right text-sm">
                  <span className="block font-extrabold text-success">{brl(g.menor)}</span>
                  <span className="block text-xs text-muted-foreground">{brl(g.maior)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Resumo({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: "success" | "destructive";
}) {
  return (
    <div className="surface p-3">
      <p className="text-[11px] font-bold uppercase text-muted-foreground">{rotulo}</p>
      <p
        className={
          "text-base font-extrabold " +
          (destaque === "success"
            ? "text-success"
            : destaque === "destructive"
              ? "text-destructive"
              : "")
        }
      >
        {valor}
      </p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold text-secondary-foreground">
      {children}
    </span>
  );
}
