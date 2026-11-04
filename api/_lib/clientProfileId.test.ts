import { describe, expect, it } from 'vitest';
import { clientProfileId } from './clientProfileId';

describe('clientProfileId', () => {
  it('LEV mantém o id antigo, sem mudança', () => {
    expect(clientProfileId('lev', '41984979940')).toBe('cli_41984979940');
  });

  it('outro salão leva o salão no id', () => {
    expect(clientProfileId('salao-b', '41984979940')).toBe('cli_salao-b_41984979940');
  });

  it('recusa id de salão inválido', () => {
    expect(() => clientProfileId('Salão B', '41984979940')).toThrow('salon_id inválido');
  });
});
