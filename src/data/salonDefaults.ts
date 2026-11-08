import { AuditLog, CoworkingSettings, Professional, Review, Service } from '../types';
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
