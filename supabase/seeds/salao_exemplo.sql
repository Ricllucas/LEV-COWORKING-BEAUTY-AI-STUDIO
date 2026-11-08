-- Salão de exemplo "Studio Aurora" (id 'demo'), fictício, para demonstrar o sistema.
--
-- Rodar no SQL Editor do Supabase DEPOIS de 20261108_fase3_salao_proprio.sql.
-- Pode ser executado de novo: atualiza as linhas em vez de duplicar.
-- Status 'teste': o cron das mensagens só envia para salões 'ativo', então o robô
-- nunca manda WhatsApp por este salão. Para apagar tudo: salao_exemplo_remover.sql.

insert into public.salons (id, slug, name, status)
values ('demo', 'demo', 'Studio Aurora', 'teste')
on conflict (id) do update set slug = excluded.slug, name = excluded.name, status = excluded.status;

-- Configurações do salão (textos, contato e marca).
insert into public.salon_settings (salon_id, id, professional_id, payload)
values ('demo', 'geral', null, '{
  "name": "Studio Aurora",
  "subName": "Studio Aurora | beleza e bem-estar",
  "slogan": "Cabelo e unhas cuidados com carinho, no centro de Florianópolis.",
  "address": "Rua das Flores, 100, Centro, Florianópolis - SC",
  "phone": "(48) 90000-0000",
  "whatsapp": "5548900000000",
  "instagram": "@studioaurora.exemplo",
  "email": "contato@studioaurora.exemplo",
  "businessHoursText": "Terça a sábado, das 9h às 18h",
  "cancellationPolicy": "Cancelamentos ou remarcações devem ser avisados com pelo menos 12 horas de antecedência. Faltas sem aviso podem impedir novos agendamentos pelo site.",
  "depositPercentage": 0,
  "privacyPolicy": "O Studio Aurora usa os dados das clientes apenas para organizar os agendamentos e enviar avisos sobre o atendimento, conforme a LGPD (Lei Geral de Proteção de Dados).",
  "termsOfService": "Ao agendar no Studio Aurora, você concorda com as regras de cancelamento e de pontualidade do salão.",
  "logoUrl": "/salao-exemplo/logo.svg",
  "heroBannerUrl": "/salao-exemplo/capa.svg",
  "brand": {
    "shortName": "Aurora",
    "colors": {
      "text": "#1F2A44",
      "primary": "#2F6F73",
      "accent": "#E07A5F",
      "background": "#F7FAF9",
      "surface": "#E3EFEE"
    },
    "heroKicker": "Cabelo e unhas em Florianópolis",
    "heroTitle": "Um cantinho para cuidar de você",
    "heroText": "No Studio Aurora, cada atendimento tem tempo, calma e atenção aos detalhes. Escolha o serviço e reserve seu horário.",
    "highlights": [
      {
        "title": "Atendimento sem pressa",
        "desc": "Horário reservado só para você, do começo ao fim."
      },
      {
        "title": "Profissionais dedicadas",
        "desc": "Ana cuida do cabelo e Bia cuida das unhas."
      },
      {
        "title": "Ambiente acolhedor",
        "desc": "Um espaço leve e tranquilo, perto de tudo no Centro."
      }
    ],
    "professionalsTitle": "Quem cuida de você",
    "professionalsText": "Conheça as profissionais do Studio Aurora e escolha com quem agendar.",
    "worksTitle": "Nossos trabalhos",
    "works": [],
    "featureTitle": "Beleza de um jeito simples",
    "featureText": "Serviços de cabelo e unhas em um só lugar, com agendamento fácil pelo celular.",
    "featureImageUrl": "/salao-exemplo/capa.svg",
    "googleReviews": null,
    "portfolioEnabled": false,
    "footerNote": "Studio Aurora - salão de exemplo para demonstração do sistema."
  }
}'::jsonb)
on conflict (salon_id, id) do update set payload = excluded.payload, updated_at = now();

