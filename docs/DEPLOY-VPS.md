# Deploy independente — GitHub → Docker → VPS

App de Cotação Rápida — IGA Tecnologia.

O mesmo código versionado roda em dois ambientes, sem forks divergentes:

- **Ambiente A:** editor/preview de desenvolvimento (Lovable);
- **Ambiente B:** GitHub → Docker → VPS (infraestrutura própria).

O Supabase continua sendo dependência externa autorizada (banco, autenticação,
RLS). A Inteligência por imagem é opcional e configurável.

---

## 1. Pré-requisitos

- Docker 24+ (e, opcionalmente, Docker Compose v2);
- acesso ao repositório GitHub do projeto;
- projeto Supabase configurado (banco, RLS e Auth já existentes);
- valores das variáveis da seção 4;
- (opcional) credencial do provedor de Inteligência.

---

## 2. Build

```bash
git clone <url-do-repositorio> iga-cotacao
cd iga-cotacao

docker build \
  --build-arg VITE_SUPABASE_URL="https://<projeto>.supabase.co" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="<chave publicável>" \
  --build-arg VITE_SUPABASE_PROJECT_ID="<id do projeto>" \
  -t iga-cotacao-rapida:latest .
```

As três variáveis acima são **build-time**: ficam embutidas no bundle do
frontend e devem conter apenas valores publicáveis.

---

## 3. Execução

```bash
docker run -d --name iga-cotacao -p 3000:3000 \
  -e SUPABASE_URL="https://<projeto>.supabase.co" \
  -e SUPABASE_PUBLISHABLE_KEY="<chave publicável>" \
  -e SUPABASE_PROJECT_ID="<id do projeto>" \
  -e AI_API_KEY="<credencial de IA, opcional>" \
  iga-cotacao-rapida:latest
```

Com Docker Compose (valores vindos do ambiente do host ou de um `.env` **não
versionado**):

```bash
docker compose up -d --build
```

Verificação: `curl http://localhost:3000/api/public/health` → `{"status":"ok"}`.

---

## 4. Variáveis

| Variável                       | Tipo            | Obrigatória | Ambiente        | Finalidade                                              |
| ------------------------------ | --------------- | ----------- | --------------- | ------------------------------------------------------- |
| `VITE_SUPABASE_URL`            | build-time      | Sim         | build           | URL do Supabase usada pelo frontend                      |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| build-time      | Sim         | build           | Chave publicável do Supabase (frontend)                  |
| `VITE_SUPABASE_PROJECT_ID`     | build-time      | Sim         | build           | Identificação do projeto Supabase                        |
| `SUPABASE_URL`                 | runtime         | Sim         | servidor        | Supabase no SSR e nas funções de servidor                |
| `SUPABASE_PUBLISHABLE_KEY`     | runtime         | Sim         | servidor        | Validação do token do usuário nas rotas protegidas       |
| `SUPABASE_PROJECT_ID`          | runtime         | Não         | servidor        | Diagnóstico                                              |
| `AI_PROVIDER`                  | runtime         | Não         | servidor        | Informativo: `lovable` (padrão), `openai`, `custom`      |
| `AI_BASE_URL`                  | runtime         | Não         | servidor        | Base da API compatível; padrão: gateway Lovable          |
| `AI_MODEL`                     | runtime         | Não         | servidor        | Modelo das leituras; padrão: `openai/gpt-5.6-sol`        |
| `AI_API_KEY`                   | runtime, SECRET | Não         | servidor        | Credencial do provedor de Inteligência                   |
| `LOVABLE_API_KEY`              | runtime, SECRET | Não         | servidor        | Compatibilidade: usada quando `AI_API_KEY` não é fornecida |
| `PORT` / `HOST`                | runtime         | Não         | servidor        | Porta/interface do servidor (padrão 3000 / 0.0.0.0)      |

Secrets **nunca** usam prefixo `VITE_`, não entram na imagem Docker, no
repositório nem no `.env.example`.

---

## 5. Autenticação (Supabase Auth)

### E-mail e senha

Funciona sem configuração adicional. Confirme, no painel do Supabase, que o
provedor de e-mail está habilitado e que a URL do site aponta para o domínio
em uso.

### Google OAuth

