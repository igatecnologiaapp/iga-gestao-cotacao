import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { UNIDADES, FONTES_PRECO_ONLINE, buscaPrecoUrl, parseValor } from "@/lib/cotacao";
import { InteresseSelect } from "@/components/InteresseSelect";
import { ResumoMercado, SeloCompetitividade } from "@/components/PrecoMercado";
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

export type Draft = {
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
  preco_medio_online: string;
  preco_online_fonte: string;
  preco_online_url: string;
  preco_online_pesquisado_em: string;
};

export const DRAFT_VAZIO: Draft = {
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
  preco_medio_online: "",
  preco_online_fonte: "",
  preco_online_url: "",
  preco_online_pesquisado_em: "",
};


export function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
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
      <Campo label="Descrição do produto *">
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
      </Campo>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Valor *">
          <Input
            className="h-12"
            inputMode="decimal"
            placeholder="0,00"
            value={draft.valor}
            onChange={(e) => set("valor")(e.target.value)}
          />
        </Campo>
        <Campo label="Quantidade">
          <Input
            className="h-12"
            inputMode="decimal"
            value={draft.quantidade}
            onChange={(e) => set("quantidade")(e.target.value)}
          />
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Campo label="Unidade">
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
        </Campo>
        <Campo label="Código">
          <Input
            className="h-12"
            value={draft.codigo}
            onChange={(e) => set("codigo")(e.target.value)}
            maxLength={60}
          />
        </Campo>
      </div>

      <Campo label="Interesse de compra">
        <InteresseSelect value={draft.interesse} onChange={(v) => set("interesse")(v)} />
      </Campo>

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
        Condições comerciais e preço de mercado
        <ChevronDown className={avancado ? "size-4 rotate-180" : "size-4"} />
      </button>

      {!avancado && (
        <SeloCompetitividade
          compra={parseValor(draft.valor)}
          online={parseValor(draft.preco_medio_online)}
        />
      )}


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
          <div className="space-y-2 rounded-xl border border-border p-3">
            <Campo label="Preço médio de venda na internet (opcional)">
              <div className="flex gap-2">
                <Input
                  className="h-12"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={draft.preco_medio_online}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d) => ({
                      ...d,
                      preco_medio_online: v,
                      preco_online_pesquisado_em:
                        v.trim() && !d.preco_online_pesquisado_em
                          ? new Date().toISOString()
                          : v.trim()
                            ? d.preco_online_pesquisado_em
                            : "",
                    }));
                  }}
                />
                <a
                  href={buscaPrecoUrl(draft)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 shrink-0 items-center gap-1 rounded-md bg-secondary px-3 text-xs font-extrabold uppercase tracking-wide"
                >
                  <ExternalLink className="size-4" /> Pesquisar
                </a>
              </div>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Fonte do preço">
                <Select
                  value={draft.preco_online_fonte || "nenhuma"}
                  onValueChange={(v) => set("preco_online_fonte")(v === "nenhuma" ? "" : v)}
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Não informar</SelectItem>
                    {FONTES_PRECO_ONLINE.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Campo>
              <Campo label="Link da referência">
                <Input
                  className="h-12"
                  inputMode="url"
                  placeholder="https://"
                  value={draft.preco_online_url}
                  onChange={(e) => set("preco_online_url")(e.target.value)}
                  maxLength={500}
                />
              </Campo>
            </div>
            <ResumoMercado
              compra={parseValor(draft.valor)}
              online={parseValor(draft.preco_medio_online)}
              pesquisadoEm={draft.preco_online_pesquisado_em}
              fonte={draft.preco_online_fonte}
              url={draft.preco_online_url}
            />
          </div>
          <Campo label="Observações do produto">
            <Textarea value={draft.observacoes} onChange={(e) => set("observacoes")(e.target.value)} maxLength={1000} />
          </Campo>

        </div>
      )}
    </div>
  );
}
