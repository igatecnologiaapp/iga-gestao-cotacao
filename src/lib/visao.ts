/** Tipos e utilitários client-safe da leitura por câmera. */

export type Campo<T = string> = { valor: T | null; confianca?: "alta" | "baixa" } | null | undefined;

export type LeituraEtiqueta = {
  legivel?: boolean;
  varias_etiquetas?: boolean;
  descricao?: Campo;
  valor?: Campo<number>;
  codigo?: Campo;
  marca?: Campo;
  unidade?: Campo;
  precos_candidatos?: Array<{ valor: number; rotulo?: string }>;
  observacao?: string | null;
};

export type LeituraCartao = {
  legivel?: boolean;
  empresa?: Campo;
  contato_nome?: Campo;
  cargo?: Campo;
  telefones?: Array<{ numero: string; tipo?: string }>;
  email?: Campo;
  site?: Campo;
  endereco?: Campo;
  bairro?: Campo;
  cidade?: Campo;
  uf?: Campo;
  cep?: Campo;
  segmento_sugerido?: Campo;
  observacoes?: string | null;
};

export function val<T>(campo: Campo<T>): T | null {
  return campo && campo.valor != null && campo.valor !== "" ? campo.valor : null;
}

export function baixaConfianca(campo: Campo<unknown>): boolean {
  return !!campo && campo.valor != null && campo.confianca === "baixa";
}

/**
 * Converte a foto em data URL JPEG reduzida (máx. 1400px) — menos dados
 * trafegados, leitura mais rápida no celular.
 */
export async function arquivoParaDataUrl(file: File, maxLado = 1400): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

/** Data URL de imagem aceita na leitura (máx. ~4 MB de imagem em base64). */
const IMAGEM_RE = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const IMAGEM_MAX = 5_600_000;

/**
 * Valida a entrada das leituras por imagem devolvendo mensagem amigável —
 * nunca o erro bruto de schema.
 */
export function validarEntradaImagem(data: unknown): { imagem: string } {
  const imagem = (data as { imagem?: unknown } | null)?.imagem;
  if (typeof imagem !== "string" || !IMAGEM_RE.test(imagem)) {
    throw new Error("Imagem inválida. Tire a foto novamente ou preencha manualmente.");
  }
  if (imagem.length > IMAGEM_MAX) {
    throw new Error(
      "A imagem ficou muito grande. Tire a foto novamente, mais próximo, ou preencha manualmente.",
    );
  }
  return { imagem };
}
