# Fase 2: dados do painel na nuvem (plano de implementação)

> **Para quem vai executar (agente ou programador):** use superpowers:subagent-driven-development ou superpowers:executing-plans, tarefa por tarefa. Os passos usam caixinhas (`- [ ]`) para marcar o andamento.

**Objetivo:** financeiro, configurações, profissionais, bloqueios de horário, lista de espera e histórico deixam de ficar só no aparelho. Passam a ficar no Supabase, separados por salão (`salon_id`). Um lançamento feito no celular aparece no computador.

**Arquitetura:** o navegador fala direto com o Supabase usando o login da profissional ou da admin, e as regras de acesso (RLS) do banco garantem que cada pessoa só lê e grava o que pode, dentro do próprio salão. É o mesmo padrão que o catálogo de serviços já usa (`src/services/cloudServiceCatalog.ts`). **Nenhuma rota nova na Vercel**: o plano Hobby permite só 12 e o projeto já usa as 12. O `localStorage` continua como cópia para abrir rápido e como fila de envio quando a internet falha.

**Tecnologia:** React 19 + TypeScript + Vite, Supabase (Postgres + PostgREST + RLS), Vitest.

**Especificação:** `docs/superpowers/plans/2026-11-03-lev-multi-salao.md`, seção "Fase 2".

## Regras gerais

- A LEV não pode sair do ar. O código novo precisa funcionar **antes** da migração ser rodada: se as tabelas novas ainda não existirem (erro 404/400 do PostgREST), o sistema continua usando só o aparelho, sem mostrar erro para a usuária.
- `salon_id` vem de `CURRENT_SALON_ID` (`src/config/salon.ts`) no navegador. A RLS confere no banco que ele é o salão de quem está logada. O navegador não consegue gravar em outro salão.
- Migração SQL: pode rodar duas vezes sem erro, sem blocos `do $$`, com `grant` explícito para `service_role`, `authenticated` e `anon` onde precisa (neste projeto tabela nova não recebe permissão automática), e terminando com `notify pgrst, 'reload schema';`.
- Sem `any`. Antes de cada commit: `npm run lint`, `npm run test`, `npm run build`.
- Dados pessoais sensíveis da profissional (`meiName`, `cnpjCpf`, `bankName`, `email`) **nunca** ficam numa tabela que o público consegue ler.

## Pontos de atenção na revisão

1. **Cópia velha apagando dado novo.** Hoje `CoworkingContext` regrava todas as profissionais no `StorageService` a cada mudança. Se esse caminho enviasse para a nuvem, um aparelho com dados antigos sobrescreveria a nuvem ao abrir. → Envio para a nuvem só acontece em ação explícita da usuária (Tarefa 4). Teste: `getProfessionals`/`saveProfessional` não chamam a nuvem.
2. **Pagamento lançado duas vezes** na primeira sincronização (o mesmo lançamento enviado por dois caminhos). → Envio usa `on_conflict` pela chave `(salon_id, id)`. Teste na Tarefa 3.
3. **Internet caiu na hora de lançar o pagamento.** → Vai para a fila de envio e é reenviado na próxima sincronização. Teste na Tarefa 3.
4. **Bloqueio de horário que a cliente não enxerga.** Hoje o bloqueio feito no painel só existe no aparelho da profissional, e o site público calcula horários livres com os bloqueios do aparelho da cliente (vazio). → Tarefa 5: a rota pública de disponibilidade devolve os bloqueios, e o servidor recusa agendamento em cima de bloqueio.
5. **Profissional lendo o financeiro de outra.** → Regra no banco (Tarefa 1) + verificação SQL com dois usuários.

---

## Tarefa 1: migração do banco

**Arquivos:** criar `supabase/migrations/20261105_salon_data.sql`

**Produz:**
- Funções (`security definer`, `stable`, `set search_path = public`):
  - `public.staff_salon_id() returns text`: salão de `admin_users` do `auth.uid()`; se não houver, de `professional_access` com `status = 'approved'`; senão `null`.
  - `public.is_salon_admin(target text) returns boolean`: existe linha em `admin_users` com `user_id = auth.uid()` e `salon_id = target`.
  - `public.staff_professional_id() returns text`: `professional_id` de `professional_access` aprovada do `auth.uid()`.
  - `grant execute` nas três para `anon, authenticated`.
