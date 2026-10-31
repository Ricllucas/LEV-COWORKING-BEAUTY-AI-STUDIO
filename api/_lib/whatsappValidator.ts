// Validador de credenciais e funcionalidade WhatsApp Business

interface ValidationResult {
  isValid: boolean;
  status: 'success' | 'error' | 'warning';
  message: string;
  details: Record<string, unknown>;
}

export const whatsappValidator = {
  // 1. Verificar se todas as variáveis estão configuradas
  validateEnvironmentVariables: (): ValidationResult => {
    const required = [
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_APP_SECRET',
      'WHATSAPP_VERIFY_TOKEN'
    ];

    const missing: string[] = [];
    const configured: Record<string, boolean> = {};

    for (const varName of required) {
      const value = process.env[varName];
      const isSet = !!value;
      configured[varName] = isSet;

      if (!isSet) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      return {
        isValid: false,
        status: 'error',
        message: `Faltam variáveis de ambiente: ${missing.join(', ')}`,
        details: { configured, missing }
      };
    }

    return {
      isValid: true,
      status: 'success',
      message: 'Todas as variáveis de ambiente estão configuradas',
      details: { configured }
    };
  },

  // 2. Validar formato das credenciais
  validateCredentialFormat: (): ValidationResult => {
    const token = process.env.WHATSAPP_ACCESS_TOKEN || '';
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    const secret = process.env.WHATSAPP_APP_SECRET || '';
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';

    const issues: string[] = [];

    // Token deve começar com EAAG ou similar
    if (!token.match(/^EA[A-Za-z0-9]{100,}/)) {
      issues.push('ACCESS_TOKEN formato inválido (deve começar com EAAG)');
    }

    // Phone ID deve ser numérico
    if (!phoneId.match(/^\d{10,}$/)) {
      issues.push('PHONE_NUMBER_ID deve ser numérico (10+ dígitos)');
    }

    // Secret deve ter tamanho razoável
    if (secret.length < 20) {
      issues.push('APP_SECRET parece muito curto');
    }

    // Verify token deve ter tamanho
    if (verifyToken.length < 5) {
      issues.push('VERIFY_TOKEN deve ter pelo menos 5 caracteres');
    }

    if (issues.length > 0) {
      return {
        isValid: false,
        status: 'error',
        message: `Problemas no formato das credenciais: ${issues.join('; ')}`,
        details: {
          tokenFormat: token.slice(0, 10) + '***',
          phoneId: phoneId ? '✓ Configurado' : '✗ Faltando',
          secretLength: secret.length,
          verifyTokenLength: verifyToken.length,
          issues
        }
      };
    }

    return {
      isValid: true,
      status: 'success',
      message: 'Formato das credenciais está válido',
      details: {
        tokenFormat: 'EAAG... ✓',
        phoneIdFormat: phoneId.slice(0, 3) + '...✓',
        secretLength: `${secret.length} chars ✓`,
        verifyTokenLength: `${verifyToken.length} chars ✓`
      }
    };
  },

  // 3. Testar conexão com API do WhatsApp
  testWhatsAppConnection: async (): Promise<ValidationResult> => {
    try {
      const token = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!token || !phoneId) {
        return {
          isValid: false,
          status: 'error',
          message: 'Credenciais não configuradas',
          details: {}
        };
      }

      // Testar GET na API do WhatsApp
      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneId}?fields=display_phone_number,quality_rating&access_token=${token}`
      );

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          isValid: false,
          status: 'error',
          message: `Erro ao conectar na API: ${error.error?.message || response.statusText}`,
          details: {
            status: response.status,
            error: error.error
          }
        };
      }

      const data = await response.json() as any;

      return {
        isValid: true,
        status: 'success',
        message: 'Conexão com WhatsApp API estabelecida com sucesso',
        details: {
          phoneNumber: data.display_phone_number || 'N/A',
          qualityRating: data.quality_rating || 'N/A',
          status: 'Conectado ✓'
        }
      };
    } catch (error) {
      return {
        isValid: false,
        status: 'error',
        message: `Erro ao testar conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown' }
      };
    }
  },

  // 4. Testar envio de mensagem
  testMessageSend: async (testPhoneNumber: string): Promise<ValidationResult> => {
    try {
      const token = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      if (!token || !phoneId) {
        return {
          isValid: false,
          status: 'error',
          message: 'Credenciais não configuradas',
          details: {}
        };
      }

      const cleanPhone = testPhoneNumber.replace(/\D/g, '');

      const response = await fetch(
        `https://graph.instagram.com/v18.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: {
              body: '🧪 Teste de integração LEV Coworking Beauty - Mensagem de validação'
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json() as any;
        return {
          isValid: false,
          status: 'error',
          message: `Falha ao enviar mensagem: ${error.error?.message || response.statusText}`,
          details: {
            status: response.status,
            error: error.error,
            testPhone: cleanPhone
          }
        };
      }

      const data = await response.json() as any;

      return {
        isValid: true,
        status: 'success',
        message: 'Mensagem de teste enviada com sucesso!',
        details: {
          messageId: data.messages?.[0]?.id || 'Unknown',
          status: 'Enviada ✓',
          testPhoneNumber: cleanPhone,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        isValid: false,
        status: 'error',
        message: `Erro ao testar envio: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        details: { error: error instanceof Error ? error.message : 'Unknown' }
      };
    }
  },

  // 5. Validar webhook
  validateWebhookSecret: (): ValidationResult => {
    const secret = process.env.WHATSAPP_APP_SECRET;

    if (!secret) {
      return {
        isValid: false,
        status: 'error',
        message: 'APP_SECRET não configurado',
        details: {}
      };
    }

    return {
      isValid: true,
      status: 'success',
      message: 'APP_SECRET configurado para validação de webhook',
      details: {
        secretLength: secret.length,
        secretPrefix: secret.slice(0, 5) + '***',
        validationMethod: 'HMAC-SHA256'
      }
    };
  },

  // 6. Relatório completo
  runFullValidation: async (testPhoneNumber?: string) => {
    console.log('\n🔍 VALIDADOR WHATSAPP BUSINESS LEV COWORKING\n');
    console.log('=' .repeat(60));

    // 1. Variáveis de ambiente
    console.log('\n1️⃣ Verificando variáveis de ambiente...');
    const envCheck = whatsappValidator.validateEnvironmentVariables();
    console.log(`   Status: ${envCheck.status === 'success' ? '✅' : '❌'} ${envCheck.message}`);

    if (!envCheck.isValid) {
      console.log('   ⚠️  Configure as variáveis antes de prosseguir\n');
      return { allValid: false, results: [envCheck] };
    }

    // 2. Formato das credenciais
    console.log('\n2️⃣ Validando formato das credenciais...');
    const formatCheck = whatsappValidator.validateCredentialFormat();
    console.log(`   Status: ${formatCheck.status === 'success' ? '✅' : '❌'} ${formatCheck.message}`);
    if (formatCheck.details) {
      Object.entries(formatCheck.details).forEach(([key, value]) => {
        if (typeof value === 'string') {
          console.log(`   - ${key}: ${value}`);
        }
      });
    }

    if (!formatCheck.isValid) {
      console.log('   ⚠️  Corrija o formato das credenciais\n');
      return { allValid: false, results: [envCheck, formatCheck] };
    }

    // 3. Conexão com API
    console.log('\n3️⃣ Testando conexão com WhatsApp API...');
    const connCheck = await whatsappValidator.testWhatsAppConnection();
    console.log(`   Status: ${connCheck.status === 'success' ? '✅' : '❌'} ${connCheck.message}`);
    if (connCheck.details) {
      Object.entries(connCheck.details).forEach(([key, value]) => {
        if (typeof value === 'string') {
          console.log(`   - ${key}: ${value}`);
        }
      });
    }

    if (!connCheck.isValid) {
      console.log('   ⚠️  Verifique suas credenciais na Meta Business Suite\n');
      return { allValid: false, results: [envCheck, formatCheck, connCheck] };
    }

    // 4. Webhook
    console.log('\n4️⃣ Validando webhook...');
    const webhookCheck = whatsappValidator.validateWebhookSecret();
    console.log(`   Status: ${webhookCheck.status === 'success' ? '✅' : '❌'} ${webhookCheck.message}`);

    // 5. Teste de envio (opcional)
    let sendCheck = null;
    if (testPhoneNumber) {
      console.log(`\n5️⃣ Testando envio de mensagem para ${testPhoneNumber}...`);
      sendCheck = await whatsappValidator.testMessageSend(testPhoneNumber);
      console.log(`   Status: ${sendCheck.status === 'success' ? '✅' : '❌'} ${sendCheck.message}`);
      if (sendCheck.details.messageId) {
        console.log(`   - ID da Mensagem: ${sendCheck.details.messageId}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESUMO:');

    const allValid = envCheck.isValid && formatCheck.isValid && connCheck.isValid && webhookCheck.isValid;

    if (allValid) {
      console.log('✅ TUDO CONFIGURADO E FUNCIONAL!\n');
      console.log('Próximos passos:');
      console.log('1. Deploy para Vercel');
      console.log('2. Testar agendamento via app');
      console.log('3. Validar confirmação no WhatsApp\n');
    } else {
      console.log('❌ EXISTEM PROBLEMAS A RESOLVER\n');
      console.log('Verifique os itens marcados com ❌ acima\n');
    }

    return {
      allValid,
      results: [envCheck, formatCheck, connCheck, webhookCheck, sendCheck].filter(Boolean)
    };
  }
};
