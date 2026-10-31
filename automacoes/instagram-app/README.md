# LEV Instagram Automation — MVP

Serviço para preparar, aprovar, agendar e publicar conteúdos do **@levcoworkingbeauty**. A publicação começa simulada (`DRY_RUN=true`), portanto nada é enviado ao Instagram durante a validação.

## Incluído

- Sete pautas iniciais alinhadas à LEV.
- Legendas locais ou geração opcional pela OpenAI Responses API.
- Aprovação humana obrigatória e agendamento.
- Publicação de imagem única e Reel pela API da Meta.
- Painel responsivo, armazenamento JSON atômico e `ADMIN_TOKEN` opcional.

## Executar

Requer Node.js 20 ou superior. No PowerShell:

```powershell
$env:DRY_RUN="true"
$env:ADMIN_TOKEN="um-segredo-local"
npm start
```

Abra `http://localhost:3000`, informe o mesmo token e clique em **Criar calendário inicial**.

## Geração por IA

Defina `OPENAI_API_KEY` somente no servidor. O serviço usa a Responses API e o modelo de `OPENAI_MODEL`. Sem chave, usa modelos de legenda locais.

## Publicação real

Antes de usar `DRY_RUN=false`:

1. Confirme que a conta profissional está habilitada para publicação via API.
2. Crie o app da Meta e obtenha token com permissão de publicação.
3. Configure `META_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID` e `META_API_VERSION`.
4. Use URLs HTTPS públicas para imagens e vídeos.
5. Teste primeiro em uma conta controlada.

## Limites e evolução

- Carrosséis constam no calendário, mas o publicador atual cobre imagem única e Reel.
- JSON serve para validação em um único processo persistente. Para Vercel, migre `JsonStore` para Postgres/Supabase.
- Reels aguardam 15 segundos; produção deve consultar o status do contêiner e usar retentativas.
- Tokens da Meta precisam de renovação e alertas.

Próxima etapa: banco Postgres, upload de mídia, edição visual, métricas e implantação protegida.
