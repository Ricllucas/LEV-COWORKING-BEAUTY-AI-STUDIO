# Análise do Bela360 para adaptação ao LEV

Análise de código realizada em 17/10/2026. Repositório: https://github.com/inematds/bela360
Commit examinado: e6a7cffe52edc0f9650c799b7acae0090ad59216.
Cópia baixada: C:\Users\ricll\Documents\Codex\2026-10-10\loc\work\bela360
Comparação: código do LEV preparado na publicação do commit 99e0ab5, de 10/10/2026. Esta análise não confirma alterações posteriores no LEV.

## Parecer

O Bela360 é uma boa referência de funcionalidades para evoluir o LEV, mas não deve substituir a aplicação existente. Compartilha React e TypeScript, porém usa Next.js 14/React 18 no frontend e Express, Prisma, PostgreSQL, Redis e BullMQ no backend. O LEV usa Vite/React 19, Supabase e funções na Vercel. Telas e regras precisam ser adaptadas a esses contratos.

Aproveitar principalmente modelos de dados, organização das telas e regras de negócio. Preservar o visual do LEV, a separação por profissional/MEI e o contato direto pelo WhatsApp da responsável. Nenhuma mudança foi aplicada ao LEV nesta análise.

## O que vale adaptar

| Recurso | Referência Bela360 | Situação no LEV e adaptação indicada | Prioridade |
| --- | --- | --- | --- |
| CRM e segmentação | clients.service.ts; marketing.service.ts | LEV já cadastra clientes. Acrescentar última visita concluída, frequência, gasto acumulado, profissional preferida e filtros de clientes sem retorno. Calcular por profissional e evitar duplicar clientes. | Alta |
| Relatórios de gestão | analytics.service.ts | LEV já tem faturamento, ticket médio e relatório mensal. Ampliar com comparação entre períodos, faltas, retorno, serviços mais procurados e ocupação real. Separar valor de atendimento de dinheiro efetivamente recebido. | Alta |
| Exportação padronizada | apps/web/src/lib/export.ts; ExportButton.tsx | LEV já exporta CSV e imprime relatório. Criar exportação consistente em CSV, Excel e PDF com filtros aplicados e identificação da profissional/MEI. | Alta |
| Caixa e conciliação | finance.service.ts; finance.routes.ts | Evoluir os pagamentos já registrados no LEV: sinal, saldo restante, estornos, totais por forma de pagamento e fechamento por profissional. Comissões apenas se fizerem parte do modelo comercial da LEV. | Alta/média |
| Lista de espera | waitlist.service.ts; waitlist.worker.ts | LEV já possui lista e contato manual. Acrescentar compatibilidade entre vaga, duração do serviço, profissional e preferência de período. Mostrar sugestões à equipe, sem disparo automático. | Média |
| Estoque e consumo por serviço | modules/inventory/index.ts; modelos Product, StockMovement, ServiceProduct | Acrescentar produtos, entradas/saídas, estoque mínimo, validade e consumo previsto por procedimento. Distinguir materiais da LEV dos materiais de cada profissional. | Média |
| Fidelidade | modules/loyalty/index.ts; modelos Loyalty* | LEV já tem um tipo LoyaltyCard. Implementar primeiro cartão simples por profissional, com histórico e resgate único. Pontos, categorias e cashback podem vir depois. | Média/baixa |
| Perfil profissional e metas | modules/professional/index.ts; modelos ProfessionalProfile e ProfessionalGoal | Ampliar perfis com portfólio, link individual compartilhável e metas privadas de atendimentos/receita. Ranking público entre profissionais tem pouco valor inicial para o coworking. | Média/baixa |
| Sugestões de marketing | suggestions.service.ts; templates.service.ts | Identificar horários vagos, serviços com baixa procura e clientes que podem retornar. Produzir sugestões e mensagens prontas para a profissional revisar e enviar manualmente. | Média |

## Limitações encontradas no código

