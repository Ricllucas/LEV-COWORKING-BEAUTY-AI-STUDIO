# Fase 3: tirar a LEV de dentro do código (plano de implementação)

> **Para quem vai executar (agente ou programador):** use superpowers:subagent-driven-development ou superpowers:executing-plans, tarefa por tarefa. Os passos usam caixinhas (`- [ ]`) para marcar o andamento.

**Objetivo:** o mesmo código serve qualquer salão. Nomes, fotos, preços, cores, textos e mensagens do robô vêm do banco (ou, só para a LEV, de um arquivo de dados de fábrica). Um salão de exemplo inventado ("Studio Aurora", id `demo`) mostra a própria página sem nenhum vestígio da LEV.

**Arquitetura:** no site, `CURRENT_SALON_ID` decide de qual salão são os dados; os "dados de fábrica" (`INITIAL_*`) só valem para a LEV (`bundledDataFor`). No servidor, um módulo novo `api/_lib/salonDirectory.ts` lê nome do salão, profissionais e agenda do Google do banco, com os dados da LEV em `api/_lib/levDefaults.ts` como reserva caso a leitura falhe. **Nenhuma rota nova na Vercel** (12 de 12 no plano Hobby).

**Tecnologia:** React 19 + TypeScript + Vite + Tailwind 4, Supabase (PostgREST + RLS), Vitest, Playwright.

**Especificação:** `docs/superpowers/plans/2026-11-03-lev-multi-salao.md`, seção "Fase 3".

## Regras gerais

- **A LEV não pode mudar para as clientes.** Com `CURRENT_SALON_ID = 'lev'`, a página pública, o agendamento e as mensagens do robô ficam idênticos (textos aprovados pela dona em 04/11/2026). Rótulos internos do painel e mensagens de erro da equipe podem perder a palavra "LEV" ("Acesso restrito à equipe do salão.").
- **O código funciona antes da migração ser rodada.** Sem a coluna `google_calendar_id`, a LEV continua usando as variáveis `GOOGLE_CALENDAR_ID_*` da Vercel.
- **Os ids da LEV continuam valendo nos dados.** `prof_elisangela`, `prof_talitha`, `prof_nayara` seguem no banco; só saem do código.
- **Lugares permitidos para dados da LEV:** `src/data/**`, `api/_lib/levDefaults.ts` e arquivos de teste. Em qualquer outro lugar, o teste-guarda (Tarefa 7) falha.
- Ids técnicos que já existem no Google Agenda (`calendarEventId` com prefixo `lev`, propriedade `levAppointmentId`) **não mudam**: mudar quebraria a busca dos eventos já criados.
- Chaves antigas do `localStorage` da LEV (`lev_coworking_*`) **não mudam**, para não perder o que está nos aparelhos.
- TypeScript sem `any` novo. Testes antes de cada commit (`npm run test -- --run` e `npm run lint`).
- Agendar pela página do salão de exemplo **dá erro de propósito** até a Fase 4 (as rotas públicas ainda usam o salão `lev`, e a Tarefa 4 recusa profissional que não é do salão).

## Decisões tomadas por mim (conferir)

1. Salão de exemplo: id `demo`, nome "Studio Aurora", status `teste` (o cron só envia para `ativo`, então o robô nunca manda mensagem por ele). Duas profissionais: `prof_aurora_ana` (Ana, cabelo) e `prof_aurora_bia` (Bia, unhas). Imagens próprias em SVG simples, em `public/salao-exemplo/`.
2. Para ver o salão de exemplo no computador: `VITE_SALON_ID=demo npm run dev`. Na Vercel essa variável **não** é criada.
3. Cores da marca: 5 cores (`text`, `primary`, `accent`, `background`, `surface`). Os dois tons raros da LEV (`#B39A70` e `#6B5440`, só no meio de degradês) passam a usar `accent` e `primary`. Diferença mínima; conferida por foto antes/depois (Tarefa 8).
4. Página de portfólio: continua só da LEV. Para outros salões, o link não aparece e a rota mostra a página inicial.
5. Arquivos mortos apagados: `api/_lib/whatsappTemplates.ts`, `api/_lib/reminderScheduler.ts`, `api/_lib/whatsappService.ts` (nenhuma rota usa) e a função `professionalName` de `api/_lib/whatsapp.ts` (ninguém chama).
6. Chave do catálogo `(salon_id, id)` em duas etapas: a primeira migração só acrescenta a regra nova; a troca da chave principal roda depois da publicação (`20261108b`).
7. Edição da marca pelo painel da admin **não** entra nesta fase (fica para o assistente da Fase 7). A marca do salão de exemplo é gravada pelo script SQL.

