# Railway — proposta de instalação da Evolution API para a LEV

Estado em 17/10/2026: conexão do Railway confirmada, workspace ricllucas's Projects sem projetos. Nenhum serviço ou recurso pago foi criado. Supabase da LEV configurado, testado e com as três conexões pausadas.

## Configuração proposta

- Evolution API v2.3.7, fixada pelo digest de imagem já verificado no registry: evoapicloud/evolution-api@sha256:1bd8afc4a6cf48822e6cf02469aeae7bd35a12a6b616eacd1291926307f4d339.
- PostgreSQL separado para a Evolution; não misturar suas tabelas com o banco da agenda LEV.
- Redis em rede privada.
- Volumes persistentes para banco, Redis e sessões do WhatsApp.
- Somente a Evolution terá um endereço público HTTPS; o Railway fornece esse endereço, dispensando comprar um domínio nesta etapa.
- As variáveis de conexão serão referências entre serviços. Chaves não serão incluídas no frontend nem solicitadas por mensagem.
- Manter uma única réplica da Evolution para preservar a conexão das três instâncias.

## Orçamento para aprovação

Proposta: autorizar até US$30 por mês, antes de impostos/conversão, para a nova hospedagem. É um orçamento de partida, não um preço fixo nem uma previsão baseada em medição: ainda não há serviços rodando. Não inclui mudanças pagas nos planos atuais da Vercel/Supabase.

A Railway cobra por consumo e plano. A documentação consultada informa mínimo Hobby de US$5 e Pro de US$20, com créditos correspondentes incluídos. O valor real pode exceder esses mínimos. As ferramentas conectadas não mostraram o plano de cobrança ou os limites atuais do workspace.

Antes de implantar: conferir plano/créditos e configurar limite de gasto aprovado. O limite de uso interrompe os serviços ao atingir o valor; verificar no painel quais cobranças continuam e o que entra no limite antes de tratá-lo como teto absoluto da fatura. Se esse controle não puder ser configurado/verificado, não iniciar a implantação paga.

## Sequência após a aprovação

1. Conferir o plano e limite de cobrança da conta.
2. Criar projeto exclusivo LEV WhatsApp e os três serviços, com configuração revisada antes de publicar.
3. Validar banco, Redis, endpoint de saúde, persistência e a versão da Evolution.
4. Configurar as variáveis privadas da Vercel e publicar a branch da integração.
5. Cada profissional conecta o próprio aparelho pelo QR Code. Só ativar envios após confirmar o número correto.
6. Validar um agendamento controlado, cancelamento, lembrete, pausa e recuperação da conexão. Acompanhar consumo antes de ampliar a operação.

Fontes: https://docs.railway.com/pricing/plans e https://docs.railway.com/pricing/cost-control.