- Sete tabelas com o **mesmo formato**: `salon_id text not null references salons(id)`, `id text not null`, `professional_id text` (pode ser nulo), `payload jsonb not null`, `updated_at timestamptz not null default now()`, `primary key (salon_id, id)`, índice em `(salon_id, professional_id)`:
  `salon_settings`, `professionals`, `professional_private`, `payments`, `schedule_blocks`, `waitlist`, `audit_logs`.
- Regras (RLS ligada em todas):

| Tabela | Ler | Gravar (insert/update) | Apagar |
|---|---|---|---|
| `salon_settings` | todos (`anon`, `authenticated`) | `is_salon_admin(salon_id)` | ninguém |
| `professionals` | todos | admin do salão, ou a própria profissional (`professional_id = staff_professional_id()` e `salon_id = staff_salon_id()`) | ninguém |
| `professional_private` | admin do salão, ou a própria | igual à leitura | ninguém |
| `payments` | admin do salão, ou a profissional dona do lançamento | igual à leitura | ninguém |
| `schedule_blocks` | equipe do salão (`salon_id = staff_salon_id()`) | admin do salão, ou a profissional dona | igual à gravação |
| `waitlist` | equipe do salão | equipe do salão | ninguém |
| `audit_logs` | admin do salão | equipe do salão (só insert) | ninguém |

- `grant` mínimo correspondente (`select` para `anon` só em `salon_settings` e `professionals`; `select, insert, update` para `authenticated`; `delete` só em `schedule_blocks`; tudo para `service_role`).
- Endurecer o catálogo: recriar `catalog_staff_insert` e `catalog_staff_update` exigindo também `catalog_services.salon_id = staff_salon_id()`.

- [ ] **Passo 1:** escrever a migração, com bloco de verificação comentado no fim (lista das 7 tabelas com `relrowsecurity = true`; contagem de policies por tabela).
- [ ] **Passo 2:** commit `feat(banco): tabelas do painel na nuvem por salao`. **A dona do projeto roda a migração no SQL Editor do Supabase**, depois da publicação do código (Tarefa 7). O código funciona com ou sem ela.

## Tarefa 2: cliente da nuvem para os dados do salão

**Arquivos:** criar `src/services/staffSession.ts`, `src/services/cloudSalonData.ts`, `src/services/cloudSalonData.test.ts`; modificar `src/services/cloudAppointments.ts` (passa a importar `getFreshAccessToken` de `staffSession.ts`, sem mudar comportamento); modificar `api/_lib/tenantGuard.test.ts` (as 7 tabelas novas entram na lista vigiada).

**Produz:**
- `staffSession.ts`: `export const getFreshAccessToken(role?: User['role']): Promise<string | undefined>` (movida, igual à atual).
- `cloudSalonData.ts`:
  - `export type SalonTable = 'salon_settings' | 'professionals' | 'professional_private' | 'payments' | 'schedule_blocks' | 'waitlist' | 'audit_logs'`
  - `export type SalonRow<T> = { id: string; professionalId?: string; payload: T }`
  - `export class CloudTableMissingError extends Error` (tabela ainda não criada: status 404, ou 400 com código `PGRST205`/`42P01`)
  - `export const CloudSalonData = { isConfigured(): boolean; list<T>(table: SalonTable, role?: User['role']): Promise<SalonRow<T>[]>; upsert<T>(table: SalonTable, rows: SalonRow<T>[], role: User['role']): Promise<void>; remove(table: SalonTable, id: string, role: User['role']): Promise<void> }`
  - `list` sem `role` lê com a chave pública (só serve para `salon_settings` e `professionals`); com `role` usa o token da sessão.
  - `upsert` faz `POST rest/v1/<tabela>?on_conflict=salon_id,id` com `Prefer: resolution=merge-duplicates,return=minimal`, cada linha passada por `withSalon(...)`.