## Review Focus

1. **Salão de exemplo herdando dados da LEV** (catálogo de fábrica misturado, `localStorage` do mesmo navegador compartilhado). → Teste na Tarefa 2.
2. **Agendamento de outro salão indo para o Google Agenda da LEV** (reserva `GOOGLE_CALENDAR_ID` usada para qualquer salão). → Teste na Tarefa 4.
3. **Texto aprovado das mensagens da LEV mudando sem querer** ao trocar "LEV" por `{salao}`. → Teste de texto exato na Tarefa 5.
4. **Banco fora do ar ou migração ainda não rodada**: a LEV precisa continuar com nomes, telefones e agenda certos. → Teste na Tarefa 4.
5. **Agendamento público com profissional de outro salão ou inventada** sendo aceito. → Teste na Tarefa 4.

---

## Tarefa 0: preparação

- [ ] **Passo 1:** a partir de `main` atualizada, criar o ramo `fase3-sem-lev`.
- [ ] **Passo 2:** com `npm run dev`, tirar fotos de tela da página inicial da LEV (celular 390×844 e computador 1440×900), do modal de agendamento aberto no passo 1 e da página `/portfolio`. Salvar em `docs/test-reports/fase3-antes/`. Commit `docs: fotos da LEV antes da fase 3`.

## Tarefa 1: banco e salão de exemplo

**Arquivos:**
- Criar: `supabase/migrations/20261108_fase3_salao_proprio.sql`
- Criar: `supabase/migrations/20261108b_catalogo_chave_por_salao.sql`
- Criar: `supabase/seeds/salao_exemplo.sql`, `supabase/seeds/salao_exemplo_remover.sql`
- Criar: `public/salao-exemplo/logo.svg`, `capa.svg`, `ana.svg`, `bia.svg`

**Produz:**
- `public.professionals.google_calendar_id text` (pode ser nulo). Fica fora do `payload`, então a sincronização do painel (que grava só `payload`) não apaga.
- Regra única `catalog_services_salon_id_id_key unique (salon_id, id)`.
- `20261108b`: `drop constraint if exists catalog_services_pkey` + `add constraint catalog_services_pkey primary key (salon_id, id)` + `drop constraint if exists catalog_services_salon_id_id_key`.

- [ ] **Passo 1:** escrever `20261108_fase3_salao_proprio.sql` no padrão das migrações anteriores: pode rodar mais de uma vez, sem blocos `do $$`, termina com `notify pgrst, 'reload schema';` e bloco de verificação comentado (coluna existe; regra única existe).
- [ ] **Passo 2:** escrever `20261108b_catalogo_chave_por_salao.sql`. No cabeçalho: "rodar só depois que o código da fase 3 estiver no ar" (o código antigo usa `on_conflict=id`).
- [ ] **Passo 3:** escrever `salao_exemplo.sql` (com `on conflict do update`, pode rodar de novo):
  - `salons`: `('demo', 'demo', 'Studio Aurora', 'teste')`.
  - `salon_settings` linha `id = 'geral'`, `payload` = `CoworkingSettings` completo (nome "Studio Aurora", endereço "Rua das Flores, 100, Centro, Florianópolis - SC", WhatsApp `5548900000000`, Instagram `@studioaurora.exemplo`, política de cancelamento própria, `logoUrl: '/salao-exemplo/logo.svg'`, `heroBannerUrl: '/salao-exemplo/capa.svg'`) com `brand` (tipo da Tarefa 6): cores `{ text: '#1F2A44', primary: '#2F6F73', accent: '#E07A5F', background: '#F7FAF9', surface: '#E3EFEE' }`, textos próprios, `shortName: 'Aurora'`, `googleReviews: null`, `portfolioEnabled: false`.
  - `professionals`: as duas profissionais da decisão 1, `payload` no formato `Professional` (`avatarUrl` `/salao-exemplo/ana.svg` e `bia.svg`, horário de terça a sábado 9h–18h, `color` `#2F6F73` e `#E07A5F`).
  - `catalog_services`: 4 serviços, ids `srv_aurora_1` a `srv_aurora_4` (Corte Feminino 60 min R$ 90; Escova 45 min R$ 60; Manicure 40 min R$ 40; Esmaltação em Gel 60 min R$ 70), `professional_id` e `payload` no formato `Service`.
