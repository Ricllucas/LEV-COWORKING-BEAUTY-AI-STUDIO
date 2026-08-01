# Google Agenda compartilhado

1. No Google Agenda, crie um calendário chamado `Agenda LEV Beauty` na conta da administração.
2. Compartilhe-o com as profissionais usando **Ver todos os detalhes dos eventos**.
3. No Google Cloud, ative a **Google Calendar API** e crie uma conta de serviço com chave JSON.
4. Compartilhe o calendário com o e-mail da conta de serviço usando **Fazer alterações nos eventos**.
5. Copie o ID em **Configurações e compartilhamento > Integrar agenda**.
6. Na Vercel, cadastre `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
7. Faça uma nova implantação.

Novos agendamentos criam eventos; reagendamentos atualizam o mesmo evento; cancelamentos o removem.