O aplicativo usa o OAuth nativo do Supabase
(`supabase.auth.signInWithOAuth({ provider: "google" })`) e envia como retorno
`\`${window.location.origin}/auth\`` — a origem em uso no momento, sem domínio
fixo no código.

Cadastrar no Supabase (Authentication → URL Configuration):

- **Site URL:** `https://<seu-dominio>`
- **Redirect URLs:**
  - `https://<seu-dominio>/auth`
  - `https://<seu-dominio>/**` (opcional, cobre retornos internos)
  - URL do ambiente de desenvolvimento/preview, quando utilizado

No Google Cloud (OAuth Client) e no provedor Google do Supabase:

- **Authorized redirect URI:** `https://<projeto>.supabase.co/auth/v1/callback`
- Client ID e Client Secret cadastrados no provedor Google do Supabase.

Sem esse cadastro, o botão "Continuar com Google" retorna erro de provedor;
o login por e-mail e senha continua funcionando normalmente.

---

## 6. Inteligência (leitura de etiqueta e de cartão)

- Provedor padrão: **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1`),
  modelo `openai/gpt-5.6-sol`, chamado somente pelo servidor.
- Configuração centralizada em `src/lib/ai-provider.server.ts`; para trocar de
  provedor compatível basta definir `AI_BASE_URL`, `AI_MODEL` e `AI_API_KEY`.
- **Sem credencial:** o aplicativo funciona integralmente (login, cotações,
  fornecedores, produtos, painel). Apenas as leituras por imagem respondem:
  _"Leitura inteligente não configurada neste ambiente. Utilize o preenchimento
  manual."_ O preenchimento manual permanece disponível em todos os fluxos.
- As rotas de leitura exigem usuário autenticado e a imagem nunca é gravada.

---

## 7. Reverse proxy (Nginx e equivalentes)

Requisitos mínimos:

- porta interna da aplicação: **3000** (configurável por `PORT`);
- terminar **HTTPS** no proxy — o OAuth e os cookies de sessão exigem domínio
  seguro;
- encaminhar `Host`, `X-Forwarded-Proto`, `X-Forwarded-For` e `X-Real-IP`;
- permitir corpo de requisição de pelo menos **8 MB** (fotos enviadas para
  leitura); em Nginx, `client_max_body_size 8m;`;
- WebSocket não é necessário em produção (somente no servidor de
  desenvolvimento);
- todas as rotas devem ser encaminhadas ao mesmo processo (o servidor responde
  tanto às páginas quanto às rotas `/api/...`); não usar regra de arquivo
  estático com fallback próprio;
- o domínio publicado precisa constar nas Redirect URLs do Supabase.

Healthcheck do proxy/orquestrador: `GET /api/public/health`.

---

## 8. Atualização

```bash
git pull
docker compose up -d --build     # ou docker build + docker run
```

Migrações de banco continuam sendo aplicadas no Supabase.

---

## 9. Troubleshooting

| Sintoma                              | Causa provável / solução                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Logotipo não carrega                 | O arquivo é `public/iga-logo.png`, servido pelo próprio build. Verifique se o `public/` foi copiado no build e se o proxy não bloqueia estáticos. |
| Supabase não conecta                 | Variáveis `VITE_SUPABASE_*` ausentes no **build** ou `SUPABASE_*` ausentes no **runtime**. Rebuild após corrigir as de build-time. |
| OAuth volta para endereço errado     | Site URL/Redirect URLs do Supabase não incluem o domínio da VPS, ou o proxy não envia `X-Forwarded-Proto`. |
| "Leitura inteligente não configurada"| `AI_API_KEY`/`LOVABLE_API_KEY` ausente no runtime — comportamento esperado; use o preenchimento manual.    |
| Container não inicia                 | Verifique `docker logs iga-cotacao`; portas em uso; imagem construída sem os `--build-arg` obrigatórios.   |
| 404 ao recarregar rota interna       | Requisição não chegou ao servidor Node; revise o proxy para encaminhar todas as rotas ao container.        |

---

## 10. Segurança

- `.env` e variantes ficam fora do Git (`.gitignore`); somente `.env.example`
  é versionado, sem valores.
- Nenhum secret é embutido na imagem Docker: são fornecidos em runtime.
- As rotas de Inteligência exigem sessão válida do Supabase.
- Logs registram apenas status e trechos de erro — nunca chaves ou imagens.