- [ ] **Passo 4:** `salao_exemplo_remover.sql`: apaga linhas com `salon_id = 'demo'` em todas as tabelas com `salon_id` e depois a linha de `salons`. Cabeçalho: "Apaga só o salão de exemplo. Pedir aprovação da dona antes de rodar."
- [ ] **Passo 5:** desenhar os 4 SVG (formas simples e o nome "Studio Aurora" no logo; nada da LEV).
- [ ] **Passo 6:** commit `feat(banco): agenda do google por profissional e salao de exemplo`.

## Tarefa 2: o site sabe de qual salão é cada dado

**Arquivos:**
- Modificar: `src/config/salon.ts`
- Criar: `src/data/salonDefaults.ts`, `src/data/levLegacy.ts`
- Modificar: `src/services/storage.ts`, `src/services/cloudServiceCatalog.ts`, `src/services/salonDataSync.ts`
- Testar: `src/config/salon.test.ts`, `src/data/salonDefaults.test.ts`, `src/services/cloudServiceCatalog.test.ts`

**Interfaces — Produz:**
- `CURRENT_SALON_ID: string` = `import.meta.env.VITE_SALON_ID` se passar no formato `^[a-z0-9-]{2,40}$`; senão `DEFAULT_SALON_ID` (`'lev'`). Valor inválido não derruba o site.
- `isDefaultSalon(): boolean` (`CURRENT_SALON_ID === DEFAULT_SALON_ID`).
- `scopedStorageKey(key: string, salonId?: string): string` — LEV: a própria `key`; outro salão: `` `${salonId}__${key}` ``.
- `bundledDataFor(salonId: string): { settings: CoworkingSettings; professionals: Professional[]; services: Service[] }` — LEV: `INITIAL_SETTINGS`, `INITIAL_PROFESSIONALS`, `INITIAL_SERVICES` sem os aposentados; outro salão: configurações neutras (`name: ''`, demais textos vazios, `depositPercentage: 30`) e listas vazias.
- `src/data/levLegacy.ts`: as constantes da LEV hoje em `storage.ts` (`LEV_OFFICIAL_AVATARS`, `LEV_OFFICIAL_PIX_KEYS`, usuários de exemplo, ids usados nas correções antigas de catálogo).

- [ ] **Passo 1: testes que falham**
  - `scopedStorageKey('lev_coworking_services_v1', 'lev')` → `'lev_coworking_services_v1'`; com `'demo'` → `'demo__lev_coworking_services_v1'`.
  - `bundledDataFor('demo')` → `professionals` e `services` vazios, `settings.name === ''`; `bundledDataFor('lev').professionals.length === 3`.
  - `CloudServiceCatalog.load()` com `CURRENT_SALON_ID = 'demo'` (mock de `../config/salon`) e nuvem devolvendo só `srv_aurora_1` → resultado só com `srv_aurora_1` (nenhum serviço da LEV).
  - `CloudServiceCatalog.upsert` chama `catalog_services?on_conflict=salon_id,id`.
