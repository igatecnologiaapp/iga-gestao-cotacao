import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useCotacoes } from "@/lib/queries";
import { brl, dataCurta, interesseLabel } from "@/lib/cotacao";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/oportunidades")({
  head: () => ({
    meta: [
      { title: "Oportunidades — Cotação Rápida" },
      { name: "description", content: "Produtos e condições marcados como oportunidade." },
      { property: "og:title", content: "Oportunidades" },
      { property: "og:description", content: "Condições comerciais marcadas para decisão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Oportunidades,
});

function Oportunidades() {
  const { data: cotacoes = [], isLoading } = useCotacoes();

  const itens = useMemo(
    () =>
      cotacoes.flatMap((c) =>
        (c.itens ?? []).filter((i) => i.oportunidade).map((item) => ({ item, cotacao: c })),
      ),
    [cotacoes],
  );

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Oportunidades</h1>
      {itens.length === 0 ? (
        <p className="surface p-6 text-center text-sm text-muted-foreground">
          Marque um produto com a estrela dentro da cotação para vê-lo aqui.
        </p>
      ) : (
        <ul className="space-y-2">
          {itens.map(({ item, cotacao }) => (
            <li key={item.id}>
              <Link to="/cotacoes/$id" params={{ id: cotacao.id }} className="surface block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      <Star className="mr-1 inline size-4 fill-accent text-accent" />
                      {item.descricao}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cotacao.fornecedor?.nome} · {dataCurta(cotacao.created_at)} ·{" "}
                      {interesseLabel(item.interesse)}
                    </p>
                  </div>
                  <span className="shrink-0 text-base font-extrabold text-primary">
                    {brl(Number(item.valor))}
                  </span>
                </div>
                {item.observacoes && (
                  <p className="mt-2 rounded-lg bg-secondary p-2.5 text-sm">{item.observacoes}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
