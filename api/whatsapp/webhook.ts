// A integração permanece inativa: eventos não criam reservas nem enviam mensagens.
export default async function handler(req: any, res: any) {
 if (req.method === 'GET') {
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (token && req.query?.['hub.mode'] === 'subscribe' && req.query?.['hub.verify_token'] === token) return res.status(200).send(req.query['hub.challenge']);
  return res.status(403).send('Token de verificação inválido.');
 }
 if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
 return res.status(200).json({ received: true, automationDisabled: true });
}