- [ ] **Passo 2:** rodar `npx vitest run src/config src/data src/services/cloudServiceCatalog.test.ts` → FALHA.
- [ ] **Passo 3:** implementar. Em `storage.ts`, `salonDataSync.ts` e `cloudServiceCatalog.ts`: toda chave do `localStorage` passa por `scopedStorageKey`, todo `INITIAL_*` vira `bundledDataFor(CURRENT_SALON_ID)`, e as correções antigas (avatares, Pix, contatos, catálogos da Elisangela e da Talitha, `lev_talitha_additions_20260904`) só rodam quando `isDefaultSalon()`, lendo as constantes de `levLegacy.ts`. Upsert do catálogo com `on_conflict=salon_id,id` (a regra única da Tarefa 1 permite isso antes e depois da `20261108b`).
- [ ] **Passo 4:** rodar os testes da Tarefa 2 e a suíte toda → PASSA.
- [ ] **Passo 5:** commit `feat: dados de fabrica e memoria do aparelho separados por salao`.

## Tarefa 3: profissionais vêm dos dados (site)

**Arquivos:** modificar `src/services/professionalAuth.ts`, `src/components/auth/ProfessionalLoginPage.tsx`, `src/components/auth/RoleSwitcherModal.tsx`, `src/components/agenda/AgendaView.tsx`, `src/components/financial/FinancialManager.tsx`, `src/utils/formatters.ts`, `src/components/public/PortfolioPage.tsx`, `src/pages/PortfolioPage.tsx`; criar `src/data/levBrand.ts` (só a parte de profissionais nesta tarefa) e `src/utils/professionalColors.ts`. Testar: `src/utils/professionalColors.test.ts`, `src/utils/formatters.test.ts`.

**Interfaces — Produz:**
- `ProfessionalProfileId = string`.
- `src/data/levBrand.ts`: `LEV_AGENDA_COLORS: Record<string, string>` (os 3 hex de hoje do `AgendaView`), `LEV_PROFESSIONAL_WHATSAPP: Record<string, string>` (os números de hoje de `formatters.ts`), `LEV_OFFICIAL_WHATSAPP = '5541984979940'`, `LEV_PORTFOLIO` (fotos e trabalhos hoje em `PortfolioPage`), `LEV_BRIDAL_PROFESSIONAL_ID = 'prof_talitha'`.
- `agendaColorFor(professional: Professional, index: number): string` — LEV e id em `LEV_AGENDA_COLORS`: essa cor; senão `professional.color` se for hex `#rrggbb`; senão `FALLBACK_PALETTE[index % 6]`.
- `getProfessionalWhatsApp(id, contact)` mantém a assinatura: usa `contact.whatsapp`/`contact.phone` (ignorando o número geral do salão, `CoworkingSettings.whatsapp`); se vazio e `isDefaultSalon()`, `LEV_PROFESSIONAL_WHATSAPP[id]`; senão `''`.

- [ ] **Passo 1: testes que falham**
  - `agendaColorFor({ id: 'prof_elisangela', color: '#D4AF37' }, 0)` com salão `lev` → `'#d8c7a4'`.
  - `agendaColorFor({ id: 'prof_aurora_ana', color: '#2F6F73' }, 0)` → `'#2F6F73'`; com `color: 'gold'` e índice 7 → `FALLBACK_PALETTE[1]`.
  - `getProfessionalWhatsApp('prof_aurora_ana', {})` com salão `demo` → `''`; `getProfessionalWhatsApp('prof_nayara', {})` com salão `lev` → `'5541996556742'`.
- [ ] **Passo 2:** rodar → FALHA.
- [ ] **Passo 3:** implementar. `ProfessionalLoginPage` e `RoleSwitcherModal` montam a lista com `StorageService.getProfessionals()` (estado inicial = primeira da lista, ou vazio se não houver). `AgendaView` usa `agendaColorFor` com `style` no lugar das classes por id; `blockProfId` começa em `professionals[0]?.id ?? ''`. `FinancialManager`: `currentUser.professionalId || professionals[0]?.id || ''`. `PortfolioPage` (os dois arquivos) lê de `LEV_PORTFOLIO`; quando `!isDefaultSalon()`, a rota renderiza a página inicial e o link "Portfólio" some (`brand.portfolioEnabled`, Tarefa 6; até lá, `isDefaultSalon()`).
- [ ] **Passo 4:** `npm run test -- --run` e `npm run lint` → PASSA.
- [ ] **Passo 5:** commit `feat: profissionais do painel vem dos dados do salao`.

