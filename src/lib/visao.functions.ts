import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Leitura inteligente de imagens (etiqueta de gôndola e cartão de visita).
 *
 * Privacidade: a imagem é enviada apenas para a leitura, nunca é gravada em
 * banco ou storage e nunca é devolvida ao cliente. Só o texto interpretado
 * retorna. A rota exige usuário autenticado.
 */

const MODELO = "openai/gpt-5.6-sol";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Data URL de imagem, limitada a ~4 MB em base64. */
const imagemSchema = z
  .string()
  .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Imagem inválida.")
  .max(5_600_000, "Imagem muito grande. Tire a foto novamente.");

export type LeituraErro = { erro: string; retryable: boolean };

/** Retorna o JSON interpretado já validado, serializado como texto. */
async function chamarVisao(imagem: string, prompt: string): Promise<{ dados: string }> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Serviço de leitura não configurado.");

  const resposta = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODELO,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imagem } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    console.error("Falha na leitura por imagem", resposta.status, texto.slice(0, 400));
    if (resposta.status === 429) {
      throw new Error("Muitas leituras seguidas. Aguarde alguns segundos e tente novamente.");
    }
    if (resposta.status === 402) {
      throw new Error("Os créditos de leitura inteligente acabaram. Preencha manualmente.");
    }
    if (resposta.status === 403) {
      throw new Error("A leitura inteligente está indisponível nesta conta. Preencha manualmente.");
    }
    throw new Error("Não foi possível ler a imagem agora. Tente novamente ou preencha manualmente.");
  }

  const json = (await resposta.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const conteudo = json.choices?.[0]?.message?.content ?? "";
  const bruto = conteudo.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return { dados: JSON.stringify(JSON.parse(bruto)) };
  } catch {
    const inicio = bruto.indexOf("{");
    const fim = bruto.lastIndexOf("}");
    if (inicio >= 0 && fim > inicio) {
      try {
        return { dados: JSON.stringify(JSON.parse(bruto.slice(inicio, fim + 1))) };
      } catch {
        /* ignora */
      }
    }
    throw new Error(
      "Não foi possível identificar os dados com segurança. Tente novamente ou preencha manualmente.",
    );
  }
}

const PROMPT_ETIQUETA = `Você lê etiquetas de preço de gôndola, prateleira, expositor, balcão, feira ou distribuidor no Brasil.
Analise a imagem e devolva SOMENTE um JSON com este formato:
{
  "legivel": true|false,
  "varias_etiquetas": true|false,
  "descricao": {"valor": string|null, "confianca": "alta"|"baixa"},
  "valor": {"valor": number|null, "confianca": "alta"|"baixa"},
  "codigo": {"valor": string|null, "confianca": "alta"|"baixa"},
  "marca": {"valor": string|null, "confianca": "alta"|"baixa"},
  "unidade": {"valor": "UN"|"CX"|"KG"|"LT"|"PCT"|"FD"|"MT"|"KIT"|null, "confianca": "alta"|"baixa"},
  "precos_candidatos": [{"valor": number, "rotulo": string}],
  "observacao": string|null
}
Regras rígidas:
- Preços em reais, ponto decimal (ex.: 8.99). Nunca invente valores.
- Distinga preço normal, preço promocional/oferta, preço por kg, preço anterior, quantidade, código interno, código de barras, desconto e número de parcelas. Códigos de barras e códigos internos NUNCA são preço.
- Se houver mais de um preço plausível (ex.: normal e oferta), liste todos em "precos_candidatos" com rótulo curto ("Normal", "Oferta", "Por kg", "À vista") e coloque em "valor" o mais provável para uma cotação de compra.
- Só preencha "unidade" se estiver legível na etiqueta (ex.: "R$ 18,50/KG"). Caso contrário, null.
- Só preencha "codigo" se houver código claramente visível.
- "varias_etiquetas": true quando a foto tem mais de uma etiqueta e não dá para saber qual é a desejada.
- "legivel": false quando a foto não permite identificar descrição nem preço.
- Use "confianca": "baixa" em qualquer campo duvidoso.
Responda apenas o JSON.`;

const PROMPT_CARTAO = `Você lê cartões de visita de fornecedores brasileiros.
Analise a imagem e devolva SOMENTE um JSON com este formato:
{
  "legivel": true|false,
  "empresa": {"valor": string|null, "confianca": "alta"|"baixa"},
  "contato_nome": {"valor": string|null, "confianca": "alta"|"baixa"},
  "cargo": {"valor": string|null, "confianca": "alta"|"baixa"},
  "telefones": [{"numero": string, "tipo": "comercial"|"celular"|"whatsapp"|"outro"}],
  "email": {"valor": string|null, "confianca": "alta"|"baixa"},
  "site": {"valor": string|null, "confianca": "alta"|"baixa"},
  "endereco": {"valor": string|null, "confianca": "alta"|"baixa"},
  "bairro": {"valor": string|null, "confianca": "alta"|"baixa"},
  "cidade": {"valor": string|null, "confianca": "alta"|"baixa"},
  "uf": {"valor": string|null, "confianca": "alta"|"baixa"},
  "cep": {"valor": string|null, "confianca": "alta"|"baixa"},
  "segmento_sugerido": {"valor": string|null, "confianca": "alta"|"baixa"},
  "observacoes": string|null
}
Regras rígidas:
- Nunca invente dados. Se não estiver legível no cartão, use null.
- Telefones no formato "(11) 98888-7777". Marque "whatsapp" apenas quando o cartão indicar WhatsApp explicitamente (texto ou ícone).
- Endereço: "endereco" recebe logradouro + número + complemento. Bairro, cidade e UF só quando escritos; não deduza cidade a partir de DDD nem UF a partir de cidade.
- "uf" com 2 letras maiúsculas.
- "segmento_sugerido" apenas com evidência textual clara (ex.: "Distribuidora de Materiais Elétricos" -> "Material elétrico"). Sem evidência, null.
- "observacoes": redes sociais ou informações relevantes em uma linha.
- Use "confianca": "baixa" em qualquer campo duvidoso.
Responda apenas o JSON.`;

export const lerEtiqueta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ imagem: imagemSchema }).parse(data))
  .handler(async ({ data }) => chamarVisao(data.imagem, PROMPT_ETIQUETA));

export const lerCartao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ imagem: imagemSchema }).parse(data))
  .handler(async ({ data }) => chamarVisao(data.imagem, PROMPT_CARTAO));