1. Há telas com dados simulados e operações apenas em memória. Exemplos: fidelidade, marketing, lista de espera, automação, agenda profissional e painel profissional. WhatsApp e notificações também usam coleções mockadas. Ter a tela não comprova integração funcional com o backend.
2. Contrato de autenticação inconsistente: auth.middleware.ts preenche req.business, mas estoque/fidelidade leem req.businessId e o financeiro lê req.user. No fluxo de montagem de rotas examinado não encontrei a atribuição desses outros campos. É necessário corrigir e testar a identidade e o escopo antes de reaproveitar essas rotas.
3. O frontend financeiro chama /finance/summary, /finance/by-method e /finance/commissions, mas finance.routes.ts não registra esses caminhos correspondentes. A integração precisa ser concluída ou remapeada.
4. Algumas consultas de estoque e fidelidade buscam registros somente por ID, sem filtro explícito da empresa. Adaptar a autorização por profissional/MEI e garantir o isolamento no servidor e no banco.
5. O painel calcula parte da receita pelo preço atual do serviço em atendimentos concluídos. Para o LEV, usar valores preservados no atendimento e pagamentos registrados, sem alterar históricos quando o catálogo mudar.
6. A detecção de ociosidade do Bela360 parte de horários gerais do negócio. No LEV deve respeitar jornada individual, almoço, férias, bloqueios, intervalos e duração dos serviços.
7. Não encontrei testes de aplicação versionados nos caminhos examinados, apesar dos scripts de teste. O endpoint de saúde informa banco e Redis como conectados sem verificar a conexão, conforme comentários TODO.
8. O README declara MIT e aponta para LICENSE, mas não há arquivo LICENSE no commit examinado. Antes de incorporar trechos literais, esclarecer a licença e os avisos aplicáveis. É possível planejar uma implementação própria das funcionalidades analisadas.
9. README.md e readme.md coexistem no Git. No Windows há colisão de nomes; li também o README.md diretamente do objeto Git para examinar a documentação correta.

## O que deixar de fora

- Bot e automações centrais do WhatsApp: contrariam a decisão de atendimento direto da LEV. O Bela360 usa Evolution API e mantém filas/processos próprios; não resolve por si a dificuldade anterior da LEV.
- Migração integral para Next.js, Prisma, Redis, BullMQ e Docker: aumentaria a mudança de infraestrutura sem necessidade para os recursos prioritários.
- Login dependente de mensagem WhatsApp: manter a autenticação do LEV e revisar permissões nas APIs atuais.
- Campanhas com disparo em massa, rankings públicos e cashback como primeira entrega.

## Sequência recomendada

1. CRM e retorno: indicadores derivados dos atendimentos concluídos; filtros por profissional, última visita e período sem retorno; botão de contato manual com mensagem preparada. Critério de aceite: nenhum envio automático e nenhum acesso indevido a dados de outra profissional.
2. Relatórios e exportação: períodos comparáveis, faltas, serviços e ocupação; CSV/Excel/PDF consistentes com os mesmos dados e filtros do painel. Manter distinção entre produção, descontos, sinais e recebimentos.
3. Caixa: consolidar pagamentos e fechamento diário por MEI, com trilha de alterações e estornos, sem substituir os controles atuais de uma vez.
4. Lista de espera e estoque: sugestão de encaixes com disponibilidade real; estoque por proprietário e movimentações auditáveis.
5. Fidelidade e metas: iniciar com regras simples por profissional e registrar concessões/resgates de forma que repetições não gerem benefícios duplicados.

A primeira entrega de maior utilidade é CRM de retorno + relatórios melhores, aproveitando os dados que a LEV já registra. Estoque é a principal expansão de módulo novo.

## Escopo da verificação

Inspeção estática do código, rotas, modelos e telas; não instalei dependências nem executei o Bela360 com banco, Redis ou WhatsApp. Os achados de integração são baseados nos arquivos examinados e não representam uma auditoria completa de segurança ou funcionamento em produção.
