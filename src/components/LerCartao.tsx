import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Contact, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { lerCartao } from "@/lib/visao.functions";
import { val, baixaConfianca, type LeituraCartao } from "@/lib/visao";
import { UFS, normalize } from "@/lib/cotacao";
import { useFornecedores, type Fornecedor } from "@/lib/queries";
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

export type DadosCartao = {
  nome: string;
  contato: string;
  telefone: string;
  whatsapp: string;
  email: string;
  site: string;
  endereco: string;
  bairro: string;
  cidade: string;
  uf: string;
  vendedor: string;
  observacoes: string;
};

const VAZIO: DadosCartao = {
  nome: "",
  contato: "",
  telefone: "",
  whatsapp: "",
  email: "",
  site: "",
  endereco: "",
  bairro: "",
  cidade: "",
  uf: "",
  vendedor: "",
  observacoes: "",
};

const soDigitos = (v: string) => v.replace(/\D/g, "");

/** Ação "Ler cartão": capturar → interpretar → revisar → preencher o cadastro. */
export function LerCartao({
  onAplicar,
  onSelecionarExistente,
}: {
  onAplicar: (dados: DadosCartao) => void;
  onSelecionarExistente?: (f: Fornecedor) => void;
}) {
  const ler = useServerFn(lerCartao);
  const { data: fornecedores = [] } = useFornecedores();
  const [aberto, setAberto] = useState(false);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [revisao, setRevisao] = useState<DadosCartao | null>(null);
  const [duvidosos, setDuvidosos] = useState<string[]>([]);
  const [segmentoSugerido, setSegmentoSugerido] = useState<string | null>(null);

  function fechar() {
    setAberto(false);
    setRevisao(null);
    setErro(null);
    setDuvidosos([]);
    setSegmentoSugerido(null);
    setLendo(false);
  }

  const possiveisDuplicados: Fornecedor[] = revisao
    ? fornecedores.filter((f) => {
        const nomeIgual = revisao.nome && normalize(f.nome) === normalize(revisao.nome);
        const tels = [revisao.telefone, revisao.whatsapp, revisao.contato]
          .map(soDigitos)
          .filter((t) => t.length >= 8);
        const telIgual = [f.contato, f.telefone, f.whatsapp]
          .filter(Boolean)
          .some((t) => tels.some((n) => soDigitos(String(t)).endsWith(n.slice(-8))));
        const emailIgual =
          !!revisao.email && !!f.email && normalize(f.email) === normalize(revisao.email);
        return Boolean(nomeIgual || telIgual || emailIgual);
      })
    : [];

  async function processar(imagem: string) {
    if (!imagem) {
      setErro("Não foi possível usar essa imagem. Tente novamente ou preencha manualmente.");
      return;
    }
    setLendo(true);
    setErro(null);
    try {
      const { dados: bruto } = await ler({ data: { imagem } });
      const d = JSON.parse(bruto) as LeituraCartao;
      const empresa = val(d.empresa) ?? "";
      const telefones = (d.telefones ?? []).filter((t) => t && t.numero);
      if (d.legivel === false || (!empresa && telefones.length === 0 && !val(d.email))) {
        setErro(
          "Não foi possível identificar os dados com segurança. Você pode tentar novamente ou preencher manualmente.",
        );
        return;
      }
      const whats = telefones.find((t) => t.tipo === "whatsapp")?.numero ?? "";
      const cel = telefones.find((t) => t.tipo === "celular")?.numero ?? "";
      const com = telefones.find((t) => t.tipo === "comercial")?.numero ?? "";
      const principal = whats || cel || com || telefones[0]?.numero || "";
      const extras = telefones
        .map((t) => t.numero)
        .filter((n) => n !== principal && n !== com && n !== whats);

      const marcados: string[] = [];
      if (baixaConfianca(d.empresa)) marcados.push("nome");
      if (baixaConfianca(d.email)) marcados.push("email");
      if (baixaConfianca(d.bairro)) marcados.push("bairro");
      if (baixaConfianca(d.cidade)) marcados.push("cidade");
      if (baixaConfianca(d.uf)) marcados.push("uf");
      if (baixaConfianca(d.contato_nome)) marcados.push("vendedor");

      const cep = val(d.cep);
      const cargo = val(d.cargo);
      const obs = [
        d.observacoes ?? "",
        cep ? `CEP ${cep}` : "",
        cargo ? `Cargo: ${cargo}` : "",
        extras.length ? `Outros telefones: ${extras.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

      setRevisao({
        nome: empresa,
        contato: principal,
        telefone: com || (principal !== cel ? "" : com),
        whatsapp: whats,
        email: val(d.email) ?? "",
        site: val(d.site) ?? "",
        endereco: val(d.endereco) ?? "",
        bairro: val(d.bairro) ?? "",
        cidade: val(d.cidade) ?? "",
        uf: (val(d.uf) ?? "").toUpperCase(),
        vendedor: val(d.contato_nome) ?? "",
        observacoes: obs,
      });
      setDuvidosos(marcados);
      setSegmentoSugerido(val(d.segmento_sugerido));
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
    if (!revisao.nome.trim() || !revisao.contato.trim()) {
      toast.error("Informe pelo menos o nome do fornecedor e um contato.");
      return;
    }
    onAplicar({
      ...revisao,
      observacoes: segmentoSugerido
        ? [revisao.observacoes, `Segmento sugerido: ${segmentoSugerido}`].filter(Boolean).join(" · ")
        : revisao.observacoes,
    });
    toast.success("Dados preenchidos. Confira antes de salvar.");
    fechar();
  }

  const campo = (
    chave: keyof DadosCartao,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1.5">
      <Label className="flex items-center text-xs font-bold uppercase text-muted-foreground">
        {label}
        {duvidosos.includes(chave) && (
          <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">
            Verificar
          </span>
        )}
      </Label>
      <Input
        className="h-12"
        value={revisao?.[chave] ?? ""}
        onChange={(e) => revisao && setRevisao({ ...revisao, [chave]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="h-12 w-full font-bold"
        onClick={() => setAberto(true)}
      >
        <Contact className="size-5" /> Ler cartão de visita
      </Button>

      <Sheet open={aberto} onOpenChange={(v) => (v ? setAberto(true) : fechar())}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>Ler cartão de visita</SheetTitle>
            <SheetDescription>
              Fotografe o cartão. Nada é gravado antes da sua confirmação.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 pb-6">
            {!revisao && (
              <>
                <CapturaImagem onImagem={(img) => void processar(img)} ocupado={lendo} />
                {lendo && (
                  <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Lendo o cartão...
                  </p>
                )}
                {erro && (
                  <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                    {erro}
                  </div>
                )}
                <Button variant="ghost" className="h-12 w-full" onClick={fechar}>
                  Cadastrar manualmente
                </Button>
              </>
            )}

            {revisao && (
              <>
                {possiveisDuplicados.length > 0 && (
                  <div className="space-y-2 rounded-xl bg-warning/15 p-3">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      <TriangleAlert className="size-4" /> Fornecedor parecido já cadastrado
                    </p>
                    {possiveisDuplicados.slice(0, 3).map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-background p-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{f.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {f.contato} · {f.bairro}/{f.uf}
                          </p>
                        </div>
                        {onSelecionarExistente && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              onSelecionarExistente(f);
                              fechar();
                            }}
                          >
                            Usar
                          </Button>
                        )}
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Você pode usar o cadastro existente ou continuar e criar um novo.
                    </p>
                  </div>
                )}

                <p className="text-sm font-extrabold uppercase tracking-wide">
                  Dados identificados
                </p>
                <div className="space-y-3">
                  {campo("nome", "Fornecedor (empresa) *", { maxLength: 120 })}
                  {campo("contato", "Contato principal *", { inputMode: "tel", maxLength: 40 })}
                  {campo("vendedor", "Vendedor / contato", { maxLength: 80 })}
                  <div className="grid grid-cols-2 gap-3">
                    {campo("telefone", "Telefone", { inputMode: "tel", maxLength: 40 })}
                    {campo("whatsapp", "WhatsApp", { inputMode: "tel", maxLength: 40 })}
                  </div>
                  {campo("email", "E-mail", { inputMode: "email", maxLength: 120 })}
                  {campo("site", "Site", { maxLength: 120 })}
                  {campo("endereco", "Endereço", { maxLength: 160 })}
                  <div className="grid grid-cols-2 gap-3">
                    {campo("bairro", "Bairro", { maxLength: 80 })}
                    {campo("cidade", "Cidade", { maxLength: 80 })}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center text-xs font-bold uppercase text-muted-foreground">
                      UF
                      {duvidosos.includes("uf") && (
                        <span className="ml-2 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase text-warning-foreground">
                          Verificar
                        </span>
                      )}
                    </Label>
                    <Select
                      value={revisao.uf}
                      onValueChange={(v) => setRevisao({ ...revisao, uf: v })}
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {UFS.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {segmentoSugerido && (
                    <p className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                      Segmento sugerido pelo cartão: <b>{segmentoSugerido}</b>. Selecione ou crie o
                      segmento no cadastro.
                    </p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Button className="h-14 text-base font-extrabold" onClick={confirmar}>
                    Confirmar e preencher
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
