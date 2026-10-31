#!/usr/bin/env node

/**
 * Script para adicionar dados de teste - Horários Disponíveis
 * Uso: npx tsx scripts/seed-availability.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carregar variáveis de ambiente
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis Supabase não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('\n📋 Adicionando dados de teste...\n');

async function seedAvailability() {
  try {
    // Profissionais
    const professionals = [
      { id: 1, name: 'Elisangela', phone: '5541984979940' },
      { id: 2, name: 'Talitha', phone: '5541984979940' },
      { id: 3, name: 'Nayara', phone: '5541984979940' },
    ];

    // Adicionar horários para próximos 7 dias
    const today = new Date();

    for (let day = 1; day <= 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];

      // Horários disponíveis (9h às 18h, com intervalos de 1h)
      const times = [
        '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
      ];

      for (const professional of professionals) {
        for (const time of times) {
          const { error } = await supabase
            .from('available_slots')
            .insert({
              professional_id: professional.id,
              date: dateStr,
              time: time,
              duration: 60,
              available: true,
            });

          if (error && !error.message.includes('duplicate')) {
            console.log(`⚠️  ${professional.name} ${dateStr} ${time}: ${error.message}`);
          }
        }
      }

      console.log(`✅ ${dateStr}: Horários adicionados para todas as profissionais`);
    }

    console.log('\n✅ Dados de teste adicionados com sucesso!');
    console.log('\n📝 Próximo passo:');
    console.log('   1. Recarregue o app no navegador');
    console.log('   2. Faça um agendamento de teste');
    console.log('   3. Verifique o WhatsApp');
    console.log('\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

seedAvailability().then(() => process.exit(0));