## Tarefa 4: o servidor lê o salão do banco (profissionais e Google Agenda)

**Arquivos:**
- Criar: `api/_lib/levDefaults.ts`, `api/_lib/salonDirectory.ts`, `api/_lib/salonDirectory.test.ts`
- Modificar: `api/_lib/bookingCatalog.ts`, `api/_lib/appointmentService.ts`, `api/_lib/googleCalendar.ts`, `api/_lib/whatsapp.ts`, `api/_lib/whatsappBooking.ts`, `api/_lib/whatsappProfessionalNotification.ts`, `api/appointments/create.ts`, `api/appointments/staff-list.ts`, `api/calendar/block.ts`, e os textos "equipe LEV" das rotas da equipe
- Ajustar: `api/_lib/bookingCatalog.test.ts`, `api/_lib/scheduleBlocks.test.ts` e demais testes que dependem das listas fixas

**Interfaces — Produz:**
- `levDefaults.ts`: `LEV_SALON = { name: 'LEV Coworking Beauty', shortName: 'LEV' }`; `LEV_PROFESSIONALS: Array<{ id; name; whatsapp; googleColorId; calendarEnv }>` (dados de hoje de `bookingCatalog.ts`, `whatsappProfessionalNotification.ts` e `googleCalendar.ts`); `LEV_BOOKING_SERVICES: BookingService[]` (lista de hoje de `bookingCatalog.ts`, sem mudar nada).
- `salonDirectory.ts`:
  - `type SalonProfessional = { id: string; name: string; whatsapp: string; googleColorId: string; googleCalendarId: string | null }`
  - `type SalonDirectory = { salonId: string; name: string; shortName: string; professionals: SalonProfessional[] }`
  - `loadSalonDirectory(salonId: string): Promise<SalonDirectory>` — lê `salons?id=eq.{id}&select=name`, `salon_settings?id=eq.geral&select=payload` (para `brand.shortName`) e `professionals?select=id,payload,google_calendar_id&salon_id=eq.{id}`. Se a leitura com `google_calendar_id` der 400 (migração não rodada), repete sem a coluna. Guarda em memória por 60 s por salão. Para a LEV, completa o que faltar (nome, telefone, cor, calendário pela variável `calendarEnv`) com `levDefaults`; se o banco falhar por inteiro, a LEV usa só `levDefaults`, e outro salão devolve lista vazia.
  - `findProfessional(dir: SalonDirectory, id: string): SalonProfessional | undefined`
  - `calendarIdFor(dir: SalonDirectory, professionalId: string): string | null` — `googleCalendarId` da profissional; senão, **só para a LEV**, `process.env.GOOGLE_CALENDAR_ID`; senão `null`.
- `bookingCatalog.ts`: `loadBookingServices(salonId: string): Promise<BookingService[]>` (lê `catalog_services` do salão sem os apagados; para a LEV, completa com `LEV_BOOKING_SERVICES` os ids que faltarem). `PROFESSIONALS`, `BOOKING_SERVICES` e `servicesFor` saem.
- `syncGoogleCalendarEvent(appointment, salonId: string)` — com `calendarIdFor` = `null`, não chama o Google e devolve `{ skipped: 'sem agenda do Google' }`. A descrição do evento passa a ter `🔗 Agendamento: {id}`; a busca aceita a forma nova e a antiga `Agendamento LEV: {id}`. "Atendimento LEV" e "Cancelado (LEV)" usam `dir.shortName`.

