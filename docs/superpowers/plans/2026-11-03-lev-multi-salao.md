# Plano: transformar o sistema da LEV em produto para vários salões

> **Para quem vai executar (agente ou programador):** use superpowers:subagent-driven-development ou superpowers:executing-plans, tarefa por tarefa. Os passos usam caixinhas (`- [ ]`) para marcar o andamento.

**Objetivo:** o mesmo sistema atender vários salões ao mesmo tempo. Cada salão tem seus dados, sua marca, seu endereço e seu WhatsApp, e nenhum salão vê os dados de outro. A LEV continua funcionando sem interrupção durante toda a mudança.

**Como vai funcionar:** todo dado do banco ganha uma etiqueta `salon_id` (de qual salão ele é). O servidor sempre filtra por essa etiqueta. Tudo o que hoje está escrito no código só para a LEV (profissionais, catálogo, textos, agendas) passa a vir do banco. Cada salão é reconhecido pelo endereço do site. A LEV vira o salão `lev`, o primeiro cliente.

**Tecnologia:** React 19 + TypeScript + Vite (site), rotas de API na Vercel, Supabase (Postgres + login), robô OpenWA no servidor Hostinger, Google Agenda.

**Especificação:** a conversa de 03/11/2026 (lista de funcionalidades + modelo de preço "implantação + mensalidade"). Este documento é o plano e a especificação ao mesmo tempo.

---

## Resumo em linguagem simples (para a dona do projeto)

| Fase | O que muda na prática | Tamanho |
|---|---|---|
| 1. Etiqueta de salão no banco | Cada informação passa a ter "dona". A LEV continua igual. | Médio |
| 2. Tirar dados do navegador | Financeiro, configurações, profissionais e bloqueios passam a ficar salvos na nuvem. **Hoje ficam só no aparelho de quem lançou.** | Médio |
| 3. Tirar a LEV de dentro do código | Nomes, fotos, catálogo, textos e agendas passam a vir do cadastro do salão. | Grande |
| 4. Endereço de cada salão | `nomedosalao.seudominio.com.br` ou domínio próprio. | Pequeno |
| 5. Acessos por salão + painel do dono do produto | Você vê todos os salões. Cada salão vê só o seu. | Médio |
| 6. WhatsApp por salão | Cada salão conecta o próprio número no robô. | Médio |
| 7. Cadastro de novo salão + cobrança | Passo a passo para implantar e cobrança mensal automática. | Médio |
| 8. Lado comercial | Contrato, termos de proteção de dados, página de vendas, suporte. | Pequeno (sem código) |

**Ordem obrigatória:** 1 → 2 → 3 → 4 → 5 → 6 → 7. A fase 8 pode andar em paralelo.
**Fases 1 e 2 valem a pena mesmo que você nunca venda o sistema.** A fase 2 corrige um problema real da LEV: o financeiro lançado num celular não aparece no computador.

Este arquivo detalha a **Fase 1** passo a passo. As outras fases estão descritas no nível de tarefa. Cada uma ganha o próprio plano detalhado logo antes de começar, porque depende do que a fase anterior deixou pronto.

---

## Regras que valem para todas as fases

- A LEV nunca pode ficar fora do ar. Toda mudança no banco é feita primeiro e precisa ser compatível com o código antigo (coluna nova com valor padrão `'lev'`). Só depois o código novo é publicado.
- Identificador de salão: texto curto, só letras minúsculas, números e hífen, de 2 a 40 caracteres (`^[a-z0-9-]{2,40}$`). O da LEV é `lev`.
- O `salon_id` de uma requisição **nunca** vem do que o navegador manda. Ele vem do login da profissional ou admin, ou do endereço do site (fase 4). O formulário público não escolhe salão.
- Sem `any` no TypeScript (regra do projeto). Rodar `npm run lint`, `npm run test` e `npm run build` antes de cada commit.
- Chaves e senhas nunca no código nem no chat. Ficam só na Vercel e no Supabase.
- Respostas e textos para o usuário em português simples.

## Pontos de atenção na revisão

Erros que os testes de cada tarefa podem deixar passar, do mais provável ao menos provável:

