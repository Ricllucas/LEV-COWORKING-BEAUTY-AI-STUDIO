# Continuidade do projeto — LEV Coworking Beauty AI Studio

## Finalidade deste arquivo

Este documento é o ponto de continuidade entre o Codex no celular, o Codex no notebook e outros ambientes de desenvolvimento. Antes de alterar o projeto, leia este arquivo e confirme a branch em uso.

## Repositório e fluxo de trabalho

- Repositório: `Ricllucas/LEV-COWORKING-BEAUTY-AI-STUDIO`
- Branch estável: `main`
- Branch de desenvolvimento compartilhada: `agent/project-continuity`
- Regra: não desenvolver diretamente na `main`.
- Alterações devem ser implementadas e testadas na branch de desenvolvimento.
- Depois da validação, as mudanças devem ser integradas à `main` por pull request.
- Antes de iniciar uma nova sessão, sincronize a branch e leia este arquivo.
- Ao concluir uma etapa relevante, atualize as seções "Estado atual" e "Próximas tarefas".

## Sincronização no notebook

Se o projeto já estiver clonado:

```bash
git fetch origin
git switch agent/project-continuity
git pull origin agent/project-continuity
```

Se a branch ainda não existir localmente:

```bash
git fetch origin
git switch --track origin/agent/project-continuity
```

Antes de começar a trabalhar:

```bash
git status
git pull
```

Depois de uma alteração validada:

```bash
git add <arquivos-alterados>
git commit -m "descrição objetiva da alteração"
git push
```

Não versionar arquivos `.env`, chaves de API, senhas, tokens ou credenciais.

## Visão técnica atual

- Frontend: React 19 e TypeScript.
- Build e desenvolvimento: Vite 6.
- Estilos: Tailwind CSS 4.
- Componentes visuais: Lucide React e Motion.
- Integração de IA prevista: Google GenAI/Gemini.
- Servidor disponível no projeto: Express.
- Branch existente antes desta organização: `main`.
- Não havia arquivo `README.md` na verificação inicial.

## Funcionalidades identificadas

O arquivo `src/App.tsx` organiza as seguintes áreas:

- página pública do estúdio;
- agendamento público;
- portal da cliente;
- autenticação de cliente;
- acesso administrativo pela rota `/admin`;
- acesso profissional pela rota `/profissional`;
- painel geral;
- agenda;
- gestão de clientes;
- gestão financeira;
- serviços;
- profissionais;
- relatórios;
- central de WhatsApp;
- lista de espera;
- promoções;
- configurações;
- logs de auditoria;
- notificações;
- instalação como PWA.

## Profissionais e serviços do negócio

- Elisângela: unhas tradicionais.
- Nayara: unhas em gel.
- Talitha: sobrancelhas, cílios e maquiagem.
- Cada profissional deve administrar seus próprios atendimentos e clientes, respeitando os níveis de acesso definidos no sistema.

## Estado atual em 30/07/2026

- O código está disponível no GitHub.
- A branch principal é `main`.
- Os commits mais recentes revisaram textos de acesso, gestão profissional, configurações, financeiro, agendamento, painel, serviços e página pública.
- O projeto possui scripts para desenvolvimento, build, preview e verificação TypeScript.
- A configuração `.env.example` prevê `GEMINI_API_KEY` e `APP_URL`.
- Ainda é necessário confirmar, por testes, quais funcionalidades usam dados reais e quais dependem de armazenamento local ou dados simulados.
- Nenhuma funcionalidade foi modificada na criação deste documento.

## Próximas tarefas recomendadas

1. Mapear toda a estrutura de arquivos e os serviços de dados.
2. Executar `npm install`, `npm run lint` e `npm run build`.
3. Identificar dados simulados, LocalStorage e integrações ainda não persistentes.
4. Definir o backend e o banco de dados de produção.
5. Revisar autenticação e permissões de administrador, profissional e cliente.
6. Validar o fluxo completo de agendamento, bloqueio de horários, cancelamento e reagendamento.
7. Definir a integração oficial com WhatsApp para confirmações e lembretes.
8. Documentar instalação, variáveis de ambiente e implantação em um `README.md`.
9. Testar responsividade no celular e funcionamento como PWA.
10. Registrar aqui cada decisão técnica e a última etapa concluída.

## Orientação para a próxima sessão do Codex

Analise primeiro o repositório e este documento. Confirme a branch atual e o estado do Git antes de editar. Preserve alterações existentes, não exponha segredos e não publique diretamente na `main`. Apresente ao usuário o diagnóstico e o escopo da próxima mudança antes de modificar partes sensíveis do projeto.