- [ ] **Passo 1: testes que falham** (`salonDirectory.test.ts`, com `fetch` simulado)
  - LEV com banco devolvendo as 3 profissionais e `google_calendar_id` preenchido → `calendarIdFor(dir, 'prof_talitha')` é o valor da coluna.
  - LEV com 400 na leitura com a coluna e sucesso sem ela, `GOOGLE_CALENDAR_ID_TALITHA=cal-t` → `'cal-t'`.
  - LEV com o banco fora do ar (500 em tudo) → 3 profissionais, `name === 'LEV Coworking Beauty'`, `shortName === 'LEV'`.
  - `demo` com profissional sem `google_calendar_id` e `GOOGLE_CALENDAR_ID=cal-lev` → `calendarIdFor` é `null`.
  - `demo` com banco fora do ar → `professionals` vazia (nunca as da LEV).
  - `create.ts`: público (salão `lev`) com `professionalId: 'prof_aurora_ana'` → 400 `'Profissional inválida.'`; com `'prof_talitha'` → segue.
  - `block.ts`: profissional fora do diretório do salão do login → `'Profissional inválida.'`.
- [ ] **Passo 2:** rodar `npx vitest run api/_lib/salonDirectory.test.ts` → FALHA.
- [ ] **Passo 3:** implementar. `create.ts` e `block.ts` trocam o `Set` fixo por `findProfessional`. `staff-list.ts` usa nomes do diretório e "Profissional"/"Atendimento"/"Agenda" como texto reserva. `whatsappProfessionalNotification.ts` usa `whatsapp` do diretório e `dir.shortName` em "Novo agendamento — {shortName}" e "painel da {shortName}"; recebe o `salonId`. `whatsappBooking.ts` monta os menus com o diretório e `loadBookingServices`, e "fluxo oficial da {shortName}". `appointmentService.ts` usa `LEV_BOOKING_SERVICES` como reserva só para a LEV. Apagar `professionalName` de `whatsapp.ts`. Mensagens 401: "Acesso restrito à equipe do salão.".
- [ ] **Passo 4:** `npm run test -- --run` e `npm run lint` → PASSA.
- [ ] **Passo 5:** commit `feat(api): profissionais e agenda do google lidos do salao`.

## Tarefa 5: mensagens do robô com o nome do salão

**Arquivos:** modificar `api/_lib/automatedMessages.ts`, `api/cron/send-reminders.ts`, `api/whatsapp/send.ts`, `api/_lib/whatsappValidator.ts`, `src/utils/followUps.ts`, `src/utils/formatters.ts` (`generateWhatsAppMessage`), `src/components/clients/ClientsManager.tsx`, `src/components/waitlist/WaitlistManager.tsx`; apagar `api/_lib/whatsappTemplates.ts`, `api/_lib/reminderScheduler.ts`, `api/_lib/whatsappService.ts`. Testar: `api/_lib/automatedMessages.test.ts`.

**Interfaces — Produz:**
- `MESSAGE_TEMPLATES: Record<'confirmation' | 'reminder1Day' | 'reminder1Hour' | 'thanks' | 'maintenance', string>` com `{cliente}`, `{salao}` (nome completo), `{salaoCurto}`, `{profissional}`, `{data}`, `{hora}`, `{servicos}`, `{rotuloServico}`, `{servico}`, `{dias}`.
- `renderMessage(template: string, vars: Record<string, string>): string` — troca todas as ocorrências; marcador sem valor vira texto vazio.
- `type SalonNames = { name: string; shortName: string }`; cada função de `messages` ganha o segundo parâmetro `salon: SalonNames` (ex.: `messages.confirmation(apt, salon)`).
- No site, as mensagens montadas no navegador usam `StorageService.getSettings()` (`name` e `brand.shortName`, Tarefa 6).

- [ ] **Passo 1: teste que falha (texto exato da LEV).** Antes de mexer, copiar para o teste a saída atual de cada uma das 5 mensagens para um atendimento fixo (cliente "Maria Souza", profissional "Talitha", 2026-11-20 às 14:00, serviço "Lash Lifting", manutenção de 21 dias). Novo teste: `messages.X(apt, { name: 'LEV Coworking Beauty', shortName: 'LEV' })` igual ao texto copiado, caractere por caractere. Segundo teste: com `{ name: 'Studio Aurora', shortName: 'Aurora' }`, nenhuma mensagem contém `LEV`.
- [ ] **Passo 2:** rodar → FALHA (assinatura nova).
- [ ] **Passo 3:** implementar. O cron já anda por salão: carrega `loadSalonDirectory(salonId)` uma vez por salão e passa `{ name, shortName }`. `send.ts`: "Teste do robô de WhatsApp do {nome do salão do login} ✅ ...". Apagar os 3 arquivos mortos.
- [ ] **Passo 4:** `npm run test -- --run` e `npm run lint` → PASSA.
- [ ] **Passo 5:** commit `feat: mensagens do robo com o nome de cada salao`.