-- Profissionais.
insert into public.professionals (salon_id, id, professional_id, payload) values
('demo', 'prof_aurora_ana', 'prof_aurora_ana', '{
  "phone": "(48) 90000-0000",
  "offDays": [],
  "vacations": [],
  "maxDailyAppointments": 8,
  "id": "prof_aurora_ana",
  "name": "Ana",
  "title": "Cabelo",
  "meiName": "Ana Cabelos (exemplo)",
  "cnpjCpf": "",
  "pixKey": "",
  "bankName": "",
  "whatsapp": "5548900000001",
  "email": "ana@studioaurora.exemplo",
  "bio": "Cabeleireira com foco em corte, escova e cuidado com a saúde dos fios.",
  "avatarUrl": "/salao-exemplo/ana.svg",
  "categories": [
    "Outros"
  ],
  "color": "#2F6F73",
  "workingHours": {
    "0": {
      "active": false,
      "startTime": "09:00",
      "endTime": "18:00"
    },
    "1": {
      "active": false,
      "startTime": "09:00",
      "endTime": "18:00"
    },
    "2": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    },
    "3": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    },
    "4": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    },
    "5": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    },
    "6": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    }
  },
  "slotBufferMinutes": 10
}'::jsonb),
('demo', 'prof_aurora_bia', 'prof_aurora_bia', '{
  "phone": "(48) 90000-0000",
  "offDays": [],
  "vacations": [],
  "maxDailyAppointments": 8,
  "id": "prof_aurora_bia",
  "name": "Bia",
  "title": "Unhas",
  "meiName": "Bia Nails (exemplo)",
  "cnpjCpf": "",
  "pixKey": "",
  "bankName": "",
  "whatsapp": "5548900000002",
  "email": "bia@studioaurora.exemplo",
  "bio": "Manicure especialista em esmaltação tradicional e em gel, com acabamento delicado.",
  "avatarUrl": "/salao-exemplo/bia.svg",
  "categories": [
    "Unha Tradicional",
    "Unhas em Gel"
  ],
  "color": "#E07A5F",
  "workingHours": {
    "0": {
      "active": false,
      "startTime": "09:00",
      "endTime": "18:00"
    },
    "1": {
      "active": false,
      "startTime": "09:00",
      "endTime": "18:00"
    },
    "2": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    },
    "3": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    },
    "4": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    },
    "5": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    },
    "6": {
      "active": true,
      "startTime": "09:00",
      "endTime": "18:00",
      "lunchStart": "12:00",
      "lunchEnd": "13:00"
    }
  },
  "slotBufferMinutes": 10
}'::jsonb)
on conflict (salon_id, id) do update set professional_id = excluded.professional_id, payload = excluded.payload, updated_at = now();

-- Serviços (a regra única salon_id + id vem da migração 20261108).
insert into public.catalog_services (salon_id, id, professional_id, payload, deleted) values
('demo', 'srv_aurora_1', 'prof_aurora_ana', '{
  "id": "srv_aurora_1",
  "catalogVersion": 2026110801,
  "name": "Corte Feminino",
  "category": "Outros",
  "description": "Corte com lavagem e finalização leve.",
  "professionalId": "prof_aurora_ana",
  "professionalName": "Ana",
  "durationMinutes": 60,
  "bufferAfterMinutes": 10,
  "price": 90,
  "depositRequired": false,
  "depositValue": 0,
  "color": "#2F6F73",
  "active": true,
  "onlineBookingEnabled": true,
  "minNoticeHours": 2,
  "maxCancellationNoticeHours": 12
}'::jsonb, false),
('demo', 'srv_aurora_2', 'prof_aurora_ana', '{
  "id": "srv_aurora_2",
  "catalogVersion": 2026110801,
  "name": "Escova",
  "category": "Outros",
  "description": "Lavagem e escova modelada.",
  "professionalId": "prof_aurora_ana",
  "professionalName": "Ana",
  "durationMinutes": 45,
  "bufferAfterMinutes": 10,
  "price": 60,
  "depositRequired": false,
  "depositValue": 0,
  "color": "#2F6F73",
  "active": true,
  "onlineBookingEnabled": true,
  "minNoticeHours": 2,
  "maxCancellationNoticeHours": 12
}'::jsonb, false),
('demo', 'srv_aurora_3', 'prof_aurora_bia', '{
  "id": "srv_aurora_3",
  "catalogVersion": 2026110801,
  "name": "Manicure",
  "category": "Unha Tradicional",
  "description": "Cuidado das unhas das mãos com esmaltação tradicional.",
  "professionalId": "prof_aurora_bia",
  "professionalName": "Bia",
  "durationMinutes": 40,
  "bufferAfterMinutes": 10,
  "price": 40,
  "depositRequired": false,
  "depositValue": 0,
  "color": "#E07A5F",
  "active": true,
  "onlineBookingEnabled": true,
  "minNoticeHours": 2,
  "maxCancellationNoticeHours": 12
}'::jsonb, false),
('demo', 'srv_aurora_4', 'prof_aurora_bia', '{
  "id": "srv_aurora_4",
  "catalogVersion": 2026110801,
  "name": "Esmaltação em Gel",
  "category": "Unhas em Gel",
  "description": "Esmaltação em gel com brilho e durabilidade.",
  "professionalId": "prof_aurora_bia",
  "professionalName": "Bia",
  "durationMinutes": 60,
  "bufferAfterMinutes": 10,
  "price": 70,
  "depositRequired": false,
  "depositValue": 0,
  "color": "#E07A5F",
  "active": true,
  "onlineBookingEnabled": true,
  "minNoticeHours": 2,
  "maxCancellationNoticeHours": 12
}'::jsonb, false)
on conflict (salon_id, id) do update set professional_id = excluded.professional_id, payload = excluded.payload, deleted = false, updated_at = now();

-- Conferência (esperado: 1 salão, 1 configuração, 2 profissionais, 4 serviços)
-- select (select count(*) from public.salons where id = 'demo') as salao,
--        (select count(*) from public.salon_settings where salon_id = 'demo') as config,
--        (select count(*) from public.professionals where salon_id = 'demo') as profissionais,
--        (select count(*) from public.catalog_services where salon_id = 'demo') as servicos;
