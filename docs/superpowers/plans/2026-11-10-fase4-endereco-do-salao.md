# Fase 4: Salão descoberto pelo endereço do site. Plano de execução

> **Para quem for executar:** use superpowers:executing-plans para seguir tarefa por tarefa. Os passos usam caixas (`- [ ]`) para marcar o andamento.

**Objetivo:** o site e as rotas públicas da API passam a descobrir o salão pelo endereço digitado, e não mais pela LEV fixa no código. Cobre as Tarefas 4.1, 4.2 e 4.4 do plano geral. A 4.3, ligar o domínio comprado na Vercel, fica para quando a dona comprar o domínio.

**Arquitetura:** um módulo puro, `api/_lib/salonAddress.ts`, classifica o endereço. Ele é usado pelo site e pelo servidor. O endereço pode ser da LEV (o atual, as prévias da Vercel e `localhost`), um subdomínio da plataforma ou um domínio próprio. Os dois últimos casos são consultados no banco pela função SQL `salon_for_address`, chamada via `rpc`. Assim não é preciso criar uma rota nova na Vercel: o plano Hobby já está no limite de 12 funções. No navegador, `main.tsx` descobre o salão antes de carregar o `App` (com import dinâmico). O `CURRENT_SALON_ID` continua uma constante síncrona.

**Tecnologias:** React 19 + Vite, funções da Vercel (Node), Supabase (PostgREST + SQL), Vitest.

**Spec:** [`2026-11-03-lev-multi-salao.md`](2026-11-03-lev-multi-salao.md), seção "Fase 4".

## Regras gerais

- A LEV nunca pode ficar fora do ar. O endereço `lev-coworking-beauty.vercel.app` e as prévias `lev-coworking-beauty-*.vercel.app` chegam à LEV **sem consultar o banco**.
- O `salon_id` de uma rota pública vem do cabeçalho `host` da requisição, nunca do corpo nem da URL.
- A migração roda primeiro e é compatível com o código antigo: coluna nova com valor padrão `'{}'`. Ela pode rodar duas vezes sem erro, sem blocos `do $$`, e tem `grant` explícito para `service_role` (ver memória do projeto).
- Sem `any` novo no TypeScript. `npm run lint`, `npm run test` e `npm run build` antes de cada commit.
- Nenhuma rota nova em `api/`, porque o plano Hobby está no limite de 12 funções.
- Textos para o usuário em português simples.

## Pontos de atenção na revisão

1. **LEV com o banco fora do ar:** o endereço atual precisa abrir a LEV mesmo sem resposta do Supabase. Testado na Tarefa 1 (classificação sem rede) e na Tarefa 5 (o navegador não chama o banco para endereço da LEV).
2. **Endereço com porta, letras maiúsculas ou ponto no final** (`Lev.Exemplo.com.br:443.`) → normalizado antes de comparar. Testado na Tarefa 1.
3. **Salão `inativo` ou `bloqueado`, ou o mesmo domínio cadastrado em dois salões** → "salão não encontrado", nunca um salão sorteado. Verificado pelo SQL da Tarefa 2.
4. **Pelo endereço do salão B, alguém tenta cancelar ou confirmar um horário da LEV** → recusado, porque a busca é filtrada pelo salão do endereço. Testado na Tarefa 4.
5. **Banco fora do ar com endereço desconhecido** → servidor responde 503 ("tente de novo"), não 404. O navegador usa o último salão conhecido daquele endereço. Testado nas Tarefas 3 e 5.

---

### Tarefa 1: Classificar o endereço (puro)

**Arquivos:**
- Criar: `api/_lib/salonAddress.ts`
- Teste: `api/_lib/salonAddress.test.ts`

**Interfaces:**
- Consome: `DEFAULT_SALON_ID`, `assertSalonId` de `api/_lib/tenant.ts`
- Produz:
  - `export const PLATFORM_DOMAINS: readonly string[] = []` (a Tarefa 4.3 coloca aqui o domínio comprado)
  - `export const LEGACY_HOST = 'lev-coworking-beauty.vercel.app'`
  - `export type HostKind = { kind: 'default' } | { kind: 'slug'; slug: string } | { kind: 'domain'; domain: string } | { kind: 'invalid' }`
  - `export function normalizeHost(raw: unknown): string | null`
  - `export function classifyHost(raw: unknown, platformDomains: readonly string[] = PLATFORM_DOMAINS): HostKind`
