import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSegmentos, useInvalidateAll, type Fornecedor } from "@/lib/queries";
import { UFS, normalize } from "@/lib/cotacao";
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
import { ChevronDown } from "lucide-react";
import { LerCartao } from "@/components/LerCartao";

const VAZIO = {
  nome: "",
  contato: "",
  segmento_id: "",
  bairro: "",
  uf: "",
  endereco: "",
  cidade: "",
  vendedor: "",
  telefone: "",
  whatsapp: "",
  email: "",
  site: "",
  observacoes: "",
};

export function FornecedorForm({
  fornecedor,
  onSaved,
  onCancel,
}: {
  fornecedor?: Fornecedor;
  onSaved: (f: Fornecedor) => void;
  onCancel?: () => void;
}) {
  const { data: segmentos = [] } = useSegmentos();
  const invalidar = useInvalidateAll();
  const [form, setForm] = useState({
    ...VAZIO,
    ...(fornecedor
      ? {
          nome: fornecedor.nome,
          contato: fornecedor.contato,
          segmento_id: fornecedor.segmento_id ?? "",
          bairro: fornecedor.bairro,
          uf: fornecedor.uf,
          endereco: fornecedor.endereco ?? "",
          cidade: fornecedor.cidade ?? "",
          vendedor: fornecedor.vendedor ?? "",
          telefone: fornecedor.telefone ?? "",
          whatsapp: fornecedor.whatsapp ?? "",
          email: fornecedor.email ?? "",
          site: fornecedor.site ?? "",
          observacoes: fornecedor.observacoes ?? "",
        }
      : {}),
  });
  const [novoSegmento, setNovoSegmento] = useState("");
  const [mostrarOpcionais, setMostrarOpcionais] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const set = (campo: keyof typeof VAZIO) => (valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  async function salvar() {
    if (!form.nome.trim() || !form.contato.trim() || !form.bairro.trim() || !form.uf) {
      toast.error("Preencha nome, contato, bairro e UF.");
      return;
    }
    if (!form.segmento_id && !novoSegmento.trim()) {
      toast.error("Selecione ou crie um segmento.");
      return;
    }
    setSalvando(true);
    try {
      let segmentoId = form.segmento_id;
      let segmentoNome =
        segmentos.find((s) => s.id === form.segmento_id)?.nome ?? novoSegmento.trim();

      if (!segmentoId && novoSegmento.trim()) {
        const existente = segmentos.find((s) => normalize(s.nome) === normalize(novoSegmento));
        if (existente) {
          segmentoId = existente.id;
          segmentoNome = existente.nome;
        } else {
          const { data: userData } = await supabase.auth.getUser();
          const { data, error } = await supabase
            .from("segmentos")
            .insert({ nome: novoSegmento.trim(), user_id: userData.user?.id ?? null })
            .select()
            .single();
          if (error) throw error;
          segmentoId = data.id;
          segmentoNome = data.nome;
        }
      }

      const payload = {
        nome: form.nome.trim(),
        contato: form.contato.trim(),
        segmento_id: segmentoId || null,
        segmento_nome: segmentoNome || null,
        bairro: form.bairro.trim(),
        uf: form.uf,
        endereco: form.endereco.trim() || null,
        cidade: form.cidade.trim() || null,
        vendedor: form.vendedor.trim() || null,
        telefone: form.telefone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        site: form.site.trim() || null,
        observacoes: form.observacoes.trim() || null,
      };

      const query = fornecedor
        ? supabase.from("fornecedores").update(payload).eq("id", fornecedor.id).select().single()
        : supabase.from("fornecedores").insert(payload).select().single();
      const { data, error } = await query;
      if (error) throw error;
      invalidar();
      toast.success(fornecedor ? "Fornecedor atualizado." : "Fornecedor cadastrado.");
      onSaved(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar fornecedor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      {!fornecedor && (
        <div>
          <LerCartao
            onAplicar={(d) =>
              setForm((f) => ({
                ...f,
                nome: d.nome || f.nome,
                contato: d.contato || f.contato,
                vendedor: d.vendedor || f.vendedor,
                telefone: d.telefone || f.telefone,
                whatsapp: d.whatsapp || f.whatsapp,
                email: d.email || f.email,
                site: d.site || f.site,
                endereco: d.endereco || f.endereco,
                bairro: d.bairro || f.bairro,
                cidade: d.cidade || f.cidade,
                uf: d.uf || f.uf,
                observacoes: [f.observacoes, d.observacoes].filter(Boolean).join(" · "),
              }))
            }
            onSelecionarExistente={(f) => onSaved(f)}
          />
          <p className="mt-1 text-center text-xs text-muted-foreground">
            ou preencha manualmente abaixo
          </p>
        </div>
      )}
      <Campo label="Nome do fornecedor *">
        <Input className="h-12" value={form.nome} onChange={(e) => set("nome")(e.target.value)} maxLength={120} />
      </Campo>
      <Campo label="Contato * (telefone, celular ou WhatsApp)">
        <Input
          className="h-12"
          inputMode="tel"
          value={form.contato}
          onChange={(e) => set("contato")(e.target.value)}
          maxLength={40}
        />
      </Campo>
      <Campo label="Segmento *">
        <Select value={form.segmento_id} onValueChange={set("segmento_id")}>
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder="Selecione o segmento" />
          </SelectTrigger>
          <SelectContent>
            {segmentos.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!form.segmento_id && (
          <Input
            className="mt-2 h-12"
            placeholder="ou digite um novo segmento"
            value={novoSegmento}
            onChange={(e) => setNovoSegmento(e.target.value)}
            maxLength={60}
          />
        )}
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Bairro *">
          <Input className="h-12" value={form.bairro} onChange={(e) => set("bairro")(e.target.value)} maxLength={80} />
        </Campo>
        <Campo label="UF *">
          <Select value={form.uf} onValueChange={set("uf")}>
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
        </Campo>
      </div>

      <button
        type="button"
        onClick={() => setMostrarOpcionais((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg bg-secondary px-3 py-2.5 text-sm font-semibold"
      >
        Dados opcionais
        <ChevronDown className={mostrarOpcionais ? "size-4 rotate-180" : "size-4"} />
      </button>

      {mostrarOpcionais && (
        <div className="space-y-3">
          <Campo label="Endereço">
            <Input className="h-12" value={form.endereco} onChange={(e) => set("endereco")(e.target.value)} maxLength={140} />
          </Campo>
          <Campo label="Cidade">
            <Input className="h-12" value={form.cidade} onChange={(e) => set("cidade")(e.target.value)} maxLength={80} />
          </Campo>
          <Campo label="Vendedor / representante">
            <Input className="h-12" value={form.vendedor} onChange={(e) => set("vendedor")(e.target.value)} maxLength={100} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Telefone">
              <Input className="h-12" inputMode="tel" value={form.telefone} onChange={(e) => set("telefone")(e.target.value)} maxLength={40} />
            </Campo>
            <Campo label="WhatsApp">
              <Input className="h-12" inputMode="tel" value={form.whatsapp} onChange={(e) => set("whatsapp")(e.target.value)} maxLength={40} />
            </Campo>
          </div>
          <Campo label="E-mail">
            <Input className="h-12" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} maxLength={255} />
          </Campo>
          <Campo label="Site">
            <Input className="h-12" value={form.site} onChange={(e) => set("site")(e.target.value)} maxLength={160} />
          </Campo>
          <Campo label="Observações">
            <Textarea value={form.observacoes} onChange={(e) => set("observacoes")(e.target.value)} maxLength={1000} />
          </Campo>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button onClick={salvar} disabled={salvando} className="h-12 flex-1 text-base font-bold">
          Salvar fornecedor
        </Button>
        {onCancel && (
          <Button variant="outline" className="h-12" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
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
