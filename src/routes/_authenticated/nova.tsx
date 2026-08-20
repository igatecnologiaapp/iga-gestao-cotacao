import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useCotacoes,
  useFornecedores,
  useInvalidateAll,
  agruparProdutos,
  type Fornecedor,
} from "@/lib/queries";
import { STATUS_OPTIONS, brl, normalize, parseValor } from "@/lib/cotacao";
import { FornecedorForm } from "@/components/FornecedorForm";
import { ItemFields, DRAFT_VAZIO, type Draft } from "@/components/ItemFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/nova")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { fornecedor?: string; copiar?: string; item?: string } => ({
    ...(typeof search["fornecedor"] === "string"
      ? { fornecedor: search["fornecedor"] as string }
      : {}),
    ...(typeof search["copiar"] === "string" ? { copiar: search["copiar"] as string } : {}),
    ...(typeof search["item"] === "string" ? { item: search["item"] as string } : {}),
  }),

  head: () => ({
    meta: [
      { title: "Nova cotação — Cotação Rápida" },
      { name: "description", content: "Registre fornecedor, produtos, preços e condições." },
      { property: "og:title", content: "Nova cotação — Cotação Rápida" },
      { property: "og:description", content: "Registre uma cotação em segundos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovaCotacao,
});

function Etapa({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="brand-gradient flex size-6 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
        {numero}
      </span>
      <h2 className="text-sm font-extrabold uppercase tracking-wide">{titulo}</h2>
    </div>
  );
}

function NovaCotacao() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: fornecedores = [] } = useFornecedores();
  const { data: cotacoes = [] } = useCotacoes();
  const invalidar = useInvalidateAll();

  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [buscaFornecedor, setBuscaFornecedor] = useState("");
  const [novoFornecedor, setNovoFornecedor] = useState(false);
  const [itens, setItens] = useState<Draft[]>([]);
  const [draft, setDraft] = useState<Draft>(DRAFT_VAZIO);
  const [status, setStatus] = useState("em_pesquisa");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [prefillFeito, setPrefillFeito] = useState(false);

  const produtosConhecidos = useMemo(() => agruparProdutos(cotacoes), [cotacoes]);

  useEffect(() => {
    if (search.fornecedor) setFornecedorId((atual) => atual || search.fornecedor!);
  }, [search.fornecedor]);

  useEffect(() => {
    if (prefillFeito || !cotacoes.length) return;
    if (search.copiar) {
      const origem = cotacoes.find((c) => c.id === search.copiar);
      if (origem) {
        setFornecedorId(origem.fornecedor_id);
        setItens(
          (origem.itens ?? []).map((i) => ({
            ...DRAFT_VAZIO,
            codigo: i.codigo ?? "",
            descricao: i.descricao,
            quantidade: String(i.quantidade ?? 1),
            unidade: i.unidade ?? "UN",
            marca: i.marca ?? "",
            modelo: i.modelo ?? "",
            interesse: i.interesse,
          })),
        );
        setPrefillFeito(true);
      }
    } else if (search.item) {
      const item = cotacoes.flatMap((c) => c.itens ?? []).find((i) => i.id === search.item);
      if (item) {
        setDraft({
          ...DRAFT_VAZIO,
          codigo: item.codigo ?? "",
          descricao: item.descricao,
          quantidade: String(item.quantidade ?? 1),
          unidade: item.unidade ?? "UN",
          marca: item.marca ?? "",
          modelo: item.modelo ?? "",
          interesse: item.interesse,
        });
        setPrefillFeito(true);
      }
    }
  }, [cotacoes, search.copiar, search.item, prefillFeito]);

  const fornecedorSelecionado = fornecedores.find((f) => f.id === fornecedorId) ?? null;

  const sugestoesFornecedor = useMemo(() => {
    const termo = normalize(buscaFornecedor);
    const lista = termo
      ? fornecedores.filter(
          (f) =>
            normalize(f.nome).includes(termo) ||
            normalize(f.segmento_nome ?? "").includes(termo) ||
            normalize(f.bairro).includes(termo),
        )
      : fornecedores;
    return lista.slice(0, 8);
  }, [fornecedores, buscaFornecedor]);

  const sugestoesProduto = useMemo(() => {
    const termo = normalize(draft.descricao);
    if (termo.length < 2) return [];
    return produtosConhecidos
      .filter((p) => normalize(p.descricao).includes(termo) && normalize(p.descricao) !== termo)
      .slice(0, 5)
      .map((p) => p.descricao);
  }, [draft.descricao, produtosConhecidos]);

  function adicionarItem() {
    const valor = parseValor(draft.valor);
    if (!draft.descricao.trim()) {
      toast.error("Informe a descrição do produto.");
      return;
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }
    setItens((lista) => [...lista, { ...draft, descricao: draft.descricao.trim() }]);
    setDraft(DRAFT_VAZIO);
    toast.success("Produto adicionado.");
  }

  async function salvar() {
    if (!fornecedorId) {
      toast.error("Selecione o fornecedor.");
      return;
    }
    const lista = [...itens];
    if (draft.descricao.trim() && parseValor(draft.valor) > 0) {
      lista.push({ ...draft, descricao: draft.descricao.trim() });
    }
    if (!lista.length) {
      toast.error("Adicione ao menos um produto com valor.");
      return;
    }
    setSalvando(true);
    try {
      // Gravação atômica: cotação + itens em uma única transação (RPC).
      const itensPayload = lista.map((d) => ({
        codigo: d.codigo.trim(),
        descricao: d.descricao.trim(),
        valor: parseValor(d.valor),
        quantidade: d.quantidade ? parseValor(d.quantidade) || 1 : 1,
        unidade: d.unidade,
        marca: d.marca.trim(),
        modelo: d.modelo.trim(),
        garantia: d.garantia.trim(),
        pagamento: d.pagamento.trim(),
        qtd_minima: d.qtd_minima ? String(parseValor(d.qtd_minima)) : "",
        prazo_entrega: d.prazo_entrega.trim(),
        frete: d.frete.trim(),
        observacoes: d.observacoes.trim(),
        interesse: d.interesse,
        oportunidade: d.oportunidade,
      }));

      const { data: novoId, error } = await supabase.rpc("criar_cotacao_completa", {
        p_fornecedor_id: fornecedorId,
        p_status: status,
        p_observacoes: observacoes.trim() || null,
        p_itens: itensPayload,
      });
      if (error) throw error;

      invalidar();
      toast.success("Cotação salva!");
      navigate({ to: "/cotacoes/$id", params: { id: novoId as string } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cotação.");
    } finally {
      setSalvando(false);
    }
  }

  const total = itens.reduce(
    (s, i) => s + (parseValor(i.valor) || 0) * (parseValor(i.quantidade) || 1),
    0,
  );

  return (
    <div className="space-y-4 pb-8">
      <h1 className="text-2xl font-extrabold tracking-tight">Nova cotação</h1>

      <section className="surface p-4">
        <Etapa numero={1} titulo="Fornecedor" />
        {fornecedorSelecionado ? (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary p-3">
            <div>
              <p className="font-bold">{fornecedorSelecionado.nome}</p>
              <p className="text-xs text-muted-foreground">
                {fornecedorSelecionado.segmento_nome} · {fornecedorSelecionado.bairro}/
                {fornecedorSelecionado.uf}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFornecedorId("")}>
              Trocar
            </Button>
          </div>
        ) : novoFornecedor ? (
          <div className="mt-3">
            <FornecedorForm
              onSaved={(f: Fornecedor) => {
                setFornecedorId(f.id);
                setNovoFornecedor(false);
              }}
              onCancel={() => setNovoFornecedor(false)}
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-12 pl-9"
                placeholder="Buscar fornecedor cadastrado"
                value={buscaFornecedor}
                onChange={(e) => setBuscaFornecedor(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              {sugestoesFornecedor.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFornecedorId(f.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-3 text-left"
                >
                  <span>
                    <span className="block font-semibold">{f.nome}</span>
                    <span className="block text-xs text-muted-foreground">
                      {f.segmento_nome} — {f.bairro}/{f.uf}
                    </span>
                  </span>
                  <Check className="size-4 text-primary" />
                </button>
              ))}
              {!fornecedores.length && (
                <p className="text-sm text-muted-foreground">
                  Nenhum fornecedor cadastrado ainda.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="h-12 w-full font-semibold"
              onClick={() => setNovoFornecedor(true)}
            >
              <Plus className="size-4" /> Cadastrar novo fornecedor
            </Button>
          </div>
        )}
      </section>

      <section className="surface p-4">
        <Etapa numero={2} titulo="Produtos e condições" />

        {itens.length > 0 && (
          <ul className="mt-3 space-y-2">
            {itens.map((i, idx) => (
              <li
                key={`${i.descricao}-${idx}`}
                className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{i.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {brl(parseValor(i.valor))} · {i.quantidade} {i.unidade}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setItens((l) => l.filter((_, k) => k !== idx))}
                  aria-label="Remover produto"
                  className="p-2 text-muted-foreground"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3">
          <ItemFields draft={draft} setDraft={setDraft} sugestoes={sugestoesProduto} />
          <Button variant="outline" className="mt-3 h-12 w-full font-bold" onClick={adicionarItem}>
            <Plus className="size-4" /> Adicionar produto
          </Button>
        </div>
      </section>

      <section className="surface space-y-3 p-4">
        <Etapa numero={3} titulo="Status e observações" />
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Status
          </Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Observação rápida
          </Label>
          <Textarea
            placeholder="Ex.: preço pode cair para R$ 8,50 acima de 100 unidades."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            maxLength={1000}
          />
        </div>
      </section>

      <div className="sticky bottom-20 z-20 md:bottom-4">
        <Button
          onClick={salvar}
          disabled={salvando}
          className="h-14 w-full rounded-xl text-base font-extrabold shadow-[var(--shadow-float)]"
        >
          Salvar cotação {total > 0 ? `· ${brl(total)}` : ""}
        </Button>
      </div>
    </div>
  );
}
