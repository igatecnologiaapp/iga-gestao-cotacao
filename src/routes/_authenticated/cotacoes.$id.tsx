import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Archive, ArrowLeft, Copy, MessageCircle, Repeat, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCotacoes, useInvalidateAll, totalCotacao } from "@/lib/queries";
import {
  STATUS_OPTIONS,
  brl,
  dataHora,
  interesseLabel,
  precoUnidade,
  whatsappLink,
} from "@/lib/cotacao";
import { PedidoCompra } from "@/components/PedidoCompra";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/cotacoes/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da cotação — Cotação Rápida" },
      { name: "description", content: "Produtos, condições comerciais e status da cotação." },
      { property: "og:title", content: "Detalhe da cotação" },
      { property: "og:description", content: "Produtos e condições comerciais da cotação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DetalheCotacao,
});

function DetalheCotacao() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: cotacoes = [], isLoading } = useCotacoes();
  const invalidar = useInvalidateAll();
  const cot = cotacoes.find((c) => c.id === id);

  async function mudarStatus(status: string) {
    const { error } = await supabase.from("cotacoes").update({ status }).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar o status.");
      return;
    }
    invalidar();
    toast.success("Status atualizado.");
  }

  async function alternarOportunidade(itemId: string, atual: boolean) {
    const { error } = await supabase
      .from("itens_cotacao")
      .update({ oportunidade: !atual })
      .eq("id", itemId);
    if (error) {
      toast.error("Não foi possível atualizar.");
      return;
    }
    invalidar();
  }

  async function arquivar() {
    const { error } = await supabase
      .from("cotacoes")
      .update({ status: "arquivada" })
      .eq("id", id);
    if (error) {
      toast.error("Não foi possível arquivar.");
      return;
    }
    invalidar();
    toast.success("Cotação arquivada — o histórico foi preservado.");
    navigate({ to: "/cotacoes" });
  }

  async function excluir() {
    const { error } = await supabase.from("cotacoes").delete().eq("id", id);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    invalidar();
    toast.success("Cotação excluída.");
    navigate({ to: "/cotacoes" });
  }

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!cot) {
    return (
      <div className="surface p-6 text-center">
        <p className="text-sm text-muted-foreground">Cotação não encontrada.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/cotacoes">Voltar</Link>
        </Button>
      </div>
    );
  }

  const zap = whatsappLink(cot.fornecedor?.whatsapp ?? cot.fornecedor?.contato);

  return (
    <div className="space-y-4 pb-6">
      <Link to="/cotacoes" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="size-4" /> Cotações
      </Link>

      <section className="surface p-4">
        <h1 className="text-xl font-extrabold tracking-tight">{cot.fornecedor?.nome}</h1>
        <p className="text-sm text-muted-foreground">
          {cot.fornecedor?.segmento_nome} · {cot.fornecedor?.bairro}/{cot.fornecedor?.uf}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Criada {dataHora(cot.created_at)} · Atualizada {dataHora(cot.updated_at)}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {zap && (
            <Button asChild variant="outline" className="h-11">
              <a href={zap} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </Button>
          )}
          <Button asChild variant="outline" className="h-11">
            <Link to="/nova" search={{ copiar: cot.id }}>
              <Repeat className="size-4" /> Cotar novamente
            </Link>
          </Button>
        </div>

        <div className="mt-3">
          <Select value={cot.status} onValueChange={mudarStatus}>
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

        {cot.observacoes && (
          <p className="mt-3 rounded-lg bg-secondary p-3 text-sm">{cot.observacoes}</p>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
            Produtos ({cot.itens?.length ?? 0})
          </h2>
          <span className="text-sm font-extrabold">{brl(totalCotacao(cot))}</span>
        </div>
        {(cot.itens ?? []).map((item) => (
          <article key={item.id} className="surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{item.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantidade} {item.unidade}
                  {item.codigo ? ` · cód. ${item.codigo}` : ""}
                  {item.marca ? ` · ${item.marca}` : ""}
                </p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block text-lg font-extrabold text-primary">
                  {precoUnidade(Number(item.valor), item.unidade)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  subtotal {brl(Number(item.valor) * Number(item.quantidade ?? 1))}
                </span>
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {item.pagamento && <Tag>Pagamento: {item.pagamento}</Tag>}
              {item.qtd_minima && <Tag>Mínimo: {item.qtd_minima}</Tag>}
              {item.prazo_entrega && <Tag>Entrega: {item.prazo_entrega}</Tag>}
              {item.frete && <Tag>Frete: {item.frete}</Tag>}
              {item.garantia && <Tag>Garantia: {item.garantia}</Tag>}
              <Tag>Interesse: {interesseLabel(item.interesse)}</Tag>
            </div>

            {item.observacoes && (
              <p className="mt-2 rounded-lg bg-secondary p-2.5 text-sm">{item.observacoes}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant={item.oportunidade ? "default" : "outline"}
                size="sm"
                className="h-10"
                onClick={() => alternarOportunidade(item.id, item.oportunidade)}
              >
                <Star className="size-4" /> {item.oportunidade ? "Oportunidade" : "Marcar oportunidade"}
              </Button>
              <Button asChild variant="outline" size="sm" className="h-10">
                <Link to="/nova" search={{ item: item.id }}>
                  <Copy className="size-4" /> Cotar em outro fornecedor
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </section>

      <PedidoCompra cot={cot} />

      <div className="space-y-2 pt-2">
        <Button variant="outline" className="h-12 w-full font-bold" onClick={arquivar}>
          <Archive className="size-4" /> Arquivar cotação
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Arquivar preserva o histórico e mantém a cotação disponível nas análises.
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="mt-4 w-full py-2 text-center text-xs font-semibold text-muted-foreground underline"
            >
              <Trash2 className="mr-1 inline size-3" /> Excluir definitivamente
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir esta cotação?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta operação é irreversível: a cotação, seus produtos e o histórico de preços
                correspondente serão perdidos. Prefira arquivar para manter o histórico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={excluir}
              >
                Excluir mesmo assim
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
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