- [ ] **Passo 1: testes que falham** (`fetch` simulado):
  - `list('payments', 'admin')` chama URL com `rest/v1/payments?`, `salon_id=eq.lev` e `Authorization: Bearer <token da sessão>`
  - `list('professionals')` usa a chave pública como token
  - `upsert('payments', [{ id: 'pay_1', professionalId: 'prof_x', payload: {...} }], 'admin')` envia corpo `[{ id: 'pay_1', professional_id: 'prof_x', payload: {...}, salon_id: 'lev', updated_at: <string> }]` e URL com `on_conflict=salon_id,id`
  - resposta 404 em qualquer método → lança `CloudTableMissingError`
  - resposta 500 → lança `Error` comum (não `CloudTableMissingError`)
  - `upsert` com sessão expirada (sem token) → lança erro "Sua sessão expirou..."
- [ ] **Passo 2:** `npx vitest run src/services/cloudSalonData.test.ts` → FALHA
- [ ] **Passo 3:** implementar
- [ ] **Passo 4:** rodar de novo → PASSA; `npx vitest run api/_lib/tenantGuard.test.ts` → PASSA
- [ ] **Passo 5:** commit `feat: cliente da nuvem para os dados do salao`

## Tarefa 3: sincronização (puxar, enviar, fila e primeira subida)

**Arquivos:** criar `src/services/salonDataSync.ts`, `src/services/salonDataSync.test.ts`; criar `src/services/professionalSplit.ts` + teste.

**Consome:** `CloudSalonData`, `CloudTableMissingError` (Tarefa 2).

**Produz:**
- `professionalSplit.ts`:
  - `export const PRIVATE_PROFESSIONAL_FIELDS = ['meiName', 'cnpjCpf', 'bankName', 'email'] as const`
  - `export function splitProfessional(p: Professional): { publicPart: Omit<Professional, typeof PRIVATE_PROFESSIONAL_FIELDS[number]>; privatePart: Pick<Professional, ...> }`
  - `export function joinProfessional(publicPart, privatePart?): Professional` (campos privados ausentes viram `''`)
- `salonDataSync.ts`:
  - `export type SyncKind = 'settings' | 'professionals' | 'payments' | 'blocks' | 'waitlist' | 'logs'`
  - `export const SalonDataSync = { pull(role?: User['role']): Promise<void>; push(kind: SyncKind, item: unknown, role: User['role']): Promise<void>; removeBlock(id: string, role: User['role']): Promise<void> }`
  - Chaves novas no `localStorage`: `lev_cloud_outbox_v1` (fila) e `lev_cloud_seeded_<kind>_v1` (primeira subida feita neste aparelho).

Comportamento:
- `push`: grava na nuvem. Se falhar por rede ou erro do servidor, coloca na fila (`{ kind, op: 'upsert' | 'delete', item, role }`). Se for `CloudTableMissingError`, não faz nada (banco ainda sem migração).
- `pull(role)`:
  1. Reenvia a fila; o que der certo sai da fila.
  2. Lê da nuvem: sempre `settings` e `professionals` (+ `professional_private` se `role` for de equipe); se for equipe, também `payments`, `blocks`, `waitlist`; se for admin, `logs`.
  3. **Primeira subida** de cada tipo neste aparelho (sem a chave `seeded`): envia os itens locais cujo `id` não está na nuvem e marca `seeded`. Profissional só envia o que a regra permite (os próprios pagamentos e bloqueios); o que a nuvem recusar com 401/403 é descartado da subida, sem ir para a fila.
  4. Grava no `localStorage` a lista da nuvem **mais** o que ainda está na fila. A nuvem é a fonte oficial; itens que só existiam no aparelho depois da primeira subida somem.
  5. Se a nuvem respondeu `CloudTableMissingError`, não mexe no aparelho.
  6. Settings: se a nuvem não tem linha e quem está logada é admin, sobe a configuração do aparelho (`id = 'geral'`).