- Precisa continuar puro (é importado pelo navegador): sem `process.env` e sem módulos do Node.

- [x] **Passo 1: testes que falham.** `normalizeHost`:
  - `'Lev.Exemplo.com.br:443'` → `'lev.exemplo.com.br'`
  - `'salao.com.br.'` → `'salao.com.br'`
  - `''`, `undefined`, `'a b.com'` e um texto com mais de 253 caracteres → `null`

  `classifyHost`:
  - `'lev-coworking-beauty.vercel.app'`, `'lev-coworking-beauty-git-main-equipe.vercel.app'`, `'localhost:3000'` e `'127.0.0.1'` → `{ kind: 'default' }`
  - `'outro-projeto.vercel.app'` → `{ kind: 'domain', domain: 'outro-projeto.vercel.app' }`
  - `'demo.localhost:3000'` → `{ kind: 'slug', slug: 'demo' }` (serve para testar no computador)
  - com `['exemplo.com.br']`: `'lev.exemplo.com.br'` → `{ kind: 'slug', slug: 'lev' }`; `'exemplo.com.br'`, `'www.exemplo.com.br'` e `'a.b.exemplo.com.br'` → `{ kind: 'invalid' }`
  - `'www.salaobonito.com.br'` → `{ kind: 'domain', domain: 'salaobonito.com.br' }` (o `www.` é removido)
  - `'Salao_X.com'` → `{ kind: 'invalid' }`
- [x] **Passo 2:** `npx vitest run api/_lib/salonAddress.test.ts` → FALHA (módulo não existe)
- [x] **Passo 3:** implementar. Hostname válido: `^[a-z0-9.-]{1,253}$`, sem `..`. O subdomínio (`slug`) precisa passar no formato do id de salão. `www` nunca é slug.
- [x] **Passo 4:** o mesmo comando → PASSA
- [x] **Passo 5:** commit `feat: classificar endereco do site por salao`

### Tarefa 2: Migração `domains` + função `salon_for_address`

**Arquivos:**
- Criar: `supabase/migrations/20261110_salon_domains.sql`

**Interfaces:**
- Produz: coluna `salons.domains text[] not null default '{}'` e a função `public.salon_for_address(p_slug text, p_domain text) returns text`, com `stable`, `security definer` e `set search_path = public`. Ela devolve o `id` quando **exatamente um** salão com `status not in ('inativo','bloqueado')` tem `slug = p_slug` ou `p_domain = any(domains)`. Nos outros casos devolve `null`. Recebe `grant execute` para `anon`, `authenticated` e `service_role`, e `revoke` de `public`.

- [x] **Passo 1:** escrever a migração, com índice GIN `salons_domains_idx` em `domains` e um check que exige domínios em minúsculas, sem `www.` no começo (`salons_domains_format_check`). No fim, deixar comentadas as consultas de verificação:
  ```sql
  select public.salon_for_address('lev', null);          -- 'lev'
  select public.salon_for_address(null, 'nao-existe.com'); -- null
  select public.salon_for_address('demo', null);         -- 'demo' (status 'teste')
  ```
- [x] **Passo 2:** a dona roda a migração no Supabase (SQL Editor), depois as três consultas, e confere os resultados.
- [x] **Passo 3:** commit `feat(banco): dominios por salao e funcao salon_for_address`

### Tarefa 3: Servidor descobre o salão pela requisição

**Arquivos:**
- Criar: `api/_lib/salonFromRequest.ts`
- Teste: `api/_lib/salonFromRequest.test.ts`

**Interfaces:**
- Consome: `classifyHost` (Tarefa 1), a função `salon_for_address` (Tarefa 2), `supabaseConfig` e `serviceHeaders` de `staffAuth.ts`
- Produz:
  - `export async function resolveSalonFromHost(host: unknown): Promise<string | null>`. Para `default`, devolve `DEFAULT_SALON_ID` sem rede. Para `slug` ou `domain`, faz `POST {url}/rest/v1/rpc/salon_for_address` com `{ p_slug, p_domain }`. Para `invalid`, devolve `null`. Resposta encontrada ou não encontrada fica 60 s em cache por endereço. Falha de rede ou resposta diferente de 2xx lança um `Error` com `status = 503`, que não fica em cache.
  - `export async function publicSalonId(req: { headers?: Record<string, unknown> }, res: { status(code: number): { json(body: unknown): unknown } }): Promise<string | null>`. Lê `req.headers.host`. Quando o resultado é `null`, já responde `404 { error: 'Salão não encontrado.' }` e devolve `null`. O erro 503 sobe para o `catch` da rota.
  - `export const resetSalonHostCache: () => void` (só para os testes)

