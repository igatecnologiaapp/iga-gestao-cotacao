import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { lerEtiqueta } from "@/lib/visao.functions";
import { val, baixaConfianca, type LeituraEtiqueta } from "@/lib/visao";
import { UNIDADES, brl } from "@/lib/cotacao";
import { type Draft } from "@/components/ItemFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CapturaImagem } from "@/components/CapturaImagem";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Revisao = {
  descricao: string;
  valor: string;
  codigo: string;
  marca: string;
  unidade: string;
  candidatos: Array<{ valor: number; rotulo?: string }>;
  duvidosos: string[];
  aviso: string | null;
};

/** Ação "Ler etiqueta": capturar → interpretar → revisar → inserir no item. */
export function LerEtiqueta({ onAplicar }: { onAplicar: (dados: Partial<Draft>) => void }) {
  const ler = useServerFn(lerEtiqueta);
  const [aberto, setAberto] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [revisao, setRevisao] = useState<Revisao | null>(null);

  function fechar() {
    setAberto(false);
    setRevisao(null);
    setErro(null);
    setLendo(false);
  }

  async function processar(imagem: string) {
    if (!imagem) {
      setErro("Não foi possível usar essa imagem. Tente novamente ou preencha manualmente.");
      return;
    }
    setLendo(true);
    setErro(null);
    try {
      const { dados: bruto } = await ler({ data: { imagem } });
      const dados = JSON.parse(bruto) as LeituraEtiqueta;
      const descricao = val(dados.descricao) ?? "";
      const valor = val(dados.valor);
      if (dados.legivel === false || (!descricao && valor == null)) {
        setErro(
          "Não foi possível identificar os dados com segurança. Você pode tentar novamente ou preencher manualmente.",
        );
        return;
      }
      const duvidosos: string[] = [];
      if (baixaConfianca(dados.descricao)) duvidosos.push("descricao");
      if (baixaConfianca(dados.valor)) duvidosos.push("valor");
      if (baixaConfianca(dados.codigo)) duvidosos.push("codigo");
      if (baixaConfianca(dados.marca)) duvidosos.push("marca");
      if (baixaConfianca(dados.unidade)) duvidosos.push("unidade");

      const candidatos = (dados.precos_candidatos ?? []).filter(
        (c) => typeof c.valor === "number" && c.valor > 0,
      );
      const unidadeLida = (val(dados.unidade) ?? "").toUpperCase();
      setRevisao({
        descricao,
        valor: valor != null ? valor.toFixed(2).replace(".", ",") : "",
        codigo: val(dados.codigo) ?? "",
        marca: val(dados.marca) ?? "",
        // Unidade não reconhecida NÃO vira "UN": fica vazia para escolha do usuário.
        unidade: UNIDADES.includes(unidadeLida as (typeof UNIDADES)[number]) ? unidadeLida : "",
        candidatos: candidatos.length > 1 ? candidatos : [],
        duvidosos,
        aviso: dados.varias_etiquetas
          ? "A foto parece ter mais de uma etiqueta. Se os dados não forem os certos, aproxime a câmera de uma etiqueta e tire outra foto."
          : (dados.observacao ?? null),
      });

    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível identificar os dados com segurança. Tente novamente ou preencha manualmente.",
      );
    } finally {
      setLendo(false);
    }
  }

  function confirmar() {
    if (!revisao) return;
    if (!revisao.descricao.trim()) {
      toast.error("Informe a descrição do produto.");
      return;
    }
    if (!UNIDADES.includes(revisao.unidade as (typeof UNIDADES)[number])) {
      toast.error("Selecione a unidade do produto (não identificada na etiqueta).");
      return;
    }
    onAplicar({
      descricao: revisao.descricao.trim(),
      valor: revisao.valor.trim(),
      codigo: revisao.codigo.trim(),
      marca: revisao.marca.trim(),
      unidade: revisao.unidade,
    });
    toast.success("Dados inseridos. Revise e adicione o produto.");
    fechar();
  }


  const marca = (campo: string) =>
    revisao?.duvidosos.includes(campo) ? (
      <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">
        Verificar
      </span>
    ) : (
      <span className="ml-2 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
        Confirmado
      </span>
    );

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full font-bold"
        onClick={() => setAberto(true)}
      >
        <ScanLine className="size-5" /> Ler etiqueta
      </Button>

      <Sheet open={aberto} onOpenChange={(v) => (v ? setAberto(true) : fechar())}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>Ler etiqueta</SheetTitle>
            <SheetDescription>
              Fotografe a etiqueta de preço. Nada é gravado antes da sua confirmação.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pb-6">
            {!revisao && (
              <>
                <CapturaImagem onImagem={(img) => void processar(img)} ocupado={lendo} />
                {lendo && (
                  <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Lendo a etiqueta...
                  </p>
                )}
                {erro && (
                  <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                    {erro}
                  </div>
                )}
                <Button variant="ghost" className="h-12 w-full" onClick={fechar}>
                  Digitar manualmente
                </Button>
              </>
            )}

            {revisao && (
              <>
                <p className="text-sm font-extrabold uppercase tracking-wide">Dados identificados</p>
                {revisao.aviso && (
                  <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                    {revisao.aviso}
                  </p>
                )}

                {revisao.candidatos.length > 1 && (
                  <div className="rounded-xl border border-border p-3">
                    <p className="text-sm font-bold">Qual valor deseja utilizar?</p>
                    <div className="mt-2 grid gap-2">
                      {revisao.candidatos.map((c, i) => (
                        <button
                          key={`${c.valor}-${i}`}
                          type="button"
                          onClick={() =>
                            setRevisao({
                              ...revisao,
                              valor: c.valor.toFixed(2).replace(".", ","),
                            })
                          }
                          className={`flex h-12 items-center justify-between rounded-lg px-3 text-sm font-semibold ${
                            revisao.valor === c.valor.toFixed(2).replace(".", ",")
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          <span>{c.rotulo ?? "Preço"}</span>
                          <span className="font-extrabold">{brl(c.valor)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="flex items-center text-xs font-bold uppercase text-muted-foreground">
                      Produto {marca("descricao")}
                    </Label>
                    <Input
                      className="h-12"
                      value={revisao.descricao}
                      onChange={(e) => setRevisao({ ...revisao, descricao: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="flex items-center text-xs font-bold uppercase text-muted-foreground">
                        Valor {marca("valor")}
                      </Label>
                      <Input
                        className="h-12"
                        inputMode="decimal"
                        value={revisao.valor}
                        onChange={(e) => setRevisao({ ...revisao, valor: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center text-xs font-bold uppercase text-muted-foreground">
                        Unidade *{" "}
                        {revisao.unidade ? (
                          marca("unidade")
                        ) : (
                          <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">
                            Selecionar
                          </span>
                        )}
                      </Label>
                      <Select
                        value={revisao.unidade}
                        onValueChange={(v) => setRevisao({ ...revisao, unidade: v })}
                      >
                        <SelectTrigger
                          className={`h-12 w-full ${revisao.unidade ? "" : "border-warning"}`}
                        >
                          <SelectValue placeholder="Selecionar unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIDADES.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!revisao.unidade && (
                        <p className="text-[11px] text-muted-foreground">
                          Não identificada na etiqueta. Escolha antes de inserir.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center text-xs font-bold uppercase text-muted-foreground">
                        Marca {marca("marca")}
                      </Label>
                      <Input
                        className="h-12"
                        value={revisao.marca}
                        onChange={(e) => setRevisao({ ...revisao, marca: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="flex items-center text-xs font-bold uppercase text-muted-foreground">
                        Código {marca("codigo")}
                      </Label>
                      <Input
                        className="h-12"
                        value={revisao.codigo}
                        onChange={(e) => setRevisao({ ...revisao, codigo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button className="h-14 text-base font-extrabold" onClick={confirmar}>
                    Confirmar e inserir
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12"
                    onClick={() => {
                      setRevisao(null);
                      setErro(null);
                    }}
                  >
                    <Camera className="size-4" /> Tirar outra foto
                  </Button>
                  <Button variant="ghost" className="h-12" onClick={fechar}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
