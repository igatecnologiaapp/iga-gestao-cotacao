import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MoreVertical, Search } from "lucide-react";
import { toast } from "sonner";
import { useCotacoes, agruparProdutos, useInvalidateAll, type ProdutoResumo } from "@/lib/queries";
import { brl, dataCurta, interesseLabel, normalize } from "@/lib/cotacao";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EditarProdutoDialog,
  ExcluirProdutoDialog,
  reativarProduto,
} from "@/components/ProdutoEditor";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos pesquisados — Cotação Rápida" },
      { name: "description", content: "Menor, maior e preço médio de cada produto cotado." },
      { property: "og:title", content: "Produtos pesquisados" },
      { property: "og:description", content: "Análise de preços por produto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Produtos,
});

function Produtos() {
  const { data: cotacoes = [], isLoading } = useCotacoes();
  const invalidar = useInvalidateAll();
  const [termo, setTermo] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [editando, setEditando] = useState<ProdutoResumo | null>(null);
  const [excluindo, setExcluindo] = useState<ProdutoResumo | null>(null);

  const grupos = useMemo(
    () => agruparProdutos(cotacoes, { incluirArquivados: true }),
    [cotacoes],
  );
  const inativos = grupos.filter((g) => g.arquivado).length;

  const lista = useMemo(() => {
    const t = normalize(termo);
    const base = mostrarInativos ? grupos : grupos.filter((g) => !g.arquivado);
    return t ? base.filter((g) => normalize(g.descricao).includes(t)) : base;
  }, [grupos, termo, mostrarInativos]);

  async function reativar(g: ProdutoResumo) {
    try {
      await reativarProduto(g);
      invalidar();
      toast.success("Produto reativado.");
    } catch {
      toast.error("Não foi possível reativar o produto.");
    }
  }

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Produtos pesquisados</h1>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-9"
          placeholder="Buscar produto"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
        />
      </div>

      {inativos > 0 && (
        <button
          type="button"
          className="text-sm font-semibold text-primary"
          onClick={() => setMostrarInativos((v) => !v)}
        >
          {mostrarInativos ? "Ocultar inativos" : `Mostrar inativos (${inativos})`}
        </button>
      )}

      {lista.length === 0 ? (
        <p className="surface p-6 text-center text-sm text-muted-foreground">
          Nenhum produto cotado ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {lista.map((g) => {
            const ultimo = g.registros
              .map((r) => r.cotacao.created_at)
              .sort()
              .at(-1)!;
            return (
              <li key={g.chave} className="surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to="/comparar" search={{ q: g.chave }} className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate font-bold">
                        {g.descricao}
                        {g.arquivado && (
                          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                            Inativo
                          </span>
                        )}
                      </p>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold">
                        {interesseLabel(g.interesse)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {g.fornecedores} fornecedor(es) · {g.registros.length} cotações · última{" "}
                      {dataCurta(ultimo)}
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                      <div className="rounded-lg bg-secondary py-2">
                        <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                          Menor
                        </span>
                        <span className="font-extrabold text-success">{brl(g.menor)}</span>
                      </div>
                      <div className="rounded-lg bg-secondary py-2">
                        <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                          Médio
                        </span>
                        <span className="font-extrabold">{brl(g.medio)}</span>
                      </div>
                      <div className="rounded-lg bg-secondary py-2">
                        <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                          Maior
                        </span>
                        <span className="font-extrabold text-destructive">{brl(g.maior)}</span>
                      </div>
                    </div>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-10 shrink-0"
                        aria-label={`Mais opções — ${g.descricao}`}
                      >
                        <MoreVertical className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditando(g)}>Editar</DropdownMenuItem>
                      {g.arquivado ? (
                        <DropdownMenuItem onSelect={() => reativar(g)}>Reativar</DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setExcluindo(g)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editando && (
        <EditarProdutoDialog
          key={`edit-${editando.chave}`}
          grupo={editando}
          open
          onOpenChange={(v) => !v && setEditando(null)}
        />
      )}
      {excluindo && (
        <ExcluirProdutoDialog
          key={`del-${excluindo.chave}`}
          grupo={excluindo}
          open
          onOpenChange={(v) => !v && setExcluindo(null)}
        />
      )}
    </div>
  );
}