- [x] **Passo 1: testes que falham** (`fetch` simulado com `vi.stubGlobal`):
  - `'lev-coworking-beauty.vercel.app'` → `'lev'`, e `fetch` não é chamado
  - `'www.salaobonito.com.br'` → o corpo enviado é `{ p_slug: null, p_domain: 'salaobonito.com.br' }`; resposta `"demo"` → `'demo'`
  - resposta `null` → `null`
  - segunda chamada com o mesmo endereço → `fetch` chamado uma vez só
  - `fetch` rejeita → lança erro com `status === 503`; a chamada seguinte tenta a rede de novo
  - `publicSalonId` com endereço desconhecido → `res.status(404)` e `{ error: 'Salão não encontrado.' }`
- [x] **Passo 2:** `npx vitest run api/_lib/salonFromRequest.test.ts` → FALHA
- [x] **Passo 3:** implementar
- [x] **Passo 4:** o mesmo comando → PASSA
- [x] **Passo 5:** commit `feat: servidor descobre o salao pelo endereco`

### Tarefa 4: Rotas públicas usam o endereço

**Arquivos:**
- Modificar: `api/appointments/availability.ts`, `api/appointments/cancel.ts`, `api/appointments/create.ts` (só quando não há login da equipe), `api/whatsapp/appointment.ts`
- Teste: `api/_lib/publicSalonGuard.test.ts`

**Interfaces:**
- Consome: `publicSalonId(req, res)` (Tarefa 3)

- [x] **Passo 1: teste-guarda que falha.** Ele lê como texto os arquivos de `api/` fora de `_lib/` e de testes. `DEFAULT_SALON_ID` só pode aparecer em `api/calendar/sync.ts` (tarefa agendada da LEV). Os quatro arquivos acima precisam conter `publicSalonId(`.
- [x] **Passo 2:** `npx vitest run api/_lib/publicSalonGuard.test.ts` → FALHA
- [x] **Passo 3:** trocar `DEFAULT_SALON_ID` por `const salonId = await publicSalonId(req, res); if (!salonId) return;`. Em `create.ts`, fica `staff ? staff.salonId : await publicSalonId(req, res)`. Apagar os comentários "a fase 4 usa o endereço". Os erros com `status` 503 viram resposta 503 no `catch` da rota (em `create.ts` isso já acontece; nas outras, usar o `status` do erro quando existir).
- [x] **Passo 4:** acrescentar em `api/_lib/salonFromRequest.test.ts` o teste do item 4 da revisão. Com `host` do salão `demo` e o `fetch` do agendamento devolvendo `[]`, chamar o handler de `cancel.ts`. A URL consultada contém `salon_id=eq.demo` e a resposta é 404.
- [x] **Passo 5:** `npm run test` → tudo passa. `npm run lint` → sem erros.
- [x] **Passo 6:** commit `feat: rotas publicas usam o salao do endereco`

### Tarefa 5: Site descobre o salão antes de abrir

**Arquivos:**
- Criar: `src/config/siteSalon.ts`, `src/config/siteSalon.test.ts`, `src/components/public/SalonNotFound.tsx`
- Modificar: `src/config/salon.ts`, `src/main.tsx`
- Teste-guarda: `src/config/siteSalonGuard.test.ts`

**Interfaces:**
- Consome: `classifyHost`, `DEFAULT_SALON_ID`, `assertSalonId`, e a função `salon_for_address` (via `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`)
- Produz:
  - `export type SiteSalon = { status: 'ok'; salonId: string } | { status: 'not_found' } | { status: 'offline' }`
  - `export async function resolveSiteSalon(host: string, deps?: { fetchImpl?: typeof fetch; storage?: Pick<Storage, 'getItem' | 'setItem'>; envSalonId?: unknown }): Promise<SiteSalon>`. Para `default`, devolve `envSalonId` (`VITE_SALON_ID`) quando ele é válido e `DEFAULT_SALON_ID` nos outros casos, sem rede. Para `slug` ou `domain`, chama a `rpc`. Quando encontra, grava em `storage` na chave `lev_salon_for_host:<host>`. Quando a rede falha, usa o valor gravado ou devolve `offline`. Para `invalid` ou resposta `null`, devolve `not_found`.
  - `export function setBootSalonId(id: string): void` e `export function bootSalonId(): string | null`
  - `salon.ts`: `CURRENT_SALON_ID = bootSalonId() ?? resolveSalonId(import.meta.env.VITE_SALON_ID)` (os testes e o código antigo continuam funcionando sem a etapa de abertura)
  - `SalonNotFound` com a prop `variant: 'not_found' | 'offline'`. Visual neutro, sem nome nem cores da LEV. No modo `offline`, mostra o botão "Tentar de novo" (recarrega a página).

