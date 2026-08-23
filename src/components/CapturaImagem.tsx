import { useRef, useState } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { arquivoParaDataUrl } from "@/lib/visao";

/**
 * Captura pela câmera traseira ou escolha na galeria, com redução da imagem.
 * Se a câmera não estiver disponível, o navegador abre o seletor de arquivos —
 * e o fluxo manual continua sempre disponível na tela de origem.
 */
export function CapturaImagem({
  onImagem,
  ocupado,
}: {
  onImagem: (dataUrl: string) => void;
  ocupado?: boolean;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [processando, setProcessando] = useState(false);

  async function tratar(file: File | undefined) {
    if (!file) return;
    setProcessando(true);
    try {
      onImagem(await arquivoParaDataUrl(file));
    } catch {
      onImagem("");
    } finally {
      setProcessando(false);
    }
  }

  const desabilitado = ocupado || processando;

  return (
    <div className="grid grid-cols-2 gap-2">
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void tratar(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void tratar(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        className="h-14 font-bold"
        disabled={desabilitado}
        onClick={() => camRef.current?.click()}
      >
        <Camera className="size-5" /> Tirar foto
      </Button>
      <Button
        variant="outline"
        className="h-14 font-bold"
        disabled={desabilitado}
        onClick={() => galRef.current?.click()}
      >
        <ImageIcon className="size-5" /> Galeria
      </Button>
    </div>
  );
}
