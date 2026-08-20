import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, Copy, MessageCircle, Repeat, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCotacoes, useInvalidateAll, totalCotacao } from "@/lib/queries";
import { STATUS_OPTIONS, brl, dataHora, interesseLabel, whatsappLink } from "@/lib/cotacao";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
              <span className="shrink-0 text-lg font-extrabold text-primary">
                {brl(Number(item.valor))}
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

      <Button variant="ghost" className="h-11 w-full text-destructive" onClick={excluir}>
        <Trash2 className="size-4" /> Excluir cotação
      </Button>
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