- [x] **Passo 1: testes que falham** (`siteSalon.test.ts`):
  - `'lev-coworking-beauty.vercel.app'` → `{ status: 'ok', salonId: 'lev' }`, e `fetchImpl` não é chamado
  - `'localhost:3000'` com `envSalonId: 'demo'` → `'demo'`; com `envSalonId: 'X!'` → `'lev'`
  - `'demo.localhost:3000'` com a rpc devolvendo `"demo"` → `ok/demo`, e `storage.setItem('lev_salon_for_host:demo.localhost', 'demo')`
  - a rpc devolvendo `null` → `not_found`
  - `fetchImpl` rejeitando com o valor gravado `'demo'` → `ok/demo`; sem valor gravado → `offline`

  `siteSalonGuard.test.ts`:
  - `src/main.tsx` não tem `import` estático de `./App`, `./context/` nem `./services/`
  - `src/config/siteSalon.ts` não importa `./salon`
- [x] **Passo 2:** `npx vitest run src/config` → FALHA
- [x] **Passo 3:** implementar `siteSalon.ts` e `SalonNotFound.tsx`, e ajustar `salon.ts`. Em `main.tsx`, criar uma função `start()` assíncrona (sem `await` no nível de cima, porque o alvo do build não aceita). Ela valida as variáveis, chama `resolveSiteSalon(window.location.host)` e mostra `SalonNotFound` quando não é `ok`. Quando é `ok`, chama `setBootSalonId` e depois faz `await import('./App.tsx')` e `await import('./context/CoworkingContext.tsx')`.
- [x] **Passo 4:** `npx vitest run src/config` → PASSA. `npm run test`, `npm run lint` e `npm run build` → sem erros.
- [x] **Passo 5:** conferir no computador. `npm run dev`, abrir `http://localhost:3000` (LEV) e `http://demo.localhost:3000` (Studio Aurora, depois da Tarefa 2 rodada no banco). Abrir também `http://nao-existe.localhost:3000` (deve aparecer "salão não encontrado").
- [x] **Passo 6:** commit `feat: site descobre o salao pelo endereco`

### Tarefa 6: Conferência final e publicação

- [x] **Passo 1:** confirmar que a migração da Tarefa 2 está no banco de produção (as consultas do Passo 2 da Tarefa 2).
- [x] **Passo 2:** `npm run e2e` → passa.
- [x] **Passo 3:** com a aprovação da dona, publicar (juntar em `main` e `git push origin main`). No site no ar (`lev-coworking-beauty.vercel.app`), conferir que a LEV abre, que dá para agendar e cancelar um horário de teste, e que o painel da admin continua funcionando.
- [ ] **Passo 4 (opcional, precisa da dona):** adicionar na Vercel um endereço gratuito `*.vercel.app` para o projeto e registrá-lo em `salons.domains` do `demo`. Abrir esse endereço e conferir que aparece o Studio Aurora.
- [x] **Passo 5:** atualizar a seção "Fase 4" do plano geral (4.1, 4.2 e 4.4 feitas; falta a 4.3) e fazer o commit `docs: fase 4 sem o dominio concluida`.

## Fora deste plano

- **4.3:** colocar o domínio comprado em `PLATFORM_DOMAINS` e o domínio coringa na Vercel.
- O link de confirmação do WhatsApp (`confirmLink.ts`) ainda usa o endereço da LEV. Ele passa a ser por salão na Fase 6 (WhatsApp por salão). Hoje só a LEV manda mensagens.
- A lista de origens permitidas em `security.ts` só importa para chamadas de outro site. O site sempre chama a própria API pelo mesmo endereço, então ela não muda aqui.
