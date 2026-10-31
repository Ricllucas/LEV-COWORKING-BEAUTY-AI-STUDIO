# Google Agenda compartilhado

1. No Google Agenda, crie um calendário chamado `Agenda LEV Beauty` na conta da administração.
2. Compartilhe-o com as profissionais usando **Ver todos os detalhes dos eventos**.
3. No Google Cloud, ative a **Google Calendar API** e crie uma conta de serviço com chave JSON.
4. Compartilhe o calendário com o e-mail da conta de serviço usando **Fazer alterações nos eventos**.
5. Copie o ID em **Configurações e compartilhamento > Integrar agenda**.
6. Na Vercel, cadastre `GOOGLE_CALENDAR_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL` e `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
7. Faça uma nova implantação.

Para manter cores distintas com acesso somente de leitura, crie tambem as agendas
`LEV - Elisangela`, `LEV - Talitha` e `LEV - Nayara`. Compartilhe cada uma com
as profissionais usando **Ver todos os detalhes dos eventos** e com a conta de
servico usando **Fazer alteracoes nos eventos**. Cadastre os respectivos IDs na
Vercel como `GOOGLE_CALENDAR_ID_ELISANGELA`, `GOOGLE_CALENDAR_ID_TALITHA` e
`GOOGLE_CALENDAR_ID_NAYARA`. A variavel `GOOGLE_CALENDAR_ID` continua sendo o
calendario de contingencia.

Novos agendamentos criam eventos na agenda da profissional; reagendamentos
atualizam o mesmo evento; cancelamentos o removem.

