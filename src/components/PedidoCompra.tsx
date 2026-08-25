import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CheckCircle2, Mail, MessageCircle, ShoppingCart, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  useInvalidateAll,
  usePedidos,
  type CotacaoFull,
  type Pedido,
  type PedidoItem,
} from "@/lib/queries";
import { brl, dataHora, parseValor, whatsappLink } from "@/lib/cotacao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const CANAIS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "presencial", label: "Presencial" },
  { value: "outro", label: "Outro" },
];

function condicoesDoItem(i: CotacaoFull["itens"][number]) {
  return [
    i.pagamento ? `pagamento ${i.pagamento}` : "",
    i.qtd_minima ? `mínimo ${i.qtd_minima} ${i.unidade ?? "UN"}` : "",
    i.prazo_entrega ? `entrega ${i.prazo_entrega}` : "",
    i.frete ? `frete ${i.frete}` : "",
    i.garantia ? `garantia ${i.garantia}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function montarMensagem(cot: CotacaoFull, itens: PedidoItem[], total: number) {
  const linhas = itens.map(
    (i) =>
      `• ${i.descricao} — ${i.quantidade} ${i.unidade} x ${brl(i.valor)} / ${i.unidade} = ${brl(i.subtotal)}` +
      (i.condicoes ? `\n   (${i.condicoes})` : ""),
  );
  return [
    `Olá${cot.fornecedor?.vendedor ? `, ${cot.fornecedor.vendedor}` : ""}! Sou cliente e gostaria de confirmar uma cotação.`,
    "",
    `Cotação: ${cot.id.slice(0, 8).toUpperCase()} — ${new Date(cot.created_at).toLocaleDateString("pt-BR")}`,
    `Fornecedor: ${cot.fornecedor?.nome ?? "-"}`,
    "",
    "Produtos que pretendo comprar:",
    ...linhas,
    "",
    `Total estimado: ${brl(total)}`,
    "",
    "Poderia confirmar a disponibilidade e se os preços e condições acima continuam válidos? Obrigado!",
  ].join("\n");
}

export function PedidoCompra({ cot }: { cot: CotacaoFull }) {
  const invalidar = useInvalidateAll();
  const { data: pedidos = [] } = usePedidos();
  const meus = pedidos.filter((p) => p.cotacao_id === cot.id);

  const [abrir, setAbrir] = useState(false);
  const [selecao, setSelecao] = useState<string[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [editado, setEditado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [revisar, setRevisar] = useState<"whatsapp" | "email" | null>(null);


  const itensSelecionados: PedidoItem[] = useMemo(
    () =>
      (cot.itens ?? [])
        .filter((i) => selecao.includes(i.id))
        .map((i) => {
          const quantidade = Number(i.quantidade ?? 1);
          const valor = Number(i.valor);
          return {
            id: i.id,
            descricao: i.descricao,
            quantidade,
            unidade: i.unidade ?? "UN",
            valor,
            subtotal: valor * quantidade,
            condicoes: condicoesDoItem(i),
          };
        }),
    [cot.itens, selecao],
  );
  const total = itensSelecionados.reduce((s, i) => s + i.subtotal, 0);
  const textoAtual =
    editado && mensagem ? mensagem : montarMensagem(cot, itensSelecionados, total);

  /** WhatsApp: usa o número dedicado e, na ausência dele, telefone/contato cadastrado. */
  const zap = whatsappLink(
    cot.fornecedor?.whatsapp ?? cot.fornecedor?.telefone ?? cot.fornecedor?.contato,
  );
  const email = cot.fornecedor?.email;
  const pagamentos = [
    ...new Set(
      (cot.itens ?? [])
        .filter((i) => selecao.includes(i.id) && i.pagamento)
        .map((i) => i.pagamento as string),
    ),
  ];


  async function registrarEnvio(canal: "whatsapp" | "email") {
    if (!itensSelecionados.length) {
      toast.error("Selecione ao menos um produto.");
      return;
    }
    setSalvando(true);
    try {
      const { error } = await supabase.from("pedidos_compra").insert({
        cotacao_id: cot.id,
        fornecedor_id: cot.fornecedor_id,
        itens: itensSelecionados,
        total,
        mensagem: textoAtual,
        canal,
        enviado_em: new Date().toISOString(),
      });
      if (error) throw error;
      invalidar();
      if (canal === "whatsapp" && zap) {
        window.open(`${zap}?text=${encodeURIComponent(textoAtual)}`, "_blank", "noopener");
      } else if (canal === "email" && email) {
        const assunto = `Confirmação de cotação ${cot.id.slice(0, 8).toUpperCase()}`;
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(textoAtual)}`;
      }
      toast.success("Pedido de confirmação preparado. Aguarde a resposta do fornecedor.");
      setAbrir(false);
      setSelecao([]);
      setEditado(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível registrar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
        Intenção de compra
      </h2>

      {!abrir ? (
        <Button variant="outline" className="h-12 w-full font-bold" onClick={() => setAbrir(true)}>
          <ShoppingCart className="size-4" /> Confirmar intenção de compra
        </Button>
      ) : (
        <div className="surface space-y-3 p-4">
          <p className="text-xs text-muted-foreground">
            Selecione os produtos que pretende comprar de {cot.fornecedor?.nome}.
          </p>
          <ul className="space-y-2">
            {(cot.itens ?? []).map((i) => {
              const marcado = selecao.includes(i.id);
              return (
                <li key={i.id}>
                  <label className="flex items-start gap-3 rounded-xl bg-secondary p-3">
                    <Checkbox
                      className="mt-0.5 size-5"
                      checked={marcado}
                      onCheckedChange={(v) => {
                        setEditado(false);
                        setSelecao((l) => (v ? [...l, i.id] : l.filter((x) => x !== i.id)));
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{i.descricao}</span>
                      <span className="block text-xs text-muted-foreground">
                        {i.quantidade} {i.unidade ?? "UN"} × {brl(Number(i.valor))} /{" "}
                        {i.unidade ?? "UN"} ={" "}
                        {brl(Number(i.valor) * Number(i.quantidade ?? 1))}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
            <span className="text-sm font-semibold">Total selecionado</span>
            <span className="text-base font-extrabold">{brl(total)}</span>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Mensagem (revise antes de enviar)
            </Label>
            <Textarea
              rows={10}
              value={textoAtual}
              onChange={(e) => {
                setEditado(true);
                setMensagem(e.target.value);
              }}
            />
          </div>

          <div className="grid gap-2">
            <Button
              className="h-12 font-bold"
              disabled={salvando || !zap || !itensSelecionados.length}
              onClick={() => setRevisar("whatsapp")}
            >
              <MessageCircle className="size-4" /> Enviar pedido pelo WhatsApp
            </Button>
            {!zap && (
              <p className="text-xs text-muted-foreground">
                Fornecedor sem WhatsApp/telefone cadastrado.{" "}
                <Link to="/fornecedores" className="font-semibold underline">
                  Editar fornecedor
                </Link>{" "}
                ou registre a confirmação manualmente depois de falar com ele.
              </p>
            )}
            <Button
              variant="outline"
              className="h-12 font-bold"
              disabled={salvando || !email || !itensSelecionados.length}
              onClick={() => setRevisar("email")}
            >
              <Mail className="size-4" /> Enviar pedido por e-mail
            </Button>
            {!email && (
              <p className="text-xs text-muted-foreground">
                Fornecedor sem e-mail cadastrado.{" "}
                <Link to="/fornecedores" className="font-semibold underline">
                  Editar fornecedor
                </Link>
                .
              </p>
            )}
            <Button
              variant="outline"
              className="h-11 font-bold"
              disabled={salvando || !itensSelecionados.length}
              onClick={() => registrarEnvio("manual")}
            >
              Registrar pedido sem envio (contato manual)
            </Button>
            <Button variant="ghost" className="h-11" onClick={() => setAbrir(false)}>
              Cancelar

            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enviar a mensagem não significa que o fornecedor confirmou. A confirmação é registrada
            manualmente depois da resposta dele.
          </p>
        </div>
      )}

      {meus.map((p) => (
        <PedidoCard key={p.id} pedido={p} />
      ))}
    </section>
  );
}

function PedidoCard({ pedido }: { pedido: Pedido }) {
  const invalidar = useInvalidateAll();
  const itens = (pedido.itens as unknown as PedidoItem[]) ?? [];
  const [canal, setCanal] = useState("whatsapp");
  const [obs, setObs] = useState("");
  const [prevista, setPrevista] = useState(pedido.entrega_prevista ?? "");
  const [entregue, setEntregue] = useState(pedido.entrega_realizada ?? "");
  const [obsEntrega, setObsEntrega] = useState(pedido.observacao_entrega ?? "");
  const [salvando, setSalvando] = useState(false);

  async function atualizar(
    campos: Database["public"]["Tables"]["pedidos_compra"]["Update"],
    msg: string,
  ) {
    setSalvando(true);
    const { error } = await supabase.from("pedidos_compra").update(campos).eq("id", pedido.id);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar.");
      return;
    }
    invalidar();
    toast.success(msg);
  }

  const etapa = pedido.entrega_realizada
    ? "Entrega realizada"
    : pedido.entrega_prevista
      ? "Entrega prevista"
      : pedido.fornecedor_confirmado
        ? "Compra confirmada"
        : "Aguardando confirmação do fornecedor";

  return (
    <article className="surface space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-extrabold">{etapa}</p>
          <p className="text-xs text-muted-foreground">
            Pedido preparado {pedido.enviado_em ? dataHora(pedido.enviado_em) : "—"} ·{" "}
            {pedido.canal === "email" ? "E-mail" : "WhatsApp"}
          </p>
        </div>
        <span className="shrink-0 text-base font-extrabold">{brl(Number(pedido.total))}</span>
      </div>

      <ul className="space-y-1 text-xs text-muted-foreground">
        {itens.map((i) => (
          <li key={i.id}>
            {i.descricao} — {i.quantidade} {i.unidade} × {brl(i.valor)} = {brl(i.subtotal)}
          </li>
        ))}
      </ul>

      {!pedido.fornecedor_confirmado ? (
        <div className="space-y-2 rounded-xl bg-secondary p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Registrar confirmação do fornecedor
          </p>
          <Select value={canal} onValueChange={setCanal}>
            <SelectTrigger className="h-11 w-full bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANAIS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            className="bg-background"
            placeholder="Observação (ex.: preço ajustado para R$ 8,50)"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            maxLength={1000}
          />
          <Button
            className="h-11 w-full font-bold"
            disabled={salvando}
            onClick={() =>
              atualizar(
                {
                  fornecedor_confirmado: true,
                  confirmado_em: new Date().toISOString(),
                  canal_confirmacao: canal,
                  observacao_confirmacao: obs.trim() || null,
                },
                "Compra confirmada pelo fornecedor.",
              )
            }
          >
            <CheckCircle2 className="size-4" /> Fornecedor confirmou
          </Button>
        </div>
      ) : (
        <div className="space-y-2 rounded-xl bg-secondary p-3">
          <p className="text-xs font-semibold text-success">
            Compra confirmada em {pedido.confirmado_em ? dataHora(pedido.confirmado_em) : "—"} via{" "}
            {pedido.canal_confirmacao}
          </p>
          {pedido.observacao_confirmacao && (
            <p className="text-xs text-muted-foreground">{pedido.observacao_confirmacao}</p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Data prevista de entrega
            </Label>
            <div className="flex gap-2">
              <Input
                type="date"
                className="h-11 bg-background"
                value={prevista}
                onChange={(e) => setPrevista(e.target.value)}
              />
              <Button
                variant="outline"
                className="h-11"
                disabled={salvando || !prevista}
                onClick={() => atualizar({ entrega_prevista: prevista }, "Previsão registrada.")}
              >
                Salvar
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Entrega realizada
            </Label>
            <Input
              type="date"
              className="h-11 bg-background"
              value={entregue}
              onChange={(e) => setEntregue(e.target.value)}
            />
            <Textarea
              className="bg-background"
              placeholder="Observação / ocorrência na entrega"
              value={obsEntrega}
              onChange={(e) => setObsEntrega(e.target.value)}
              maxLength={1000}
            />
            <Button
              className="h-11 w-full font-bold"
              disabled={salvando || !entregue}
              onClick={() =>
                atualizar(
                  {
                    entrega_realizada: entregue,
                    observacao_entrega: obsEntrega.trim() || null,
                  },
                  "Entrega registrada.",
                )
              }
            >
              <Truck className="size-4" /> Confirmar entrega
            </Button>
            {pedido.entrega_realizada && (
              <p className="text-xs text-success">
                Entregue em{" "}
                {new Date(`${pedido.entrega_realizada}T12:00:00`).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