- [ ] **Passo 1: testes que falham** (com `CloudSalonData` simulado e `localStorage` em memória):
  - `splitProfessional` tira `cnpjCpf` da parte pública; `joinProfessional(split...)` devolve o original
  - `push('payments', pagamento, 'admin')` com nuvem fora do ar → item aparece em `lev_cloud_outbox_v1`
  - `pull('admin')` com fila de 1 pagamento e nuvem no ar → `upsert` chamado com ele e a fila fica vazia
  - `pull('admin')` com 2 pagamentos locais (`pay_a`, `pay_b`), nuvem com `pay_b` e `pay_c`, sem `seeded` → sobe só `pay_a`; aparelho termina com `pay_a`, `pay_b`, `pay_c`
  - mesmo cenário, já `seeded` e sem fila → aparelho termina com `pay_b`, `pay_c`
  - `pull()` sem login → não chama `list` para `payments`, `blocks`, `waitlist`, `logs`
  - `list` lançando `CloudTableMissingError` → `localStorage` igual ao de antes
  - profissional: subida recusada com 403 → não entra na fila
- [ ] **Passo 2:** rodar → FALHA
- [ ] **Passo 3:** implementar
- [ ] **Passo 4:** rodar → PASSA
- [ ] **Passo 5:** commit `feat: sincronizacao dos dados do salao com a nuvem`

## Tarefa 4: ligar o StorageService e as telas

**Arquivos:** modificar `src/services/storage.ts`, `src/App.tsx`, `src/components/professionals/ProfessionalsManager.tsx:102`, `src/components/settings/SettingsManager.tsx:125,143`, `src/components/public/PublicLandingPage.tsx:55`, `src/components/agenda/AgendaView.tsx` (`handleRecordPayment`, `handleSaveBlock`), `src/components/waitlist/WaitlistManager.tsx`; teste `src/services/storageCloud.test.ts`.

**Consome:** `SalonDataSync` (Tarefa 3).

**Produz / regras:**
- `savePaymentRecord`, `saveScheduleBlock`, `saveWaitlistEntry`, `addAuditLog`, `saveSettings`: depois de gravar no aparelho, chamam `SalonDataSync.push(...)` com o papel da usuária atual (`getCurrentUser().role`), sem esperar (`void`). Se a usuária não é da equipe (`cliente`), não envia.
- `deleteScheduleBlock`: chama `SalonDataSync.removeBlock`.
- **Novo** `static publishProfessional(prof: Professional): void` = `saveProfessional(prof)` + `push('professionals', ...)`. As três telas que editam profissional passam a chamar `publishProfessional`. `saveProfessional` e `getProfessionals` **não** enviam para a nuvem.
- `App.tsx`: chama `SalonDataSync.pull(role)` ao abrir, quando o login muda (`currentUser.id`/`role`), quando a janela volta a ter foco e a cada 60 s enquanto há equipe logada. Nas páginas públicas, `pull()` sem papel (só settings e profissionais).
- Pagamento na agenda: depois de `savePaymentRecord`, `handleRecordPayment` chama `CloudAppointmentService.updateDetails(id, { depositPaid, remainingPrice, paymentStatus, paymentMethod, paymentDate }, currentUser)` para o status de pagamento do atendimento também ir para a nuvem. O servidor precisa aceitar esses campos: em `api/calendar/appointment.ts`, incluir `depositPaid` (número ≥ 0), `paymentStatus` (um dos valores de `PaymentStatus`), `paymentMethod` (um dos valores de `PaymentMethod`) e `paymentDate` (texto até 20 caracteres), com teste no arquivo de teste existente da rota.
- `handleSaveBlock`: o `id` passa a ser `"blk_" + Date.now() + "_" + 4 caracteres aleatórios`.

- [ ] **Passo 1: testes que falham** em `storageCloud.test.ts` (com `SalonDataSync` simulado):
  - admin logada: `savePaymentRecord(p)` → `push('payments', p, 'admin')`
  - cliente logada: `savePaymentRecord(p)` → `push` não chamado
  - `saveProfessional(p)` → `push` não chamado; `publishProfessional(p)` → `push('professionals', p, papel)`
  - `deleteScheduleBlock('blk_1')` com admin → `removeBlock('blk_1', 'admin')`
  - teste da rota: `updateDetails` com `paymentStatus: 'pago'` grava; com `paymentStatus: 'qualquer'` → 400