## Tarefa 6: marca do salão na página pública

**Arquivos:**
- Modificar: `src/types/index.ts`, `src/data/levBrand.ts`, `src/data/salonDefaults.ts`
- Criar: `src/utils/salonBrand.ts`, `src/utils/salonBrand.test.ts`
- Modificar: `src/components/public/PublicLandingPage.tsx`, `src/components/booking/PublicBookingModal.tsx`, `src/components/public/ConfirmAppointmentPage.tsx`, `src/components/brand/Logo.tsx`, `src/components/common/SplashScreen.tsx`, `src/components/common/PWAInstallerModal.tsx`, `src/components/legal/LegalPage.tsx`, `src/components/auth/AuthModal.tsx`, `src/components/auth/AdminLoginPage.tsx`, `src/components/dashboard/DashboardOverview.tsx`, `src/App.tsx`

**Interfaces — Produz:**
```ts
export interface SalonBrand {
  shortName: string;
  colors: { text: string; primary: string; accent: string; background: string; surface: string };
  heroKicker: string; heroTitle: string; heroText: string;
  highlights: { title: string; desc: string }[];
  professionalsTitle: string; professionalsText: string;
  worksTitle: string; works: { url: string; alt: string }[];
  featureTitle: string; featureText: string; featureImageUrl: string;
  googleReviews: { rating: number; total: number; url: string; reviews: { author: string; text: string; rating: number; date?: string }[] } | null;
  portfolioEnabled: boolean;
  footerNote: string;
}
// CoworkingSettings ganha: brand?: SalonBrand
```
- `LEV_BRAND: SalonBrand` em `src/data/levBrand.ts`, com **os textos, fotos e cores exatamente como estão hoje** na página (inclusive as avaliações de `GOOGLE_REVIEWS*`, que passam para dentro dele). `NEUTRAL_BRAND` em `salonDefaults.ts`: textos genéricos sem nome de salão, sem fotos, `googleReviews: null`, `portfolioEnabled: false`.
- `resolveBrand(settings: CoworkingSettings, salonId: string): SalonBrand` — `settings.brand` por cima da marca de fábrica (`LEV_BRAND` para a LEV, `NEUTRAL_BRAND` para os outros), campo a campo, e `colors` cor a cor.
- `brandStyle(brand: SalonBrand): React.CSSProperties` — define `--brand-text`, `--brand-primary`, `--brand-accent`, `--brand-bg`, `--brand-surface`.
- Troca de cores nos componentes públicos (Tailwind 4): `#3D312A` → `(--brand-text)`, `#8C7249` e `#6B5440` → `(--brand-primary)`, `#A1865B` e `#B39A70` → `(--brand-accent)`, `#FCF9F2` → `(--brand-bg)`, `#F3EBDD` → `(--brand-surface)`; transparências como `text-(--brand-text)/80`.

- [ ] **Passo 1: testes que falham**
  - `resolveBrand(INITIAL_SETTINGS, 'lev')` igual a `LEV_BRAND`.
  - `resolveBrand({ ...neutro, brand: { colors: { primary: '#2F6F73' } } }, 'demo')` → `colors.primary === '#2F6F73'` e as outras 4 cores de `NEUTRAL_BRAND`.
  - `JSON.stringify(resolveBrand(neutro, 'demo'))` não contém `LEV`, `Elisangela`, `Talitha`, `Nayara`.
