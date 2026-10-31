# Orçamento para a automação WhatsApp da LEV

Data da consulta: 17/10/2026. Preferência confirmada: servidor online 24 horas, com apresentação do custo antes da contratação.

## Opção econômica: Hetzner CX23 (Alemanha ou Finlândia)

- 2 vCPUs, 4 GB RAM, 40 GB NVMe: €5,49/mês.
- IPv4: €0,50/mês.
- Backup do provedor: 20% do servidor, aproximadamente €1,10/mês.
- Total estimado: €7,09/mês, antes de impostos e conversão de moeda.

A página pública de planos consultada mostrou CX23 como indisponível. É necessário confirmar disponibilidade e preço no console da conta antes de criar o servidor. Não há reserva de capacidade nem contratação realizada. Se não houver estoque, não substituir por plano mais caro sem aprovação.

## Alternativa: DigitalOcean Basic

- 2 vCPUs, 4 GiB RAM, 80 GiB: US$24/mês, antes de impostos e conversão.
- Backup pago não está incluído nessa estimativa e deve ser orçado antes de habilitar.
- A disponibilidade e o valor final dependem da região e do checkout da conta.

## Serviços previstos no servidor

Docker/Compose, Evolution API, PostgreSQL, Redis e Caddy para HTTPS. A versão Evolution v2.3.7 foi identificada no repositório oficial e sua imagem foi localizada no registry Docker Hub. O pacote fixa o digest da imagem, em vez de instalar a tag latest. O funcionamento com os aparelhos ainda precisa ser validado após instalar.

O instalador gera as credenciais no próprio servidor, preserva credenciais existentes e não as imprime. Ele foi preparado para Ubuntu 24.04; não foi executado nem validado em Linux nesta etapa. A tentativa de conferir sua sintaxe com Git Bash local foi impedida pelas permissões do ambiente Windows. Não foi instalado Docker ou WSL neste computador, conforme a escolha de hospedagem online.

O domínio HTTPS pode usar um subdomínio de um domínio existente, se houver acesso ao DNS. Caso seja necessário comprar um domínio, apresentar o custo antes. Os valores acima são somente da nova hospedagem; não alteram os planos já existentes da Vercel/Supabase.

## Acessos ainda necessários

- Conta no provedor escolhido, criada/autenticada pelo titular. Aprovação do custo antes de criar recursos pagos.
- Conectar o Supabase do LEV para aplicar a migração. Não enviar chaves ou senhas pelo chat.
- Acesso à configuração de ambiente da Vercel. O conector/CLI atual não permitiu confirmar esse acesso.
- Cada profissional lê seu QR Code no próprio WhatsApp; a automação só é ativada depois da verificação do número correto.

Nenhum recurso pago foi criado, nenhuma migração de produção foi aplicada e nenhuma mensagem real foi enviada nesta etapa.

## Fontes oficiais

- Servidores Hetzner: https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/
- Especificações/disponibilidade: https://www.hetzner.com/cloud/cost-optimized/
- IPv4: https://docs.hetzner.com/cloud/servers/primary-ips/overview/
- Backup: https://docs.hetzner.com/cloud/billing/faq/
- DigitalOcean: https://www.digitalocean.com/pricing/droplets
- Evolution: https://github.com/evolution-foundation/evolution-api/releases/tag/2.3.7
