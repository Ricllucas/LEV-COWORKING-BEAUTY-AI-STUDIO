export default async function handler(_req: any, res: any) {
 return res.status(410).json({ error: 'Automação WhatsApp da LEV desativada. Fale diretamente com a profissional responsável.' });
}
