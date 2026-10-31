// Lembretes pelo número central da LEV foram desativados.
export default async function handler(req: any, res: any) {
 if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
 return res.status(200).json({ automationDisabled: true, sent: 0 });
}
