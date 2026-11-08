import { isDefaultSalon } from '../config/salon';
import { LEV_CONTACT_NAME, LEV_MESSAGE_NAME, LEV_SHORT_NAME } from '../data/levBrand';
import type { CoworkingSettings } from '../types';

// Nome do salão nas mensagens: completo e curto ("seu horário no {curto}").
export type SalonNames = { name: string; shortName: string };

// No salão padrão, o nome completo é o texto que as mensagens às clientes já
// usavam (aprovado pela dona), mesmo que o nome no painel seja outro.
export const salonNames = (settings: CoworkingSettings): SalonNames => {
  const isDefault = isDefaultSalon();
  return {
    name: isDefault ? LEV_MESSAGE_NAME : settings.name,
    shortName: settings.brand?.shortName || (isDefault ? LEV_SHORT_NAME : settings.name)
  };
};

// Nome usado nos contatos montados pelo site (links de WhatsApp da equipe e do
// agendamento). O salão padrão escrevia em maiúsculas; os outros usam o cadastro.
export const contactSalonName = (settings: CoworkingSettings): string =>
  isDefaultSalon() ? LEV_CONTACT_NAME : settings.name;