1. **Vazamento entre salões:** uma consulta esquecida sem filtro de `salon_id` mostra agendamentos de outro salão. → Coberto pelo teste-guarda da Tarefa 1.3, que falha se qualquer chamada `rest/v1/` ficar sem filtro.
2. **Mesmo telefone em dois salões:** hoje `client_profiles.phone_digits` é único no banco todo, então a cliente da LEV não conseguiria ser cliente de outro salão. → A Tarefa 1.1 troca para único por `(salon_id, phone_digits)`, e a verificação SQL testa isso.
3. **Profissional logada no salão A pede dados do salão B** mudando o endereço da requisição. → Tarefa 1.4: o `salonId` vem só do cadastro de acesso, com teste.
4. **Robô manda lembrete com o nome ou link de outro salão.** → Fase 6. O teste do cron precisa ter dois salões no mesmo lote.
5. **Agendamento duplicado no mesmo horário** depois da mudança de filtros. → A verificação da Tarefa 1.6 refaz o teste de conflito de horário que já existe.

---

## Fase 1 — Etiqueta de salão no banco (detalhada)

### Arquivos

- Criar: `supabase/migrations/20261104_salons.sql`: tabela `salons` + coluna `salon_id` em todas as tabelas.
- Criar: `api/_lib/tenant.ts`: validação do id e montagem do filtro.
- Criar: `api/_lib/tenant.test.ts`
- Criar: `api/_lib/tenantGuard.test.ts`: teste-guarda que lê o código e acusa consultas sem filtro.
- Modificar: `api/_lib/staffAuth.ts` (identidade ganha `salonId`), `api/_lib/appointmentService.ts`, `api/_lib/bookingCatalog.ts`, `api/appointments/*.ts`, `api/clients/index.ts`, `api/cron/send-reminders.ts`, `api/calendar/*.ts`, `api/whatsapp/*.ts`
- Criar: `src/config/salon.ts`; modificar `src/services/cloudAppointments.ts`, `cloudClients.ts`, `cloudServiceCatalog.ts`, `professionalAuth.ts`, `adminAuth.ts`, `whatsappConversations.ts`

### Tarefa 1.1: Migração do banco

**Arquivos:** criar `supabase/migrations/20261104_salons.sql`

**Interfaces produzidas:** tabela `public.salons(id text pk, slug text unique not null, name text not null, status text not null default 'ativo', created_at timestamptz default now())`. Coluna `salon_id text not null default 'lev' references public.salons(id)` nas tabelas `appointments`, `catalog_services`, `client_profiles`, `professional_access`, `admin_users`, `whatsapp_conversations`, `whatsapp_messages`, `reminder_history`, com índice `<tabela>_salon_id_idx`.

- [ ] **Passo 1:** escrever a migração com:
  - `insert into salons (id, slug, name) values ('lev','lev','LEV Coworking Beauty') on conflict do nothing`;
  - `alter table … add column if not exists salon_id …` em cada tabela;
  - em `client_profiles`: remover a restrição única de `phone_digits` e criar `unique (salon_id, phone_digits)`;
  - `check (id ~ '^[a-z0-9-]{2,40}$')` em `salons.id`.
  A migração precisa poder rodar duas vezes sem erro.
  Observação: a regra antiga `unique(phone_digits)` é mantida nesta migração (o código antigo ainda precisa dela) e só é removida depois, pela migração `20261104b` (Tarefa 1.5). A tabela `salons` fica com RLS ligado e sem nenhuma policy (só o servidor acessa).
- [ ] **Passo 2:** a dona do projeto roda a migração no Supabase (SQL Editor). Em seguida, rodar a verificação:
  ```sql
  select table_name from information_schema.columns
   where column_name = 'salon_id' and table_schema = 'public' order by 1;
  -- esperado: as 8 tabelas listadas acima
  select count(*) from appointments where salon_id <> 'lev';  -- esperado: 0
  ```
- [ ] **Passo 3:** abrir o site no ar e fazer um agendamento de teste. Ele precisa funcionar igual a antes (o código antigo ignora a coluna nova).
- [ ] **Passo 4:** commit `feat(banco): tabela de saloes e etiqueta salon_id`

### Tarefa 1.2: Funções de salão no servidor

**Arquivos:** criar `api/_lib/tenant.ts` e `api/_lib/tenant.test.ts`

**Interfaces produzidas:**
- `export const DEFAULT_SALON_ID = 'lev'`
- `export function assertSalonId(id: string): string`: devolve o id ou lança `Error('salon_id inválido')`
- `export function salonFilter(id: string): string`: devolve `salon_id=eq.<id>`, depois de validar
- `export function withSalon<T extends object>(row: T, id: string): T & { salon_id: string }`

