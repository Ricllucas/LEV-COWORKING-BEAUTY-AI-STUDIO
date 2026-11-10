import { describe, it, expect } from 'vitest';
import { buildServiceFromForm } from './serviceForm';
import { INITIAL_SERVICES } from '../data/initialData';

const original = INITIAL_SERVICES.find(s => s.id === 'srv_eli_1')!;
const fields = {
  name: original.name,
  category: original.category,
  description: original.description,
  professionalId: original.professionalId,
  durationMinutes: original.durationMinutes,
  price: original.price + 1,
  promotionalPrice: undefined,
  depositValue: original.depositValue
};

describe('buildServiceFromForm', () => {
  it('na edição mantém a versão do catálogo, para o preço editado não ser trocado pelo de fábrica', () => {
    const saved = buildServiceFromForm(fields, original, undefined);
    expect(original.catalogVersion).toBeTruthy();
    expect(saved.catalogVersion).toBe(original.catalogVersion);
    expect(saved.price).toBe(original.price + 1);
    expect(saved.id).toBe('srv_eli_1');
  });

  it('serviço novo ganha id novo e valores padrão', () => {
    const saved = buildServiceFromForm(fields, null, undefined, () => 'srv_novo');
    expect(saved.id).toBe('srv_novo');
    expect(saved.catalogVersion).toBeUndefined();
    expect(saved.bufferAfterMinutes).toBe(10);
    expect(saved.active).toBe(true);
  });
});
