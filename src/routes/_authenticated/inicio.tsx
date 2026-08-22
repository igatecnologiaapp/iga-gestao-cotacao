import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Star, Store, Package, TrendingDown, ChevronRight } from "lucide-react";
import { useCotacoes, agruparProdutos, totalCotacao, type CotacaoFull } from "@/lib/queries";
import { brl, dataHora, dataCurta, normalize } from "@/lib/cotacao";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

type Detalhe = {
  titulo: string;
  descricao: string;
  linhas: Array<{
    id: string;
    titulo: string;
    subtitulo?: string;
    valor?: string;
    conteudo?: ReactNode;
  }>;
};

function Inicio() {
  const { data: cotacoes = [], isLoading } = useCotacoes();
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);

  const hoje = new Date().toDateString();
  const doDia = cotacoes.filter((c) => new Date(c.created_at).toDateString() === hoje);
  const itensHoje = doDia.flatMap((c) => (c.itens ?? []).map((i) => ({ item: i, cotacao: c })));
  const fornecedoresHoje = [
    ...new Map(doDia.map((c) => [c.fornecedor_id, c])).values(),
  ];
  const oportunidades = cotacoes.flatMap((c) =>
    (c.itens ?? []).filter((i) => i.oportunidade).map((i) => ({ item: i, cotacao: c })),
  );

  const grupos = agruparProdutos(cotacoes);
  const comparaveis = grupos.filter((g) => g.registros.length > 1);
  const fornecedores = [...new Map(cotacoes.map((c) => [c.fornecedor_id, c])).values()];
  const maiorInteresse = grupos.filter((g) => g.interesse >= 4).slice(0, 4);

  const linhasCotacoes = (lista: CotacaoFull[]) =>
    lista.map((c) => ({
      id: c.id,
      titulo: c.fornecedor?.nome ?? "Fornecedor",
      subtitulo: `${c.itens?.length ?? 0} produtos · ${dataHora(c.created_at)}`,
      valor: brl(totalCotacao(c)),
    }));

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
          <Mini
            valor={itensHoje.length}
            rotulo="produtos hoje"
            onClick={() =>
              setDetalhe({
                titulo: "Produtos cotados hoje",
                descricao: `${itensHoje.length} produto(s) registrado(s) hoje.`,
                linhas: itensHoje.map(({ item, cotacao }) => ({
                  id: item.id,
                  titulo: item.descricao,
                  subtitulo: `${cotacao.fornecedor?.nome ?? "Fornecedor"} · ${item.quantidade ?? 1} ${item.unidade ?? "UN"}`,
                  valor: brl(Number(item.valor)),
                })),
              })
            }
          />
          <Mini
            valor={fornecedoresHoje.length}
            rotulo="fornecedores"
            onClick={() =>
              setDetalhe({
                titulo: "Fornecedores pesquisados hoje",
                descricao: `${fornecedoresHoje.length} fornecedor(es) visitado(s) hoje.`,
                linhas: fornecedoresHoje.map((c) => ({
                  id: c.fornecedor_id,
                  titulo: c.fornecedor?.nome ?? "Fornecedor",
                  subtitulo: [c.fornecedor?.bairro, c.fornecedor?.uf].filter(Boolean).join(" · "),
                })),
              })
            }
          />
          <Mini
            valor={oportunidades.length}
            rotulo="oportunidades"
            onClick={() =>
              setDetalhe({
                titulo: "Oportunidades encontradas",
                descricao: "Itens marcados como oportunidade de compra.",
                linhas: oportunidades.map(({ item, cotacao }) => ({
                  id: item.id,
                  titulo: item.descricao,
                  subtitulo: `${cotacao.fornecedor?.nome ?? "Fornecedor"} · ${dataCurta(cotacao.created_at)}`,
                  valor: brl(Number(item.valor)),
                })),
              })
            }
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Indicador
          icone={Package}
          valor={cotacoes.length}
          rotulo="Cotações realizadas"
          onClick={() =>
            setDetalhe({
              titulo: "Cotações realizadas",
              descricao: "Todas as cotações registradas.",
              linhas: linhasCotacoes(cotacoes),
            })
          }
        />
        <Indicador
          icone={Store}
          valor={fornecedores.length}
          rotulo="Fornecedores pesquisados"
          onClick={() =>
            setDetalhe({
              titulo: "Fornecedores pesquisados",
              descricao: "Fornecedores com ao menos uma cotação.",
              linhas: fornecedores.map((c) => ({
                id: c.fornecedor_id,
                titulo: c.fornecedor?.nome ?? "Fornecedor",
                subtitulo: [
                  c.fornecedor?.segmento_nome,
                  c.fornecedor?.bairro,
                  c.fornecedor?.uf,
                ]
                  .filter(Boolean)
                  .join(" · "),
                valor: `${cotacoes.filter((x) => x.fornecedor_id === c.fornecedor_id).length} cotações`,
              })),
            })
          }
        />
        <Indicador
          icone={Package}
          valor={grupos.length}
          rotulo="Produtos pesquisados"
          onClick={() =>
            setDetalhe({
              titulo: "Produtos pesquisados",
              descricao: "Produtos distintos já cotados.",
              linhas: grupos.map((g) => ({
                id: g.chave,
                titulo: g.descricao,
                subtitulo: `${g.fornecedores} fornecedor(es) · ${g.registros.length} cotações`,
                valor: brl(g.menor),
              })),
            })
          }
        />
        <Indicador
          icone={TrendingDown}
          valor={comparaveis.length}
          rotulo="Itens comparáveis"
          onClick={() =>
            setDetalhe({
              titulo: "Itens comparáveis",
              descricao: "Produtos cotados em mais de um registro.",
              linhas: comparaveis.map((g) => ({
                id: g.chave,
                titulo: g.descricao,
                subtitulo: `Menor ${brl(g.menor)} · Maior ${brl(g.maior)}`,
                valor: `${g.registros.length} preços`,
              })),
            })
          }
        />
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

      <Sheet open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>{detalhe?.titulo}</SheetTitle>
            <SheetDescription>{detalhe?.descricao}</SheetDescription>
          </SheetHeader>
          {detalhe && detalhe.linhas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum registro nesse indicador ainda.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 pb-6">
              {detalhe?.linhas.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-3 rounded-xl bg-secondary p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{l.titulo}</p>
                    {l.subtitulo && (
                      <p className="truncate text-xs text-muted-foreground">{l.subtitulo}</p>
                    )}
                  </div>
                  {l.valor && <span className="shrink-0 text-sm font-extrabold">{l.valor}</span>}
                </li>
              ))}
            </ul>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Mini({
  valor,
  rotulo,
  onClick,
}: {
  valor: number;
  rotulo: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-primary-foreground/15 py-2 text-center transition active:scale-[0.98]"
    >
      <p className="text-xl font-extrabold">{valor}</p>
      <p className="text-[11px] opacity-90">{rotulo}</p>
    </button>
  );
}

function Indicador({
  icone: Icone,
  valor,
  rotulo,
  onClick,
}: {
  icone: React.ElementType;
  valor: number;
  rotulo: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="surface p-4 text-left transition active:scale-[0.99]">
      <div className="flex items-start justify-between">
        <Icone className="size-5 text-primary" />
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-extrabold">{valor}</p>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
    </button>
  );
}