- [ ] **Passo 1: testes que falham**
  - `assertSalonId('lev')` → `'lev'`; `assertSalonId('salao-da-ana')` → ok
  - `assertSalonId('LEV')`, `assertSalonId('a')`, `assertSalonId("lev;drop")`, `assertSalonId('')` → lançam erro
  - `salonFilter('lev')` → `'salon_id=eq.lev'`
  - `withSalon({ a: 1 }, 'lev')` → `{ a: 1, salon_id: 'lev' }`; `withSalon({ salon_id: 'x' }, 'lev').salon_id` → `'lev'` (o servidor sempre ganha)
- [ ] **Passo 2:** `npx vitest run api/_lib/tenant.test.ts` → FALHA (módulo não existe)
- [ ] **Passo 3:** implementar
- [ ] **Passo 4:** rodar de novo → PASSA
- [ ] **Passo 5:** commit `feat(api): funcoes de identificacao do salao`

### Tarefa 1.3: Teste-guarda contra consultas sem filtro

**Arquivos:** criar `api/_lib/tenantGuard.test.ts`

**Interfaces consumidas:** nenhuma (lê os arquivos como texto).

- [ ] **Passo 1: escrever o teste.** Ele percorre `api/**/*.ts` e `src/services/**/*.ts` (sem `*.test.ts`) e acha cada trecho com `rest/v1/<tabela>`. Para as 8 tabelas da Tarefa 1.1, a mesma expressão de URL, ou a linha de chamada `fetch` mais próxima até 6 linhas abaixo, precisa conter `salonFilter(` ou `withSalon(`. Lista de exceções explícita no próprio teste: `rest/v1/salons`.
  Controle positivo: uma string fixa com `rest/v1/appointments?id=eq.1` sem filtro precisa ser acusada pela função de verificação.
  Controle negativo: `` `rest/v1/appointments?${salonFilter(id)}` `` não pode ser acusada.
  Além disso, o teste falha se encontrar **zero** ocorrências de `rest/v1/` (proteção contra um teste que não lê nada).
- [ ] **Passo 2:** rodar → FALHA, listando todos os arquivos que ainda não filtram (lista esperada: os arquivos de "Modificar" acima)
- [ ] **Passo 3:** commit apenas do teste, marcado com `it.todo` para os arquivos ainda pendentes. A Tarefa 1.5 transforma em `it` normal.

### Tarefa 1.4: Login das profissionais e da admin carrega o salão

**Arquivos:** modificar `api/_lib/staffAuth.ts`; criar `api/_lib/staffAuth.test.ts`

**Interfaces:**
- Consome: `assertSalonId` (1.2)
- Produz: `StaffIdentity = { userId: string; role: 'admin' | 'profissional'; professionalId?: string; salonId: string }`. `authenticateStaff` lê `salon_id` da linha de `admin_users` ou `professional_access` daquele usuário.

- [ ] **Passo 1: testes que falham** (com `fetch` simulado):
  - admin com linha `{ salon_id: 'lev' }` → identidade com `salonId: 'lev'`
  - profissional aprovada com `salon_id: 'salao-b'` → `salonId: 'salao-b'`
  - linha sem `salon_id` ou com valor inválido → `null` (acesso negado, nunca cair para `'lev'`)
- [ ] **Passo 2:** rodar → FALHA
- [ ] **Passo 3:** implementar
- [ ] **Passo 4:** rodar → PASSA
- [ ] **Passo 5:** commit `feat(api): identidade da equipe inclui o salao`

### Tarefa 1.5: Aplicar o filtro em todas as consultas

**Arquivos:** os listados em "Modificar" no início da fase.

**Interfaces:**
- Consome: `salonFilter`, `withSalon`, `DEFAULT_SALON_ID` (1.2); `StaffIdentity.salonId` (1.4)
- Produz: `src/config/salon.ts` com `export const CURRENT_SALON_ID: string = 'lev'` (na fase 4 passa a vir do endereço)

