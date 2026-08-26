import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Plus, Search } from "lucide-react";
import { useCotacoes, useFornecedores, agruparProdutos } from "@/lib/queries";
import { dataCurta, normalize, whatsappLink } from "@/lib/cotacao";
import { FornecedorForm } from "@/components/FornecedorForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Cotação Rápida" },
      { name: "description", content: "Ranking de fornecedores por cotações e menores preços." },
      { property: "og:title", content: "Fornecedores" },
      { property: "og:description", content: "Análise simples dos fornecedores pesquisados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fornecedores,
});

function Fornecedores() {
  const { data: fornecedores = [], isLoading } = useFornecedores();
  const { data: cotacoes = [] } = useCotacoes();
  const [termo, setTermo] = useState("");
  const [novo, setNovo] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const analise = useMemo(() => {
    const grupos = agruparProdutos(cotacoes);
    const stats = new Map<
      string,
      { produtos: number; menores: number; maiores: number; ultima: string | null }
    >();
    const get = (id: string) => {
      let s = stats.get(id);
      if (!s) {
        s = { produtos: 0, menores: 0, maiores: 0, ultima: null };
        stats.set(id, s);
      }
      return s;
    };
    for (const cot of cotacoes) {
      const s = get(cot.fornecedor_id);
      s.produtos += cot.itens?.length ?? 0;
      if (!s.ultima || cot.created_at > s.ultima) s.ultima = cot.created_at;
    }
    for (const g of grupos) {
      if (g.registros.length < 2) continue;
      for (const r of g.registros) {
        const valor = Number(r.item.valor);
        if (valor === g.menor) get(r.cotacao.fornecedor_id).menores += 1;
        else if (valor === g.maior) get(r.cotacao.fornecedor_id).maiores += 1;
      }
    }
    return stats;
  }, [cotacoes]);

  const lista = useMemo(() => {
    const t = normalize(termo);
    const filtrados = t
      ? fornecedores.filter((f) =>
          normalize(`${f.nome} ${f.segmento_nome ?? ""} ${f.bairro} ${f.uf}`).includes(t),
        )
      : fornecedores;
    return [...filtrados].sort(
      (a, b) => (analise.get(b.id)?.produtos ?? 0) - (analise.get(a.id)?.produtos ?? 0),
    );
  }, [fornecedores, termo, analise]);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Fornecedores</h1>

      {novo ? (
        <div className="surface p-4">
          <FornecedorForm onSaved={() => setNovo(false)} onCancel={() => setNovo(false)} />
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 pl-9"
                placeholder="Buscar fornecedor"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
              />
            </div>
            <Button className="h-12" onClick={() => setNovo(true)}>
              <Plus className="size-4" /> Novo
            </Button>
          </div>

          {lista.length === 0 ? (
            <p className="surface p-6 text-center text-sm text-muted-foreground">
              Nenhum fornecedor cadastrado ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {lista.map((f) => {
                const s = analise.get(f.id);
                const zap = whatsappLink(f.whatsapp ?? f.contato);
                return (
                  <li key={f.id} className="surface p-4">
                    {editandoId === f.id ? (
                      <FornecedorForm
                        fornecedor={f}
                        onSaved={() => setEditandoId(null)}
                        onCancel={() => setEditandoId(null)}
                      />
                    ) : (
                      <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-bold">{f.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.segmento_nome} · {f.bairro}/{f.uf}
                        </p>
                      </div>
                      {zap && (
                        <a
                          href={zap}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`WhatsApp de ${f.nome}`}
                          className="shrink-0 rounded-full bg-secondary p-2.5 text-success"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {s?.produtos ?? 0} produtos pesquisados · {s?.menores ?? 0} menores preços ·{" "}
                      {s?.maiores ?? 0} maiores preços
                      {s?.ultima ? ` · última cotação ${dataCurta(s.ultima)}` : ""}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button asChild variant="outline" size="sm" className="h-10">
                        <Link to="/nova" search={{ fornecedor: f.id }}>
                          Nova cotação
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10"
                        onClick={() => setEditandoId(f.id)}
                      >
                        <Pencil className="size-4" /> Editar
                      </Button>
                    </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