- [ ] **Passo 2:** rodar → FALHA
- [ ] **Passo 3:** implementar
- [ ] **Passo 4:** `npm run test` → tudo passa
- [ ] **Passo 5:** commit `feat: painel grava financeiro, bloqueios, lista de espera e configuracoes na nuvem`

## Tarefa 5: bloqueios valem para o site público

**Arquivos:** modificar `api/_lib/appointmentService.ts`, `api/appointments/availability.ts`, `src/services/cloudAppointments.ts` (`listPublicByDate`), `src/components/booking/PublicBookingModal.tsx:160`; testes nos arquivos de teste existentes dessas rotas.

**Produz:**
- `export const listBlocksByDate = async (salonId: string, date: string): Promise<Array<{ professionalId: string; date: string; startTime: string; endTime: string }>>` em `appointmentService.ts` (lê `schedule_blocks` com a chave de serviço; filtra `payload->>date`; devolve **só** esses quatro campos, nunca o título). Tabela ausente → lista vazia.
- A verificação de conflito ao criar agendamento também recusa (409, mensagem "Este horário está bloqueado pela profissional. Escolha outro horário.") quando o horário cruza um bloqueio **da mesma profissional**.
- `availability` responde `{ appointments, blocks }`.
- `CloudAppointmentService.listPublicBlocksByDate(date)` (ou `listPublicByDate` devolvendo os dois; escolha de quem implementa, desde que o modal receba os bloqueios). O modal usa os bloqueios da resposta no lugar de `StorageService.getScheduleBlocks()`.

- [ ] **Passo 1: testes que falham:** criar agendamento às 10:00 para `prof_talitha` com bloqueio dela 09:30–11:00 → 409; mesmo horário com bloqueio de `prof_nayara` → aceito; `availability` devolve `blocks` sem o campo `title`.
- [ ] **Passo 2:** rodar → FALHA
- [ ] **Passo 3:** implementar
- [ ] **Passo 4:** rodar → PASSA; `npm run test`, `npm run lint`, `npm run build`
- [ ] **Passo 5:** commit `feat: bloqueios de horario valem para o agendamento pelo site`

## Tarefa 6: atualizar a documentação

- [ ] No plano geral (`2026-11-03-lev-multi-salao.md`), marcar a Fase 2 como em andamento e apontar para este arquivo. Registrar que `catalog_services` ainda tem ids repetíveis entre salões (fica para a Fase 3, junto com a troca dos ids fixos de profissionais).
- [ ] Commit `docs: fase 2 do plano multi-salao`

## Tarefa 7: publicar e conferir

- [ ] **Passo 1:** `npm run test`, `npm run lint`, `npm run build`, `npm run e2e`.
- [ ] **Passo 2:** `git push origin main`. Conferir no site no ar que tudo continua igual (o banco ainda não tem as tabelas novas).
- [ ] **Passo 3:** a dona roda `20261105_salon_data.sql` no SQL Editor e a verificação do fim do arquivo.
- [ ] **Passo 4 (com a dona):** abrir o painel uma vez em cada aparelho que já usou o financeiro (Elisangela, Talitha, Nayara, computador da admin), logada. Anotar antes o total do mês na tela Financeiro de cada aparelho.
- [ ] **Passo 5:** conferir: lançar um pagamento de teste no celular → aparece no computador em até 1 minuto. Bloquear um horário no painel → o site público não oferece esse horário. Depois apagar o bloqueio de teste (o pagamento de teste não pode ser apagado pelo painel; usar valor R$ 0,01 e avisar a dona).
- [ ] **Passo 6:** conferir no Supabase, com uma profissional logada, que ela não lê pagamentos de outra (consulta pelo navegador devolve lista vazia para `professional_id` de outra).