Regra para escolher o salão em cada rota:
- rotas da equipe (`staff-list`, `calendar/*`, `clients`, `whatsapp/send`): usar `identity.salonId`;
- rotas públicas (`availability`, `create`, `cancel`, `confirmar`): usar `DEFAULT_SALON_ID` por enquanto (a fase 4 troca pelo endereço);
- `cron/send-reminders`: buscar `salons` com `status = 'ativo'` e processar salão por salão.

- [ ] **Passo 1:** trocar cada consulta. Em leituras, acrescentar `&${salonFilter(id)}`. Em gravações, usar `withSalon(row, id)`.
- [ ] **Passo 2:** trocar os `it.todo` da Tarefa 1.3 por `it` e rodar `npx vitest run api/_lib/tenantGuard.test.ts` → PASSA
- [ ] **Passo 3:** `npm run test` → todos os testes antigos continuam passando (hoje são 153)
- [ ] **Passo 4:** `npm run lint` e `npm run build` sem erros em `src/` e `api/`
- [ ] **Passo 5:** commit `feat: todas as consultas filtradas por salao`

### Tarefa 1.6: Verificação final e publicação

- [ ] **Passo 1:** confirmar que a migração 1.1 já está no banco de produção (consulta do Passo 2 da 1.1).
- [ ] **Passo 2:** `npm run e2e` → passa.
- [ ] **Passo 3:** publicar (`git push origin main`) e, no site no ar, testar:
  - fazer um agendamento → aparece no painel da admin, no Google Agenda e chega o aviso do WhatsApp;
  - tentar agendar o mesmo horário de novo → recusado;
  - cancelar → horário volta a ficar livre.
- [ ] **Passo 4:** teste de isolamento, no Supabase: criar o salão `teste-isolamento` com `status = 'inativo'`, um telefone falso que não existe e um agendamento com status diferente de `confirmado` e `aguardando_confirmacao`, para o cron nunca mandar WhatsApp por causa dele. Conferir que ele **não** aparece no painel da LEV. Depois apagar os dois (pedir aprovação antes de apagar).
- [ ] **Passo 5:** depois de publicar, entrar como admin e como profissional e confirmar que o acesso continua funcionando.
- [ ] **Passo 6:** rodar `20261104b` (remove a regra antiga do telefone) só alguns dias depois de publicar, quando não houver mais chance de voltar o site para a versão antiga.

---

## Fase 2 — Tirar dados do navegador

> **Situação (07/11/2026): concluída e no ar.** Plano detalhado: [`2026-11-04-fase2-dados-na-nuvem.md`](2026-11-04-fase2-dados-na-nuvem.md). Migração rodada no Supabase; conferido com a dona: dados do computador da admin subiram sem mudar os totais (R$ 850,00 em 01–07/11), pagamento lançado no celular chegou à nuvem, bloqueio some do site e o novo botão "Desbloquear" libera o horário, profissional não vê o financeiro das colegas. Talitha e Nayara dispensadas pela dona. Na conferência apareceu e foi corrigido um erro antigo: o pagamento lançado na agenda não marcava o atendimento como pago na nuvem.
>
> **Fica para a Fase 3:** os ids de `catalog_services` (ex.: `srv_tal_1`) ainda podem se repetir entre salões. Resolver junto com a troca dos ids fixos das profissionais (Tarefa 3.1).

**Problema atual:** `src/services/storage.ts` guarda no `localStorage` (memória do navegador) o financeiro (`PAYMENTS`), as configurações (`SETTINGS`), as profissionais (`PROFESSIONALS`), os bloqueios (`BLOCKS`), a lista de espera (`WAITLIST`) e o histórico (`LOGS`). Esses dados não passam de um aparelho para outro e se perdem se o navegador for limpo.

- **Tarefa 2.1:** tabelas `salon_settings` (1 linha por salão, `payload jsonb`), `professionals`, `payments`, `schedule_blocks`, `waitlist`, `audit_logs`. Todas com `salon_id` e regras de acesso (RLS) por salão.
- **Tarefa 2.2:** rotas de API para ler e gravar cada uma, com teste de que uma profissional não lê pagamentos de outra profissional nem de outro salão.
- **Tarefa 2.3:** `StorageService` passa a ler da nuvem e guarda o `localStorage` só como cópia para abrir rápido. Ao primeiro acesso, enviar os dados que existirem no aparelho, sem duplicar.
- **Tarefa 2.4:** levar o financeiro da LEV que estiver nos aparelhos da Elisangela, da Talitha e da Nayara. Precisa abrir o painel uma vez em cada aparelho depois da publicação. Conferir os totais antes e depois.
- **Aceite:** um lançamento financeiro feito no celular aparece no computador.

