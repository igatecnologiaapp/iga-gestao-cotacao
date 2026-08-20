import { statusLabel } from "@/lib/cotacao";
import { cn } from "@/lib/utils";

const CORES: Record<string, string> = {
  em_pesquisa: "bg-secondary text-secondary-foreground",
  concluida: "bg-primary/10 text-primary",
  em_analise: "bg-warning/20 text-warning-foreground",
  compra_provavel: "bg-accent/25 text-accent-foreground",
  compra_realizada: "bg-success/15 text-success",
  nao_comprar: "bg-destructive/10 text-destructive",
  arquivada: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
        CORES[status] ?? "bg-secondary text-secondary-foreground",
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
