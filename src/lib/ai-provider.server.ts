/**
 * Configuração central do provedor de Inteligência (somente servidor).
 *
 * Portabilidade: nenhum endpoint fica espalhado pelo código. O provedor é
 * definido por variáveis de runtime, permitindo usar o Lovable AI Gateway
 * (padrão atual) ou, futuramente e mediante autorização, outro gateway
 * compatível com a API de chat completions.
 *
 * Variáveis (todas de runtime do servidor — nunca com prefixo VITE_):
 *   AI_PROVIDER  informativo: "lovable" (padrão) | "openai" | "custom"
 *   AI_BASE_URL  base da API compatível (padrão: gateway Lovable)
 *   AI_MODEL     modelo usado nas leituras por imagem
 *   AI_API_KEY   credencial; se ausente, usa LOVABLE_API_KEY (compatibilidade)
 */

const PADRAO_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const PADRAO_MODELO = "openai/gpt-5.6-sol";

export type ConfigIA = {
  provider: string;
  baseUrl: string;
  model: string;
  apiKey: string | null;
};

/** Lê a configuração do ambiente. Nunca registra nem retorna a credencial. */
export function configIA(): ConfigIA {
  const baseUrl = (process.env["AI_BASE_URL"] || PADRAO_BASE_URL).replace(/\/+$/, "");
  return {
    provider: process.env["AI_PROVIDER"] || "lovable",
    baseUrl,
    model: process.env["AI_MODEL"] || PADRAO_MODELO,
    apiKey: process.env["AI_API_KEY"] || process.env["LOVABLE_API_KEY"] || null,
  };
}

/** Mensagem única exibida quando o ambiente não tem credencial de IA. */
export const IA_NAO_CONFIGURADA =
  "Leitura inteligente não configurada neste ambiente. Utilize o preenchimento manual.";

/** Endpoint de chat completions do provedor configurado. */
export function urlChatCompletions(cfg: ConfigIA): string {
  return `${cfg.baseUrl}/chat/completions`;
}
