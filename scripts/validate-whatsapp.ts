#!/usr/bin/env node

/**
 * Script de Validação WhatsApp Business
 * Uso: npx tsx scripts/validate-whatsapp.ts [numero_teste]
 *
 * Exemplo:
 * npx tsx scripts/validate-whatsapp.ts 5585999999999
 */

import { whatsappValidator } from '../api/_lib/whatsappValidator.js';

async function main() {
  const testPhoneNumber = process.argv[2];

  console.log('\n📱 LEV COWORKING BEAUTY - Validador WhatsApp Business\n');

  try {
    const result = await whatsappValidator.runFullValidation(testPhoneNumber);

    if (result.allValid) {
      console.log('🎉 SUCESSO! Seu WhatsApp Business está pronto para usar!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Alguns problemas foram encontrados. Veja acima.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro durante validação:', error);
    process.exit(1);
  }
}

main();
