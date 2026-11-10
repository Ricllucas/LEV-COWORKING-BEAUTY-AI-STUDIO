import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { StorageService } from '../../services/storage';

// getCurrentUser() devolve "visitante" para a equipe (o aparelho só guarda
// login de cliente). Usar o papel dele para publicar o catálogo fazia o envio
// procurar a sessão errada e mostrar "Sua sessão expirou" para a admin.
describe('ServicesManager publica com o papel de quem está logada', () => {
  const source = readFileSync(resolve(__dirname, 'ServicesManager.tsx'), 'utf8');

  it('não usa getCurrentUser() para decidir o papel do envio', () => {
    expect(source).not.toMatch(/getCurrentUser\(\)/);
  });

  it('a equipe logada na aba aparece em getSyncUser, mesmo com getCurrentUser dizendo visitante', () => {
    StorageService.setCurrentUser({ id: 'adm_1', name: 'Admin', email: 'a@a.com', role: 'admin' });
    expect(StorageService.getCurrentUser().role).toBe('cliente');
    expect(StorageService.getSyncUser()?.role).toBe('admin');
  });
});
