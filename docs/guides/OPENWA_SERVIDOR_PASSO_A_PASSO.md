# Robô de WhatsApp da LEV (OpenWA) — Passo a passo

Guia simples para colocar o robô de WhatsApp no ar. Ao final, o sistema da LEV
consegue enviar sozinho: aviso para a profissional, lembrete para a cliente,
agradecimento e lembrete de manutenção.

> ⚠️ O OpenWA é uma forma **não oficial** de usar o WhatsApp. Existe risco de o
> número ser bloqueado. Use **um chip só para isso**, nunca o número principal
> (41) 98497-9940.

Tempo estimado: 1 hora. Custo: servidor de R$ 30 a R$ 60 por mês + chip.

---

## Etapa 1 — Chip e celular

1. Compre um chip novo (qualquer operadora).
2. Coloque em um celular (pode ser um aparelho antigo) e instale o **WhatsApp Business**.
3. Configure o perfil: nome **LEV Coworking Beauty**, foto com o logo, endereço e horário.
4. **Use esse WhatsApp normalmente por 3 a 5 dias** antes de ligar o robô: converse com
   as profissionais e algumas clientes. Números novos que já começam mandando muitas
   mensagens são bloqueados com mais facilidade.

## Etapa 2 — Alugar o servidor

Um servidor é um computador na internet que fica ligado 24 horas.

1. Escolha um provedor com servidor no Brasil e pagamento em reais. Exemplos:
   **Hostinger (VPS KVM 1 ou KVM 2)**, **Locaweb**, **Magalu Cloud**.
2. Na hora de contratar, escolha:
   - Sistema: **Ubuntu 24.04**
   - Memória: **no mínimo 2 GB** (recomendado 4 GB)
   - Local: **Brasil** (São Paulo), se tiver a opção
3. Anote o **IP do servidor** (algo como `203.0.113.10`). Ele aparece no painel do provedor.
4. No painel do provedor, procure **Firewall** e deixe abertas **apenas** as portas
   **22**, **80** e **443**.

## Etapa 3 — Abrir o terminal do servidor

No painel do provedor, procure o botão **"Terminal"**, **"Console"** ou **"Acesso SSH pelo navegador"**.
Abre uma tela preta onde se digitam comandos. Copie e cole cada bloco abaixo e aperte **Enter**.

## Etapa 4 — Instalar o Docker

```bash
curl -fsSL https://get.docker.com | sh
```

Espere terminar (1 a 3 minutos).

## Etapa 5 — Instalar o robô (OpenWA)

```bash
git clone https://github.com/rmyndharis/OpenWA.git
cd OpenWA
docker compose up -d
```

Na primeira vez demora alguns minutos.

## Etapa 6 — Pegar a chave principal do robô

```bash
docker exec openwa-api cat /app/data/.api-key; echo
```

Aparece uma sequência longa de letras e números. **Essa é a senha principal do robô.**
Guarde em local seguro (gerenciador de senhas). **Não mande por WhatsApp, e-mail ou chat.**

## Etapa 7 — Endereço seguro (HTTPS)

Troque `203.0.113.10` pelo IP do seu servidor, **trocando os pontos por traços**
(ex.: `203-0-113-10.sslip.io`):

```bash
docker run -d --name caddy --restart unless-stopped --network host \
  -v caddy_data:/data caddy \
  caddy reverse-proxy --from 203-0-113-10.sslip.io --to localhost:2785
```

O endereço do robô passa a ser: **https://203-0-113-10.sslip.io**

## Etapa 8 — Conectar o WhatsApp do chip

1. No computador, abra o endereço do robô (Etapa 7).
2. Entre com a **chave principal** (Etapa 6).
3. Crie uma sessão chamada **`lev`**.
4. Clique para iniciar e aparecerá um **QR Code**.
5. No celular do chip: WhatsApp → **Aparelhos conectados** → **Conectar aparelho** → leia o QR Code.
6. A sessão deve ficar como **conectada**.

> Se ficar parado em "qr_ready", tente de novo; algumas contas pedem confirmação extra no celular.

## Etapa 9 — Criar a chave do sistema da LEV

Por segurança, o site da LEV usa uma chave própria, que só consegue usar a sessão `lev`:

1. No painel do robô, vá em **API Keys** → criar nova.
2. Tipo: **operator**. Sessões permitidas: **lev**.
3. Copie a chave gerada.

## Etapa 10 — Colocar as informações na Vercel

1. Entre em https://vercel.com → projeto **lev-coworking-beauty** → **Settings** → **Environment Variables**.
2. Crie estas três variáveis (ambiente **Production**):

| Nome | Valor |
|---|---|
| `OPENWA_URL` | o endereço da Etapa 7 (ex.: `https://203-0-113-10.sslip.io`) |
| `OPENWA_SESSION` | `lev` |
| `OPENWA_API_KEY` | a chave da Etapa 9 |

3. Salve e **avise o Claude** que está pronto (sem mandar a chave). Ele faz a ligação
   do sistema com o robô e testa o envio.

---

## Cuidados para não ter o número bloqueado

- Mandar mensagens **só para clientes da LEV** (nunca listas compradas ou desconhecidos).
- Poucas mensagens por dia no começo; o sistema espaça os envios.
- Se uma cliente pedir para não receber mensagens, respeitar.
- Manter o celular do chip **ligado e com internet**.
- O quadro **"Mensagens para clientes"** do painel continua funcionando como plano B.

## Se algo parar de funcionar

- **Mensagens não saem:** abra o painel do robô e veja se a sessão `lev` está conectada.
  Se não estiver, leia o QR Code de novo (Etapa 8).
- **Servidor reiniciou:** no terminal, rode `cd OpenWA && docker compose up -d`.
