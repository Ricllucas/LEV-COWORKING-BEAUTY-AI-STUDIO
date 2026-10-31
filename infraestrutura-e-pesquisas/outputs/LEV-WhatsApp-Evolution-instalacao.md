# Evolution API por profissional — instalação LEV

A integração usa WHATSAPP-BAILEYS com três instâncias independentes: lev-elisangela, lev-talitha e lev-nayara. A aplicação LEV continua na Vercel. O serviço Evolution precisa permanecer ativo em um servidor separado, com PostgreSQL e Redis persistentes. Não foi contratado nem instalado um servidor nesta alteração.

## O que foi implementado

- Pareamento por QR Code, consulta de conexão, verificação do número conectado, ativação, pausa e desconexão.
- Profissional só pode gerenciar sua própria instância; administração pode gerenciar as três. A chave Evolution nunca vai ao navegador.
- Solicitação de reserva, confirmação, cancelamento e mudança de data/horário entram em fila durável no Supabase. Um trigger registra os eventos na mesma transação da agenda.
- Lembretes na janela de 20–26 horas e de 50–70 minutos antes do atendimento.
- Fila com chave única e reivindicação atômica; envio ambíguo fica para revisão, sem repetição automática.
- Histórico resume aceitação pelo provedor, não comprova entrega nem leitura no celular.
- Respostas chegam normalmente ao WhatsApp de cada profissional. Esta etapa NÃO implementa chatbot para marcar, cancelar ou reagendar por mensagens recebidas. A profissional continua registrando essas mudanças na agenda.

## Instalação

1. Disponibilizar um servidor Linux com Docker/Compose, domínio apontado e HTTPS. O repositório inclui infrastructure/evolution/compose.yaml e Caddyfile. Não há custos provisionados automaticamente.
2. Copiar .env.example da pasta de infraestrutura para .env no servidor. Definir domínio, chave forte, senha do PostgreSQL e imagem Evolution API v2 com tag/digest estável validado. Nenhuma versão é instalada implicitamente.
3. No servidor: `docker compose --env-file .env -f compose.yaml up -d`. As portas do banco e Redis não são expostas à internet. Manter backups dos volumes e proteger acesso ao servidor.
4. No SQL Editor do Supabase, executar supabase/migrations/20261017_evolution_automation.sql. As tabelas e funções só permitem acesso server-side com service_role. Migração instalada em 17/10/2026 no projeto LEV Coworking Beauty (zdiouifmvaiqpnuylcen), com as três conexões pausadas.
5. Na Vercel, configurar EVOLUTION_API_URL (HTTPS) e EVOLUTION_API_KEY como segredos apenas de servidor. Manter SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e CRON_SECRET. Nunca usar prefixo VITE_ nessas credenciais. Opcionalmente configurar EVOLUTION_PHONE_ELISANGELA, EVOLUTION_PHONE_TALITHA e EVOLUTION_PHONE_NAYARA para números diferentes do cadastro padrão.
6. Configurar o agendador Supabase conforme supabase/migrations/20260930_reminders_cron.sql, se ainda não existir. A fila só envia quando /api/cron/send-reminders é chamado com Bearer CRON_SECRET. O padrão atual é a cada 5 minutos; para menor atraso, mudar para cada minuto. A execução processa até dois envios por chamada; monitorar acúmulo e dimensionar conforme o volume.
7. Publicar o código. Entrar na área WhatsApp com conta aprovada de cada profissional, gerar QR, ler pelo WhatsApp em Aparelhos conectados, atualizar e ativar os envios. O número conectado precisa corresponder ao esperado.
8. Validar uma reserva controlada com destinatário de teste autorizado, confirmação, cancelamento e ambos os lembretes. Conferir pausa, desconexão e isolamento entre profissionais. Só então ativar as demais instâncias.

## Operação e limites

As conexões começam pausadas. Se servidor, migração ou número não estiver pronto, a interface informa instalação pendente ou falha, sem indicar conexão fictícia. Uma reserva pendente não recebe texto de confirmação definitiva. O botão manual continua disponível, mas a reserva não redireciona mais automaticamente para o WhatsApp.

Jobs com estado failed ou uncertain não são reenviados automaticamente. Revisar o WhatsApp e o log antes de qualquer repetição; em caso de timeout, a mensagem pode ter sido aceita mesmo sem resposta da API. O trigger ajuda a não perder a notificação no momento da gravação. O worker reconsulta data, horário, status e profissional antes do envio e descarta trabalhos obsoletos. Alterações após essa consulta ainda exigem atenção, pois não há transação distribuída entre Supabase e WhatsApp.

Não há webhook de mensagens recebidas ativo. As rotas antigas de envio pela Meta continuam desativadas. A integração usa código próprio baseado nos contratos públicos da Evolution, sem copiar módulos do Bela360.

## Verificação local

Testes automatizados usam respostas simuladas, sem conectar aparelhos ou enviar mensagens. A migração foi aplicada no PostgreSQL real da LEV. Testes transacionais confirmaram o trigger, a deduplicação, a reivindicação de jobs e as permissões; os dados de teste foram descartados. Os advisors não apresentaram novos avisos de segurança. A instalação Docker e a conexão dos aparelhos ainda aguardam o servidor.
