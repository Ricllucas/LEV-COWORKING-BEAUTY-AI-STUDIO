import { Professional, Service } from '../types';

export type ServiceFormFields = Pick<Service,
  'name' | 'category' | 'description' | 'professionalId' | 'durationMinutes' | 'price' | 'promotionalPrice' | 'depositValue'>;

// Monta o serviço a partir do formulário. Na edição, parte do serviço original:
// assim ele mantém o que o formulário não mostra (por exemplo a versão do
// catálogo, sem a qual o preço de fábrica voltaria por cima do preço editado).
export const buildServiceFromForm = (
  fields: ServiceFormFields,
  editing: Service | null,
  professional: Professional | undefined,
  newId: () => string = () => 'srv_' + Date.now()
): Service => ({
  bufferAfterMinutes: 10,
  active: true,
  onlineBookingEnabled: true,
  minNoticeHours: 2,
  maxCancellationNoticeHours: 24,
  ...(editing ?? {}),
  id: editing ? editing.id : newId(),
  name: fields.name,
  category: fields.category,
  description: fields.description,
  professionalId: fields.professionalId,
  professionalName: professional?.name || 'Profissional',
  durationMinutes: Number(fields.durationMinutes),
  price: Number(fields.price),
  promotionalPrice: fields.promotionalPrice ? Number(fields.promotionalPrice) : undefined,
  depositRequired: fields.depositValue > 0,
  depositValue: Number(fields.depositValue),
  color: professional?.color || '#D4AF37'
});
