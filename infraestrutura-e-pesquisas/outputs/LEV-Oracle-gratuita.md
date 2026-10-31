# Oracle Cloud Always Free — configuração da LEV

Preparado em 17/10/2026. Hospedagem paga não autorizada; criar somente recursos marcados como Always Free elegíveis, com confirmação do resumo de cobrança antes da criação.

## Configuração proposta

- Nome: lev-whatsapp-free.
- Região: região principal (home region) da conta Oracle, sujeita à disponibilidade real.
- Shape: VM.Standard.A1.Flex (ARM), dentro da franquia Always Free mostrada no console.
- Ponto de partida: 2 OCPUs e 6 GB RAM; conferir o total consumido por todos os servidores da conta. A documentação consultada informa franquia total Always Free de 2 OCPUs e 12 GB RAM.
- Imagem: Ubuntu 24.04 ARM elegível para Always Free, se disponível. O instalador preparado exige Ubuntu 24.04; não executar automaticamente em outra versão.
- Disco de inicialização: padrão de 50 GB, dentro da franquia total de 200 GB de volumes. Não criar discos adicionais nesta etapa.
- Uma VM com Docker, Evolution API, PostgreSQL, Redis e proxy HTTPS. Não é necessário instalar Docker neste computador.
- Rede: HTTPS público para a Evolution; PostgreSQL e Redis apenas na rede interna Docker. SSH restrito ao endereço administrativo quando possível, sem expor portas 5432/6379.
- Acesso administrativo por chave SSH; nunca enviar a chave privada pelo chat. O domínio/endereço HTTPS será definido após existir um IP de servidor, sem contratar domínio pago sem aprovação.

## Compatibilidade verificada

A imagem oficial evoapicloud/evolution-api:v2.3.7 publica variantes linux/amd64 e linux/arm64. O índice de imagens foi verificado no Docker Hub com digest:
sha256:1bd8afc4a6cf48822e6cf02469aeae7bd35a12a6b616eacd1291926307f4d339.

Isso confirma a disponibilidade da imagem para ARM; a execução real e o pareamento dos aparelhos ainda precisam ser testados no servidor.

## Sequência

1. O titular entra ou cria uma conta Oracle Cloud diretamente no portal. Eventuais verificações de identidade, cartão e termos são realizadas pelo titular, sem compartilhar dados no chat.
2. Confirmar capacidade gratuita na região principal e as marcações Always Free dos recursos. Se o console indicar custo, upgrade pago ou falta de capacidade, não concluir a criação.
3. Gerar e registrar uma chave SSH para esse servidor, configurar a VM e o acesso de rede autorizado.
4. Copiar os arquivos de infrastructure/evolution para o servidor e executar o instalador com o domínio/endereço HTTPS já configurado.
5. Validar persistência dos volumes, saúde dos serviços e HTTPS; registrar a URL e chave da Evolution somente nos segredos de servidor da Vercel.
6. Publicar a integração, conectar os três números com os QR Codes e testar com destinatário autorizado. Habilitar cada profissional separadamente.

## Estado confirmado

- Supabase LEV: migração instalada e validada; três conexões desativadas; fila vazia.
- Código da integração: 46 testes locais passaram e build concluído na etapa de implementação.
- Oracle: portal aberto, aguardando autenticação ou cadastro do titular. Nenhuma VM criada.
- Nenhuma mensagem real enviada, nenhuma cobrança autorizada e nenhum recurso pago contratado.

A Oracle pode não ter capacidade gratuita disponível e pode recolher instâncias consideradas ociosas. Não há promessa de disponibilidade contínua no plano gratuito.

Documentação: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
Portal: https://cloud.oracle.com/
