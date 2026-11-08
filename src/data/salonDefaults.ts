import { AuditLog, CoworkingSettings, Professional, Review, SalonBrand, Service } from '../types';
import { DEFAULT_SALON_ID } from '../../api/_lib/tenant';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_PROFESSIONALS,
  INITIAL_REVIEWS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS
} from './initialData';
import { RETIRED_SERVICE_IDS } from './retiredServices';

// Dados "de fábrica" que acompanham o site, por salão. Só a LEV tem dados
// embutidos no código; um salão novo começa vazio e recebe tudo da nuvem.
export type BundledSalonData = {
  settings: CoworkingSettings;
  professionals: Professional[];
  services: Service[];
  reviews: Review[];
  auditLogs: AuditLog[];
};

const neutralSettings = (): CoworkingSettings => ({
  name: '',
  subName: '',
  slogan: '',
  address: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  email: '',
  businessHoursText: '',
  cancellationPolicy: '',
  depositPercentage: 30,
  privacyPolicy: '',
  termsOfService: ''
});

// Marca de fábrica de um salão novo: textos genéricos, sem nome de salão e
// sem fotos. Cada salão grava a própria marca em `settings.brand`.
export const NEUTRAL_BRAND: SalonBrand = {
  shortName: '',
  colors: {
    text: '#2D2A32',
    primary: '#5E548E',
    accent: '#9F86C0',
    background: '#FAFAF9',
    surface: '#EFEDF3'
  },
  heroKicker: '',
  heroTitle: 'Agende seu horário',
  heroText: 'Escolha a profissional, o serviço e o melhor horário para você.',
  highlights: [
    { title: 'Atendimento personalizado', desc: 'Cuidado em cada detalhe' },
    { title: 'Nossas profissionais', desc: '{profissionais}' },
    { title: 'Agendamento online 24h', desc: 'Agende quando quiser' }
  ],
  professionalsTitle: 'Conheça nossas profissionais',
  professionalsText: 'Escolha com quem você quer agendar.',
  worksTitle: '',
  works: [],
  featureTitle: '',
  featureText: '',
  featureImageUrl: '',
  googleReviews: null,
  portfolioEnabled: false,
  footerNote: ''
};

const LEV_SERVICES = INITIAL_SERVICES.filter(service => !RETIRED_SERVICE_IDS.has(service.id));

export function bundledDataFor(salonId: string): BundledSalonData {
  if (salonId === DEFAULT_SALON_ID) {
    return {
      settings: INITIAL_SETTINGS,
      professionals: INITIAL_PROFESSIONALS,
      services: LEV_SERVICES,
      reviews: INITIAL_REVIEWS,
      auditLogs: INITIAL_AUDIT_LOGS
    };
  }
  return { settings: neutralSettings(), professionals: [], services: [], reviews: [], auditLogs: [] };
}
