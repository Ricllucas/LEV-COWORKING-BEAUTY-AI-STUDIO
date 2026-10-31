// Templates de mensagens WhatsApp por profissional
// Mensagens cativantes e humanizadas

interface MessageTemplate {
  confirmacao: string;
  lembrete1Dia: string;
  lembrete1Hora: string;
  obrigada: string;
  atraso: string;
  cancelamento: string;
}

export const professionalTemplates: Record<string, MessageTemplate> = {
  prof_elisangela: {
    confirmacao: `✨ *Oi {{clientName}}!* ✨

Que alegria saber que você escolheu nosso espaço! 💅

Seu agendamento foi *confirmado* com toda carinho:

📅 *Data:* {{date}}
⏰ *Horário:* {{time}}
💆‍♀️ *Serviço:* {{service}}
💰 *Valor:* R$ {{price}}

Vou estar aqui especialmente para deixar suas unhas *impecáveis*! Você vai sair daqui sentindo-se *rainha*! 👑

Qualquer dúvida, me manda uma mensagem por aqui! Estou sempre à disposição.

*Beijos e até lá!* 💋
Elisangela ✨`,

    lembrete1Dia: `🌟 *E aí, {{clientName}}?* 🌟

Só um carinho lembrando que amanhã você vem para transformar essas unhas! 💅✨

⏰ *Não esqueça:* {{time}} em ponto!

Prepare-se para sair daqui se sentindo uma *deusa*! Vai ser lindo demais! 🔥

Qualquer coisa, é só chamar! Beijos! 💋
Elisangela`,

    lembrete1Hora: `⏰ *Olha o reloginho!* ⏰

Você tem *1 hora* para chegar aqui! Nos vemos logo! 💅✨

Já estou aqui me preparando para deixar você *linda demais*!

Qualquer coisa, me manda um oi!
*Beijoss!* 💋
Elisangela`,

    obrigada: `💕 *Muitooo obrigada, {{clientName}}!* 💕

Que privilégio foi te atender hoje! Suas unhas ficaram *lindas demais*! ✨💅

Espero que tenha saído daqui se sentindo especial, porque você *merece*! 👑

Volta sempre! Vou estar aqui, ansiosa para te ver novamente! 💋

Beijos e abraços!
Elisangela ✨`,

    atraso: `⏰ Oi {{clientName}}! Tudo bem?

Não consigo te encontrar... Você saiu do caminho? 😅

Estou aqui acompanhando o horário. Se não conseguir chegar, me avisa logo!

Beijos! ✨`,

    cancelamento: `💔 *Ficamos tristes com sua ausência, {{clientName}}!*

Entendemos que às vezes os compromissos mudam, mas gostaríamos que você nos avisasse com antecedência.

Quando puder, volta pra gente! Estou sempre aqui para deixar você linda! 💅✨

Beijos! Elisangela`
  },

  prof_talitha: {
    confirmacao: `✨ *Olá {{clientName}}!* ✨

Que *emoção* saber que você confia em mim para sua transformação! 💄✨

Seu agendamento está *100% confirmado*:

📅 *Data:* {{date}}
⏰ *Horário:* {{time}}
💆‍♀️ *Serviço:* {{service}}
💰 *Investimento:* R$ {{price}}

Estou *super ansiosa* para criar a melhor versão de você! Vamos fazer você brilhar! 🌟

Qualquer pergunta ou dúvida, estou por aqui! Pode chamar!

*Beijos de luz!* ✨💋
Talitha 💄`,

    lembrete1Dia: `🌟 *Lembrete especial, {{clientName}}!* 🌟

Amanhã é o *grande dia*! ⏰ {{time}}

Estou preparando tudo com *muito carinho* para você! Vai ser incrível! 💄✨

*Dica:* Venha com o rosto limpo e sem maquiagem para eu trabalhar melhor!

Mal posso esperar para te ver! Beijos! 💋
Talitha`,

    lembrete1Hora: `⏰ *Eba! Você está chegando!* ⏰

Falta *1 horinha* para começarmos essa transformação! 💄✨

Já estou aqui, toda preparada para deixar você *absolutamente linda*!

Nos vemos logo, querida! 💋
Talitha`,

    obrigada: `✨ *{{clientName}}, você foi incrível!* ✨

Adorei trabalhar com você! Ficou *perfeito demais*! 💄💕

Você saiu daqui com aquele glow que vale ouro! Que satisfação trabalhar com uma pessoa tão bacana quanto você!

*Volta sempre!* Estarei aqui esperando por você! 🌟💋

Beijos carinhosos!
Talitha ✨`,

    atraso: `💭 Oi {{clientName}}! Tudo bem?

Estou aqui aguardando você! ⏰

Algo deu errado? Me avisa!

Um beijo! 💋`,

    cancelamento: `💔 *Ficamos com saudade, {{clientName}}!*

Entendemos que os planos mudam, mas nos avisa né? Nos dá essa chance!

Quando a vida permitir, você volta, tá? Vou estar aqui, pronta para deixar você radiante novamente! 💄✨

Beijos! Talitha`
  },

  prof_nayara: {
    confirmacao: `✨ *Oi {{clientName}}, tudo bem?* ✨

Que *felicidade*! Você marcou com a gente! 💅💖

Seu agendamento está *confimado* com toda alegria:

📅 *Data:* {{date}}
⏰ *Horário:* {{time}}
💆‍♀️ *Serviço:* {{service}}
💰 *Valor:* R$ {{price}}

Já estou preparando tudo para deixar suas unhas *IMPECÁVEIS*! Você vai se apaixonar! 🔥

Qualquer coisa, é só me chamar! Estou sempre de boa! 😊

*Abraços!* 💋
Nayara 💅`,

    lembrete1Dia: `🌟 *E aí, {{clientName}}?* 🌟

Amanhã você vem ficar *deusa*! Meu Deus, estou ansiosa! ⏰ {{time}}

Traz umas ideias, traz inspo se quiser... Vamos criar algo *lindíssimo* junto! 💅✨

*Não esqueça!* Um beijo! 💋
Nayara`,

    lembrete1Hora: `⏰ *Já já você aqui!* ⏰

Falta apenas *1 hora*! Estou pronta para deixar você *radiante*! 💅✨

Vem logo, querida! Beijos! 💋
Nayara`,

    obrigada: `💕 *{{clientName}}, foi um presente te atender!* 💕

Suas unhas ficaram *do caralho*! Não tenho nem palavras! 💅✨

Você saiu daqui com aquele estilo que a gente ama! Volta sempre, viu? Quero ser a nail designer das suas unhas para sempre!

*Um abraço gigante!* 💋
Nayara 💚`,

    atraso: `👀 Oi {{clientName}}! E aí? Tudo certo?

Estou aqui te esperando! ⏰

Tá tudo bem contigo? Só me avisa! 😊`,

    cancelamento: `💔 *Que pena, {{clientName}}!*

Ficamos tristes com você não vindo, mas tudo bem! A vida é assim mesmo!

Próxima vez você avisa, tá? Promete? 🥺

Quando quiser voltar, estou aqui! Beijos! 💅
Nayara`
  }
};

export const getTemplate = (
  professionalId: string,
  messageType: keyof MessageTemplate
): string => {
  const templates = professionalTemplates[professionalId];
  if (!templates) {
    return professionalTemplates.prof_elisangela[messageType];
  }
  return templates[messageType];
};

export const replaceTemplateVariables = (
  template: string,
  variables: {
    clientName?: string;
    date?: string;
    time?: string;
    service?: string;
    price?: string;
  }
): string => {
  let message = template;

  if (variables.clientName) {
    message = message.replace(/{{clientName}}/g, variables.clientName);
  }
  if (variables.date) {
    message = message.replace(/{{date}}/g, variables.date);
  }
  if (variables.time) {
    message = message.replace(/{{time}}/g, variables.time);
  }
  if (variables.service) {
    message = message.replace(/{{service}}/g, variables.service);
  }
  if (variables.price) {
    message = message.replace(/{{price}}/g, variables.price);
  }

  return message;
};
