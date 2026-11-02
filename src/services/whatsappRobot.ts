import { authorizedFetch } from './cloudClients';

// Robô de WhatsApp da LEV: status para a equipe e envio de teste pela administração.
export const WhatsAppRobotService = {
  async isAutomatic(): Promise<boolean> {
    const response = await authorizedFetch('/api/whatsapp/send', { cache: 'no-store' });
    if (!response.ok) return false;
    const result = await response.json().catch(() => ({})) as { automatic?: boolean };
    return Boolean(result.automatic);
  },

  async sendTest(phone: string): Promise<void> {
    const response = await authorizedFetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) throw new Error(result.error || 'Não foi possível enviar o teste.');
  }
};
