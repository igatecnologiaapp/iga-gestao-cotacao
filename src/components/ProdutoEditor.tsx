import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInvalidateAll, type ProdutoResumo } from "@/lib/queries";
import { UNIDADES } from "@/lib/cotacao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

/** Registro mais recente do grupo — base do cadastro exibido. */
function maisRecente(grupo: ProdutoResumo) {
  return [...grupo.registros].sort(
    (a, b) => +new Date(a.cotacao.created_at) - +new Date(b.cotacao.created_at),
  ).at(-1)!;
}

export function EditarProdutoDialog({
  grupo,
  open,
  onOpenChange,
}: {
  grupo: ProdutoResumo;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const invalidar = useInvalidateAll();
  const base = maisRecente(grupo).item;
  const [form, setForm] = useState({
    codigo: base.codigo ?? "",
    descricao: base.descricao,
    marca: base.marca ?? "",
    modelo: base.modelo ?? "",
    unidade: base.unidade ?? "UN",
  });
  const [todos, setTodos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!form.descricao.trim()) {
      toast.error("Informe a descrição do produto.");
      return;
    }
    setSalvando(true);
    const ids = todos ? grupo.registros.map((r) => r.item.id) : [base.id];
    const { error } = await supabase
      .from("itens_cotacao")
      .update({
        codigo: form.codigo.trim() || null,
        descricao: form.descricao.trim(),
        marca: form.marca.trim() || null,
        modelo: form.modelo.trim() || null,
        unidade: form.unidade,
      })
      .in("id", ids);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar as alterações.");
      return;
    }
    invalidar();
    toast.success(todos ? "Produto atualizado em todos os registros." : "Produto atualizado.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar produto</DialogTitle>
          <DialogDescription>
            Preços, condições e datas das cotações não são alterados aqui.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="p-desc">Descrição</Label>
            <Input
              id="p-desc"
              className="h-12"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="p-cod">Código</Label>
              <Input
                id="p-cod"
                className="h-12"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unidade</Label>
              <Select
                value={form.unidade}
                onValueChange={(v) => setForm({ ...form, unidade: v })}
              >
                <SelectTrigger className="h-12">
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
              <Label htmlFor="p-marca">Marca</Label>
              <Input
                id="p-marca"
                className="h-12"
                value={form.marca}
                onChange={(e) => setForm({ ...form, marca: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-modelo">Modelo</Label>
              <Input
                id="p-modelo"
                className="h-12"
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-xl bg-secondary p-3 text-xs">
            <p className="font-bold">Onde aplicar a correção</p>
            <label className="mt-2 flex items-start gap-2">
              <input
                type="radio"
                className="mt-1"
                checked={!todos}
                onChange={() => setTodos(false)}
              />
              <span>
                Somente o registro mais recente — o histórico anterior continua exatamente como foi
                cotado.
              </span>
            </label>
            <label className="mt-2 flex items-start gap-2">
              <input
                type="radio"
                className="mt-1"
                checked={todos}
                onChange={() => setTodos(true)}
              />
              <span>
                Todos os {grupo.registros.length} registros — use apenas para corrigir erro de
                digitação; altera a descrição exibida no histórico.
              </span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
          >
            Cancelar
          </Button>
          <Button className="h-12 font-bold" onClick={salvar} disabled={salvando}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExcluirProdutoDialog({
  grupo,
  open,
  onOpenChange,
}: {
  grupo: ProdutoResumo;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const invalidar = useInvalidateAll();

  async function confirmar() {
    const { error } = await supabase
      .from("itens_cotacao")
      .update({ arquivado: true })
      .in(
        "id",
        grupo.registros.map((r) => r.item.id),
      );
    if (error) {
      toast.error("Não foi possível excluir o produto.");
      return;
    }
    invalidar();
    toast.success("Produto inativado. O histórico foi preservado.");
    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
          <AlertDialogDescription>
            Confirme a exclusão deste produto. Ele será inativado e deixará de aparecer nas
            sugestões e listas de novas cotações. Os registros históricos de cotações
            ({grupo.registros.length}) não serão apagados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="h-12">Cancelar</AlertDialogCancel>
          <AlertDialogAction className="h-12" onClick={confirmar}>
            Confirmar exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export async function reativarProduto(grupo: ProdutoResumo) {
  const { error } = await supabase
    .from("itens_cotacao")
    .update({ arquivado: false })
    .in(
      "id",
      grupo.registros.map((r) => r.item.id),
    );
  if (error) throw error;
}