- [ ] **Passo 2:** rodar → FALHA.
- [ ] **Passo 3:** implementar. Nos componentes da lista: nome do salão de `settings.name`, nome curto de `brand.shortName`, logo de `settings.logoUrl`, textos e fotos de `resolveBrand`, cores pelas variáveis CSS aplicadas na raiz de cada página pública com `brandStyle`. O destaque "Especialistas ..." lista os nomes das profissionais carregadas. `document.title = settings.name` ao abrir. Seção de avaliações só aparece se `googleReviews` não for nulo; link do portfólio só se `portfolioEnabled`. O painel da equipe (tema escuro) não muda de cor nesta fase.
- [ ] **Passo 4:** `npm run test -- --run`, `npm run lint`, `npm run build` → PASSA.
- [ ] **Passo 5:** commit `feat: pagina publica com a marca de cada salao`.

## Tarefa 7: teste-guarda

**Arquivos:** criar `src/test/semLevNoCodigo.test.ts`.

- [ ] **Passo 1:** teste que percorre `src/` e `api/` (arquivos `.ts` e `.tsx`), pulando `src/data/**`, `api/_lib/levDefaults.ts` e arquivos `*.test.ts(x)`, e falha listando cada arquivo e linha que casar com `/prof_elisangela|prof_talitha|prof_nayara/` ou `/LEV Coworking/i`. Um segundo caso confere que o próprio teste enxerga arquivos (quantidade lida > 50), para não passar vazio.
- [ ] **Passo 2:** rodar `npx vitest run src/test/semLevNoCodigo.test.ts`. Se aparecer algum resto, corrigir no lugar certo (dados para `src/data/` ou `levDefaults.ts`; texto para `settings`/`brand`).
- [ ] **Passo 3:** rodar a suíte toda → PASSA. Commit `test: guarda contra a LEV fixa no codigo`.

## Tarefa 8: publicar e conferir

- [ ] **Passo 1:** `npm run test -- --run`, `npm run lint`, `npm run build`, `npm run e2e` (falhas antigas conhecidas da Fase 2 não contam; falha nova bloqueia).
- [ ] **Passo 2:** fotos "depois" da LEV, iguais às da Tarefa 0, em `docs/test-reports/fase3-depois/`. Comparar lado a lado; só a diferença mínima dos degradês (decisão 3) é aceita.
- [ ] **Passo 3:** juntar em `main` e publicar (deploy automático da Vercel). Conferir que o endereço da LEV abre com a página de sempre.
- [ ] **Passo 4 (dona do projeto, no SQL Editor do Supabase):** rodar `20261108_fase3_salao_proprio.sql` e o bloco de verificação.
- [ ] **Passo 5:** preencher `professionals.google_calendar_id` das 3 profissionais da LEV com os valores atuais das variáveis `GOOGLE_CALENDAR_ID_ELISANGELA`, `_TALITHA`, `_NAYARA` (lidos com `vercel env pull` para a pasta temporária; o arquivo não vai para o git). Criar um agendamento de teste para cada uma pelo painel e conferir que cai na agenda certa do Google; depois cancelar.
- [ ] **Passo 6:** rodar `supabase/seeds/salao_exemplo.sql`. Abrir com `VITE_SALON_ID=demo npm run dev` e conferir no celular e no computador: nome, logo, capa, cores, textos, as duas profissionais e os 4 preços do Studio Aurora. Rodar no console `document.body.innerText.match(/LEV|Elisangela|Talitha|Nayara/g)` → `null`. Abrir o modal de agendamento e conferir que lista só Ana e Bia. Fotos em `docs/test-reports/fase3-salao-exemplo/`.
- [ ] **Passo 7:** rodar `20261108b_catalogo_chave_por_salao.sql`. Pela conta da admin da LEV, editar o preço de um serviço e voltar ao valor original; conferir que gravou (o envio com `on_conflict=salon_id,id` funciona com a chave nova).
- [ ] **Passo 8:** atualizar a Fase 3 em `docs/superpowers/plans/2026-11-03-lev-multi-salao.md` ("concluída e no ar", com o que foi conferido) e marcar as caixinhas deste plano. Commit `docs: fase 3 concluida e conferida`.

**Aceite:** com o Studio Aurora cadastrado, a página dele mostra os próprios nomes, fotos, preços e cores, sem nenhum vestígio da LEV; e a página e as mensagens da LEV continuam iguais.
