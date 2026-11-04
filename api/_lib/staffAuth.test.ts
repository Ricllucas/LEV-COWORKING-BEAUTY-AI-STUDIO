import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticateStaff as authenticateStaffBasic } from './staffAuth';
import { authenticateStaff as authenticateStaffWhatsApp } from './whatsapp';

type Rows = { admins?: unknown; professionals?: unknown };

const json = (body: unknown, ok = true) => ({ ok, json: async () => body });

const mockSupabase = (rows: Rows) => {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes('/auth/v1/user')) return json({ id: 'user-1' });
    if (url.includes('/rest/v1/admin_users')) return json(rows.admins ?? []);
    if (url.includes('/rest/v1/professional_access')) return json(rows.professionals ?? []);
    return json([], false);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const calledUrls = (fetchMock: ReturnType<typeof mockSupabase>): string[] =>
  fetchMock.mock.calls.map(call => String(call[0]));

const implementations = [
  { nome: 'staffAuth', authenticate: authenticateStaffBasic },
  { nome: 'whatsapp', authenticate: authenticateStaffWhatsApp }
] as const;

describe.each(implementations)('authenticateStaff ($nome): salão da equipe', ({ authenticate }) => {
  beforeEach(() => {
    process.env.SUPABASE_URL = 'https://db.exemplo';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-de-servico';
    process.env.WHATSAPP_ACCESS_TOKEN = 'token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123';
  });
  afterEach(() => vi.unstubAllGlobals());

  it('admin do salao-b devolve salonId salao-b', async () => {
    mockSupabase({ admins: [{ user_id: 'user-1', display_name: 'Chefe B', salon_id: 'salao-b' }] });
    const staff = await authenticate('Bearer abc');
    expect(staff).toMatchObject({ userId: 'user-1', role: 'admin', salonId: 'salao-b' });
  });

  it('profissional aprovada do salao-b devolve salonId salao-b', async () => {
    mockSupabase({ professionals: [{ professional_id: 'p1', display_name: 'Ana', salon_id: 'salao-b' }] });
    const staff = await authenticate('Bearer abc');
    expect(staff).toMatchObject({ role: 'profissional', professionalId: 'p1', salonId: 'salao-b' });
  });

  it('os selects pedem a coluna salon_id', async () => {
    const fetchMock = mockSupabase({ admins: [{ user_id: 'user-1', salon_id: 'lev' }] });
    await authenticate('Bearer abc');
    const rest = calledUrls(fetchMock).filter(url => url.includes('/rest/v1/'));
    expect(rest.length).toBeGreaterThan(0);
    rest.forEach(url => expect(url).toMatch(/select=[^&]*salon_id/));
  });

  it.each([undefined, null, '', 'LEV', 'a', 'salão b', 'x'.repeat(41)])(
    'admin com salon_id inválido (%j) é negado',
    async bad => {
      mockSupabase({ admins: [{ user_id: 'user-1', display_name: 'X', salon_id: bad }] });
      expect(await authenticate('Bearer abc')).toBeNull();
    }
  );

  it.each([undefined, null, '', 'Salao B', '../x'])(
    'profissional com salon_id inválido (%j) é negada',
    async bad => {
      mockSupabase({ professionals: [{ professional_id: 'p1', display_name: 'Ana', salon_id: bad }] });
      expect(await authenticate('Bearer abc')).toBeNull();
    }
  );

  it('sem token ou sem vínculo continua negando', async () => {
    mockSupabase({});
    expect(await authenticate(undefined)).toBeNull();
    expect(await authenticate('Bearer abc')).toBeNull();
  });
});