**Condição de entrada (antes de ter um segundo salão de verdade):**
- Os ids de `catalog_services` (ex.: `srv_tal_1`) se repetem entre salões. É preciso chave composta ou ids com o salão no nome.
- RLS por salão em todas as tabelas (hoje o navegador ainda consegue escolher o `salon_id`).

## Fase 3 — Tirar a LEV de dentro do código

> **Situação (10/11/2026): concluída e no ar.** Plano detalhado: [`2026-11-07-fase3-tirar-lev-do-codigo.md`](2026-11-07-fase3-tirar-lev-do-codigo.md). As duas migrações (`20261108` e `20261108b`) foram rodadas no Supabase; a chave do catálogo agora é `(salon_id, id)`, então os ids de serviço podem se repetir entre salões. Agenda do Google de cada profissional fica em `professional_calendars` (só o servidor lê). Salão de exemplo "Studio Aurora" cadastrado (`salon_id = 'demo'`) e conferido localmente, sem nenhum vestígio da LEV. Na conferência com a dona apareceram e foram corrigidos dois erros antigos da tela de Serviços: (1) ao salvar, a admin via "Sua sessão expirou", porque a tela pegava o papel de quem estava logada do lugar errado (desde jul/2026); (2) o preço editado era gravado, mas o preço de fábrica voltava por cima, porque a edição perdia a versão do catálogo (desde ago/2026). Conferido: a dona mudou o preço da Mão Tradicional para R$ 36, ficou salvo, e voltou para R$ 35.
>
> **Observação:** a tela de Serviços não envia mais a cópia do aparelho para o banco ao abrir (antes isso estava parado pelo erro 1 e, se voltasse a funcionar, uma cópia velha de um celular podia apagar preços certos).

Hoje os ids `prof_elisangela`, `prof_talitha` e `prof_nayara` aparecem em 17 arquivos, e o texto "LEV" em 48.

- **Tarefa 3.1:** `ProfessionalProfileId` deixa de ser uma lista fixa e vira `string` vinda da tabela `professionals`. Atualizar `bookingCatalog.ts`, `AgendaView`, `ProfessionalLoginPage`, `RoleSwitcherModal`, `PortfolioPage`, `formatters.ts` e `whatsappTemplates.ts`.
- **Tarefa 3.2:** agenda do Google por profissional guardada na tabela `professionals.google_calendar_id`, no lugar das variáveis `GOOGLE_CALENDAR_ID_ELISANGELA` etc. A conta de serviço do Google continua a mesma; cada salão compartilha as próprias agendas com ela.
- **Tarefa 3.3:** marca do salão em `salon_settings`: nome, logo, capa, cores, fotos do ambiente, textos da página inicial, avaliações do Google, link do Google, Instagram e política de cancelamento. A página pública lê tudo daí.
- **Tarefa 3.4:** textos das mensagens do robô com `{salao}`, `{profissional}`, `{link}` no lugar de "LEV".
- **Tarefa 3.5:** teste-guarda: nenhum arquivo em `src/` e `api/` (fora `src/data/` e testes) pode conter `prof_elisangela|prof_talitha|prof_nayara` nem `LEV Coworking`.
- **Aceite:** com um segundo salão cadastrado, a página dele mostra os próprios nomes, fotos, preços e cores, sem nenhum vestígio da LEV.

## Fase 4 — Endereço de cada salão

- **Tarefa 4.1:** coluna `salons.domains text[]`. Função `resolveSalonFromHost(host): Promise<string | null>` com testes: `lev.seudominio.com.br` → `lev`; domínio próprio cadastrado → o salão dele; endereço desconhecido → `null` → página "salão não encontrado".
- **Tarefa 4.2:** `CURRENT_SALON_ID` (site) e as rotas públicas (API) passam a usar o endereço.
- **Tarefa 4.3:** na Vercel: domínio coringa `*.seudominio.com.br` + domínios próprios dos clientes. **Precisa de você:** comprar o domínio do produto e escolher o nome.
- **Tarefa 4.4:** o endereço atual `lev-coworking-beauty.vercel.app` continua levando à LEV, para não quebrar links já enviados.

