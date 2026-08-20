import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Star, Store, Package, TrendingDown } from "lucide-react";
import { useCotacoes, agruparProdutos, totalCotacao } from "@/lib/queries";
import { brl, dataHora, normalize } from "@/lib/cotacao";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Cotação Rápida" },
      { name: "description", content: "Resumo das suas cotações do dia e atalho para cotar." },
      { property: "og:title", content: "Início — Cotação Rápida" },
      { property: "og:description", content: "Resumo das suas cotações e atalho para cotar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { data: cotacoes = [], isLoading } = useCotacoes();

  const hoje = new Date().toDateString();
  const doDia = cotacoes.filter((c) => new Date(c.created_at).toDateString() === hoje);
  const produtosHoje = doDia.reduce((s, c) => s + (c.itens?.length ?? 0), 0);
  const fornecedoresHoje = new Set(doDia.map((c) => c.fornecedor_id)).size;
  const oportunidades = cotacoes.flatMap((c) => c.itens ?? []).filter((i) => i.oportunidade).length;

  const grupos = agruparProdutos(cotacoes);
  const produtosDiferentes = grupos.length;
  const menoresPrecos = grupos.filter((g) => g.registros.length > 1).length;
  const maiorInteresse = grupos
    .filter((g) => g.interesse >= 4)
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <section className="brand-gradient rounded-2xl p-5 text-primary-foreground">
        <h1 className="text-2xl font-extrabold tracking-tight">Cotação Rápida</h1>
        <p className="mt-1 text-sm opacity-90">Registre um preço em segundos.</p>
        <Link
          to="/nova"
          className="mt-4 flex h-14 items-center justify-center gap-2 rounded-xl bg-card text-base font-extrabold text-foreground"
        >
          <Plus className="size-5" /> NOVA COTAÇÃO
        </Link>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Mini valor={produtosHoje} rotulo="produtos hoje" />
          <Mini valor={fornecedoresHoje} rotulo="fornecedores" />
          <Mini valor={oportunidades} rotulo="oportunidades" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Indicador icone={Package} valor={cotacoes.length} rotulo="Cotações realizadas" />
        <Indicador
          icone={Store}
          valor={new Set(cotacoes.map((c) => c.fornecedor_id)).size}
          rotulo="Fornecedores pesquisados"
        />
        <Indicador icone={Package} valor={produtosDiferentes} rotulo="Produtos pesquisados" />
        <Indicador icone={TrendingDown} valor={menoresPrecos} rotulo="Itens comparáveis" />
      </section>

      {maiorInteresse.length > 0 && (
        <section className="surface p-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wide">Maior interesse</h2>
          <ul className="mt-2 space-y-1.5">
            {maiorInteresse.map((g) => (
              <li key={g.chave} className="flex items-center justify-between text-sm">
                <Link
                  to="/comparar"
                  search={{ q: normalize(g.descricao) }}
                  className="truncate font-semibold text-foreground"
                >
                  {g.descricao}
                </Link>
                <span className="shrink-0 pl-3 text-muted-foreground">{brl(g.menor)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          Cotações recentes
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : cotacoes.length === 0 ? (
          <div className="surface p-6 text-center">
            <Star className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma cotação ainda. Toque em <strong>Nova Cotação</strong> para começar.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {cotacoes.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to="/cotacoes/$id" params={{ id: c.id }} className="surface flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{c.fornecedor?.nome ?? "Fornecedor"}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.itens?.length ?? 0} produtos · {dataHora(c.created_at)}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                  <span className="shrink-0 pl-3 text-sm font-extrabold">{brl(totalCotacao(c))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Mini({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="rounded-xl bg-primary-foreground/15 py-2">
      <p className="text-xl font-extrabold">{valor}</p>
      <p className="text-[11px] opacity-90">{rotulo}</p>
    </div>
  );
}

function Indicador({
  icone: Icone,
  valor,
  rotulo,
}: {
  icone: React.ElementType;
  valor: number;
  rotulo: string;
}) {
  return (
    <div className="surface p-4">
      <Icone className="size-5 text-primary" />
      <p className="mt-2 text-2xl font-extrabold">{valor}</p>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
    </div>
  );
}
