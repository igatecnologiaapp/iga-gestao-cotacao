import { brl, compararMercado, percentualTexto } from "@/lib/cotacao";

const TOM_CLASSE: Record<string, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-accent/20 text-accent-foreground",
  destructive: "bg-destructive/15 text-destructive",
};

/** Selo compacto de competitividade (referência de mercado, não é lucro). */
export function SeloCompetitividade({
  compra,
  online,
}: {
  compra: number | null | undefined;
  online: number | null | undefined;
}) {
  const c = compararMercado(compra, online);
  if (!c) return null;
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide " +
        (TOM_CLASSE[c.tom] ?? "bg-secondary")
      }
    >
      {c.label} · {percentualTexto(c.percentual)}
    </span>
  );
}

/**
 * Bloco compacto: fornecedor x mercado, diferença em reais e percentual
 * sobre o custo, e classificação de competitividade.
 */
export function ResumoMercado({
  compra,
  online,
  pesquisadoEm,
  fonte,
  url,
}: {
  compra: number | null | undefined;
  online: number | null | undefined;
  pesquisadoEm?: string | null;
  fonte?: string | null;
  url?: string | null;
}) {
  const c = compararMercado(compra, online);
  if (!c) return null;
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Linha rotulo="Preço fornecedor" valor={brl(c.compra)} />
        <Linha rotulo="Preço médio online" valor={brl(c.online)} />
        <Linha rotulo="Diferença" valor={brl(c.diferenca)} />
        <Linha rotulo="Potencial sobre o custo" valor={percentualTexto(c.percentual)} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SeloCompetitividade compra={compra} online={online} />
        {pesquisadoEm && (
          <span className="text-[11px] text-muted-foreground">
            Pesquisado em {new Date(pesquisadoEm).toLocaleDateString("pt-BR")}
          </span>
        )}
        {fonte && <span className="text-[11px] text-muted-foreground">· {fonte}</span>}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold underline"
          >
            referência
          </a>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Potencial comercial sobre o custo (markup potencial): diferença entre o preço de compra e o
        preço médio online. Esta referência não representa lucro líquido e não considera impostos,
        frete, taxas, comissões e demais custos da operação.
      </p>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </p>
      <p className="font-extrabold">{valor}</p>
    </div>
  );
}