## Fase 5 — Acessos por salão e painel do dono do produto

- **Tarefa 5.1:** papel novo `superadmin` (você), em tabela própria `platform_admins`.
- **Tarefa 5.2:** página `/plataforma` com a lista de salões, situação (ativo, em teste, bloqueado), número de agendamentos no mês, robô conectado ou não, e botão para entrar no painel de um salão (fica registrado no histórico).
- **Tarefa 5.3:** a admin de cada salão aprova as próprias profissionais (o que existe hoje, agora limitado ao salão dela).
- **Tarefa 5.4:** opção por salão "profissionais veem a agenda umas das outras" (`salon_settings.payload.sharedAgenda`). **Na LEV fica ligada** (decisão da dona, 04/11/2026: lá as profissionais veem as agendas reciprocamente, como já funciona hoje). Para salões novos, começa desligada, e cada profissional vê só a própria agenda, a não ser que a admin ligue. Ver ou não ver é só leitura: mexer, finalizar ou cancelar o horário de outra profissional continua proibido para todas, ligada ou desligada (regra que já existe no servidor). O filtro precisa ser feito no servidor (`api/appointments/staff-list.ts`), não só na tela.
- **Aceite:** a admin do salão B não consegue ver nada da LEV, nem mudando o endereço manualmente.

## Fase 6 — WhatsApp por salão

- **Tarefa 6.1:** coluna `salons.openwa_session_id`. `sendOpenWaText` recebe o salão e usa a sessão dele. Sem sessão, não envia e registra o motivo.
- **Tarefa 6.2:** tela "Conectar WhatsApp" no painel da admin: mostra o QR Code da sessão do salão, para escanear pelo celular.
- **Tarefa 6.3:** o cron envia por salão, respeitando o limite de mensagens **por número**. Teste com dois salões no mesmo lote: cada mensagem sai pelo número certo, com o nome certo.
- **Tarefa 6.4:** medir quantas sessões o servidor Hostinger atual (KVM 2) aguenta. Cada sessão usa um navegador escondido, com consumo estimado de 150 a 300 MB de memória. Definir a partir de quantos salões é preciso um servidor maior.
- **Opcional 6.5:** WhatsApp oficial da Meta como plano "premium", sem risco de bloqueio e cobrado por mensagem.

## Fase 7 — Cadastro de novo salão e cobrança

- **Tarefa 7.1:** assistente de implantação em `/plataforma/novo`: dados do salão → profissionais → serviços e preços → fotos e marca → conectar WhatsApp → publicar.
- **Tarefa 7.2:** cobrança mensal por Asaas ou Mercado Pago (Pix, boleto e cartão; ambos funcionam bem para empresa brasileira pequena). A plataforma recebe o aviso de pagamento e atualiza `salons.status`.
- **Tarefa 7.3:** inadimplência: 7 dias de aviso. Depois disso, o painel mostra uma faixa e o agendamento público continua funcionando por mais 7 dias, para não punir as clientes do salão. Só então bloqueia.
- **Tarefa 7.4:** período de teste grátis configurável (sugestão: 14 dias).

## Fase 8 — Lado comercial (sem programação)

- Contrato de prestação de serviço: o que está incluído, suporte (horário e canal), reajuste anual, cancelamento.
- LGPD: o salão é o "controlador" dos dados das clientes e você é o "operador". É preciso um termo de tratamento de dados. As páginas `/politica-de-privacidade` e `/exclusao-de-dados` passam a ser por salão.
- Página de vendas com a LEV como exemplo (site no ar + 24 avaliações 5 estrelas).
- Preço sugerido: implantação de R$ 2.500 a R$ 5.000 + mensalidade de R$ 197 a R$ 397, conforme o número de profissionais.
- Decidir se as telas pela metade (lista de espera, fidelidade, histórico) entram como diferencial. Encaixam bem depois da Fase 2.

---

## Decisões que só a dona do projeto pode tomar

1. Nome e domínio do produto (Fase 4).
2. Empresa que vai cobrar e emitir nota fiscal: MEI ou outro formato. O limite de faturamento do MEI pode ser atingido com cerca de 20 a 30 salões.
3. Robô não oficial (mais barato, com risco de bloqueio) ou oficial da Meta, ou os dois como planos diferentes (Fase 6).
4. Se a LEV paga mensalidade ou fica como cliente-modelo gratuita.
