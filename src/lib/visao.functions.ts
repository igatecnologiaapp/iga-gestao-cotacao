import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { validarEntradaImagem } from "@/lib/visao";

/**
 * Leitura inteligente de imagens (etiqueta de gôndola e cartão de visita).
 *
 * A imagem é usada apenas para interpretação: não é gravada em banco nem em
 * storage e não retorna ao cliente. Ambas as rotas exigem usuário autenticado.
 */

export const lerEtiqueta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validarEntradaImagem)
  .handler(async ({ data }) => {
    const { chamarVisao, PROMPT_ETIQUETA } = await import("@/lib/visao.server");
    return chamarVisao(data.imagem, PROMPT_ETIQUETA);
  });

export const lerCartao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validarEntradaImagem)
  .handler(async ({ data }) => {
    const { chamarVisao, PROMPT_CARTAO } = await import("@/lib/visao.server");
    return chamarVisao(data.imagem, PROMPT_CARTAO);
  });
