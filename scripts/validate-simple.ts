#!/usr/bin/env node

/**
 * Validação Simples WhatsApp - Carrega .env manualmente
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Função para carregar .env
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env não encontrado!');
    console.log(`   Procurando em: ${envPath}`);
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key.trim()] = value.trim();
    }
  });

  return true;
}

// Carregar variáveis
loadEnv();

console.log('\n📱 LEV COWORKING BEAUTY - Validação WhatsApp\n');
console.log('='.repeat(60));

// Validar variáveis
const requiredVars = [
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_APP_SECRET',
  'WHATSAPP_VERIFY_TOKEN',
];

let allValid = true;
const missing: string[] = [];

console.log('\n1️⃣  Verificando variáveis de ambiente...\n');

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = value.substring(0, 20) + '...';
    console.log(`   ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName}: NÃO ENCONTRADA`);
    missing.push(varName);
    allValid = false;
  }
});

console.log('\n' + '='.repeat(60));

if (missing.length > 0) {
  console.log('\n❌ FALTAM VARIÁVEIS:\n');
  missing.forEach(v => console.log(`   • ${v}`));
  console.log('\n⚠️  Configure as variáveis em .env antes de prosseguir');
  process.exit(1);
}

console.log('\n✅ TODAS AS VARIÁVEIS CONFIGURADAS!\n');
console.log('📋 Próximos passos:');
console.log('   1. Deploy no Vercel está ativo');
console.log('   2. Fazer um agendamento de teste no app');
console.log('   3. Verificar se confirmação chegou no WhatsApp');
console.log('\n✅ Configuração completa! 🎉\n');

process.exit(0);
