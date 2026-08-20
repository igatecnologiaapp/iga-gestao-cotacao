import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCotacoes, useFornecedores, agruparProdutos } from "@/lib/queries";
import { brl, dataCurta, normalize } from "@/lib/cotacao";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/busca")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Busca — Cotação Rápida" },
      { name: "description", content: "Pesquise fornecedores, produtos, códigos e marcas." },
      { property: "og:title", content: "Busca" },
      { property: "og:description", content: "Pesquisa global de cotações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Busca,
});

function Busca() {
  const { q } = Route.useSearch();
  const { data: cotacoes = [], isLoading } = useCotacoes();
  const { data: fornecedores = [] } = useFornecedores();
  const t = normalize(q ?? "");

  const forn = useMemo(
    () =>
      t
        ? fornecedores.filter((f) =>
            normalize(`${f.nome} ${f.segmento_nome ?? ""} ${f.bairro} ${f.uf}`).includes(t),
          )
        : [],
    [fornecedores, t],
  );

  const produtos = useMemo(
    () =>
      t
        ? agruparProdutos(cotacoes).filter((g) =>
            g.registros.some((r) =>
              normalize(
                `${r.item.descricao} ${r.item.codigo ?? ""} ${r.item.marca ?? ""}`,
              ).includes(t),
            ),
          )
        : [],
    [cotacoes, t],
  );

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Resultados para “{q}”</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          Fornecedores ({forn.length})
        </h2>
        {forn.map((f) => (
          <Link
            key={f.id}
            to="/nova"
            search={{ fornecedor: f.id }}
            className="surface block p-3 text-sm"
          >
            <span className="font-bold">{f.nome}</span>
            <span className="block text-xs text-muted-foreground">
              {f.segmento_nome} — {f.bairro}/{f.uf}
            </span>
          </Link>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          Produtos ({produtos.length})
        </h2>
        {produtos.map((g) => (
          <Link key={g.chave} to="/comparar" search={{ q: g.chave }} className="surface block p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-bold">{g.descricao}</span>
              <span className="shrink-0 text-sm font-extrabold text-success">{brl(g.menor)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {g.fornecedores} fornecedor(es) · última{" "}
              {dataCurta(g.registros.map((r) => r.cotacao.created_at).sort().at(-1)!)}
            </span>
          </Link>
        ))}
      </section>

      {!forn.length && !produtos.length && (
        <p className="surface p-6 text-center text-sm text-muted-foreground">
          Nada encontrado para essa pesquisa.
        </p>
      )}
    </div>
  );
}
