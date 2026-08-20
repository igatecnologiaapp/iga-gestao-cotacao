import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, ChevronDown, Plus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useCotacoes,
  useFornecedores,
  useInvalidateAll,
  agruparProdutos,
  type Fornecedor,
} from "@/lib/queries";
import { STATUS_OPTIONS, UNIDADES, brl, normalize, parseValor } from "@/lib/cotacao";
import { FornecedorForm } from "@/components/FornecedorForm";
import { InteresseSelect } from "@/components/InteresseSelect";
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
  validateSearch: (search: Record<string, unknown>) => ({
    fornecedor: typeof search["fornecedor"] === "string" ? (search["fornecedor"] as string) : undefined,
    copiar: typeof search["copiar"] === "string" ? (search["copiar"] as string) : undefined,
    item: typeof search["item"] === "string" ? (search["item"] as string) : undefined,
  }),
  component: NovaCotacao,
});

type Draft = {
  codigo: string;
  descricao: string;
  valor: string;
  quantidade: string;
  unidade: string;
  marca: string;
  modelo: string;
  garantia: string;
  pagamento: string;
  qtd_minima: string;
  prazo_entrega: string;
  frete: string;
  observacoes: string;
  interesse: number;
  oportunidade: boolean;
};

const DRAFT_VAZIO: Draft = {
  codigo: "",
  descricao: "",
  valor: "",
  quantidade: "1",
  unidade: "UN",
  marca: "",
  modelo: "",
  garantia: "",
  pagamento: "",
  qtd_minima: "",
  prazo_entrega: "",
  frete: "",
  observacoes: "",
  interesse: 3,
  oportunidade: false,
};

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

  // Pré-preenchimento: "cotar novamente" ou "cotar em outro fornecedor"
  useEffect(() => {
    if (prefillFeito || !cotacoes.length) return;
    if (search.fornecedor) setFornecedorId(search.fornecedor);
    if (search.copiar) {
      const origem = cotacoes.find((c) => c.id === search.copiar);
      if (origem) {
        setFornecedorId(origem.fornecedor_id);
        setItens(
          (origem.itens ?? []).map((i) => ({
            ...DRAFT_VAZIO,
            codigo: i.codigo ?? "",
            descricao: i.descricao,
            valor: "",
            quantidade: String(i.quantidade ?? 1),
            unidade: i.unidade ?? "UN",
            marca: i.marca ?? "",
            modelo: i.modelo ?? "",
            interesse: i.interesse,
          })),
        );
        setPrefillFeito(true);
      }
    }
    if (search.item) {
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
  }, [cotacoes, search, prefillFeito]);

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
      .slice(0, 5);
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
      const { data: cot, error } = await supabase
        .from("cotacoes")
        .insert({
          fornecedor_id: fornecedorId,
          status,
          observacoes: observacoes.trim() || null,
        })
        .select()
        .single();
      if (error) throw error;

      const payload = lista.map((d) => ({
        cotacao_id: cot.id,
        codigo: d.codigo.trim() || null,
        descricao: d.descricao.trim(),
        valor: parseValor(d.valor),
        quantidade: d.quantidade ? parseValor(d.quantidade) : 1,
        unidade: d.unidade,
        marca: d.marca.trim() || null,
        modelo: d.modelo.trim() || null,
        garantia: d.garantia.trim() || null,
        pagamento: d.pagamento.trim() || null,
        qtd_minima: d.qtd_minima ? parseValor(d.qtd_minima) : null,
        prazo_entrega: d.prazo_entrega.trim() || null,
        frete: d.frete.trim() || null,
        observacoes: d.observacoes.trim() || null,
        interesse: d.interesse,
        oportunidade: d.oportunidade,
      }));
      const { error: erroItens } = await supabase.from("itens_cotacao").insert(payload);
      if (erroItens) throw erroItens;

      invalidar();
      toast.success("Cotação salva!");
      navigate({ to: "/cotacoes/$id", params: { id: cot.id } });
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

      {/* Etapa 1 — fornecedor */}
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
                <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado ainda.</p>
              )}
            </div>
            <Button variant="outline" className="h-12 w-full font-semibold" onClick={() => setNovoFornecedor(true)}>
              <Plus className="size-4" /> Cadastrar novo fornecedor
            </Button>
          </div>
        )}
      </section>

      {/* Etapa 2/3/4 — produtos */}
      <section className="surface p-4">
        <Etapa numero={2} titulo="Produtos e condições" />

        {itens.length > 0 && (
          <ul className="mt-3 space-y-2">
            {itens.map((i, idx) => (
              <li key={idx} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
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
          <ItemFields
            draft={draft}
            setDraft={setDraft}
            sugestoes={sugestoesProduto.map((p) => p.descricao)}
          />
          <Button variant="outline" className="mt-3 h-12 w-full font-bold" onClick={adicionarItem}>
            <Plus className="size-4" /> Adicionar produto
          </Button>
        </div>
      </section>

      {/* Etapa 5 — salvar */}
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
          Salvar cotação {total > 0 && `· ${brl(total)}`}
        </Button>
      </div>
    </div>
  );
}

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

export function ItemFields({
  draft,
  setDraft,
  sugestoes = [],
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  sugestoes?: string[];
}) {
  const [avancado, setAvancado] = useState(false);
  const set = (campo: keyof Draft) => (valor: string | number | boolean) =>
    setDraft((d) => ({ ...d, [campo]: valor }));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Descrição do produto *
        </Label>
        <Input
          className="h-12"
          placeholder="Ex.: Lâmpada LED 9W"
          value={draft.descricao}
          onChange={(e) => set("descricao")(e.target.value)}
          maxLength={160}
        />
        {sugestoes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {sugestoes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("descricao")(s)}
                className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Valor *
          </Label>
          <Input
            className="h-12"
            inputMode="decimal"
            placeholder="0,00"
            value={draft.valor}
            onChange={(e) => set("valor")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Quantidade
          </Label>
          <Input
            className="h-12"
            inputMode="decimal"
            value={draft.quantidade}
            onChange={(e) => set("quantidade")(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Unidade
          </Label>
          <Select value={draft.unidade} onValueChange={(v) => set("unidade")(v)}>
            <SelectTrigger className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIDADES.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Código
          </Label>
          <Input
            className="h-12"
            value={draft.codigo}
            onChange={(e) => set("codigo")(e.target.value)}
            maxLength={60}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Interesse de compra
        </Label>
        <InteresseSelect value={draft.interesse} onChange={(v) => set("interesse")(v)} />
      </div>

      <label className="flex items-center gap-2 rounded-lg bg-accent/15 px-3 py-2.5 text-sm font-semibold">
        <input
          type="checkbox"
          className="size-5 accent-[var(--accent)]"
          checked={draft.oportunidade}
          onChange={(e) => set("oportunidade")(e.target.checked)}
        />
        Marcar como oportunidade
      </label>

      <button
        type="button"
        onClick={() => setAvancado((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg bg-secondary px-3 py-2.5 text-sm font-semibold"
      >
        Condições comerciais
        <ChevronDown className={avancado ? "size-4 rotate-180" : "size-4"} />
      </button>

      {avancado && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Marca">
              <Input className="h-12" value={draft.marca} onChange={(e) => set("marca")(e.target.value)} maxLength={80} />
            </Campo>
            <Campo label="Modelo">
              <Input className="h-12" value={draft.modelo} onChange={(e) => set("modelo")(e.target.value)} maxLength={80} />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Pagamento">
              <Input className="h-12" placeholder="PIX, 28 dias..." value={draft.pagamento} onChange={(e) => set("pagamento")(e.target.value)} maxLength={80} />
            </Campo>
            <Campo label="Compra mínima">
              <Input className="h-12" inputMode="decimal" value={draft.qtd_minima} onChange={(e) => set("qtd_minima")(e.target.value)} />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Prazo de entrega">
              <Input className="h-12" value={draft.prazo_entrega} onChange={(e) => set("prazo_entrega")(e.target.value)} maxLength={80} />
            </Campo>
            <Campo label="Frete">
              <Input className="h-12" value={draft.frete} onChange={(e) => set("frete")(e.target.value)} maxLength={80} />
            </Campo>
          </div>
          <Campo label="Garantia">
            <Input className="h-12" value={draft.garantia} onChange={(e) => set("garantia")(e.target.value)} maxLength={80} />
          </Campo>
          <Campo label="Observações do produto">
            <Textarea value={draft.observacoes} onChange={(e) => set("observacoes")(e.target.value)} maxLength={1000} />
          </Campo>
        </div>
      )}
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export type { Draft };
export const DraftVazio = DRAFT_VAZIO;
export const IconX = X;
