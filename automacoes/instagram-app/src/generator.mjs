import { brand } from "./brand.mjs";

function fallbackCaption(idea) {
  const specialist = brand.specialists[idea.specialist];
  const expertise = specialist ? ` com ${idea.specialist}, especialista em ${specialist}` : " na LEV";
  return `${idea.title}\n\nCada atendimento é pensado para valorizar sua beleza com cuidado, técnica e atenção aos detalhes${expertise}.\n\nConverse com a nossa equipe e encontre o melhor horário para você. Link na bio.\n\n${brand.hashtags.join(" ")}`;
}

export async function generateCaption(idea, env = process.env) {
  if (!env.OPENAI_API_KEY) return { caption: fallbackCaption(idea), source: "template" };
  const prompt = `Crie uma legenda para Instagram em português do Brasil.\nMarca: ${JSON.stringify(brand)}\nBriefing: ${JSON.stringify(idea)}\nRegras: 90 a 150 palavras; abertura interessante; texto elegante e próximo; CTA para agendar pelo link da bio; no máximo 5 hashtags; não invente preço, disponibilidade, benefício clínico ou serviço. Entregue somente a legenda.`;
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: env.OPENAI_MODEL || "gpt-5.6-luna", input: prompt })
  });
  if (!response.ok) throw new Error(`OpenAI respondeu ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const caption = data.output_text || data.output?.flatMap(item => item.content || []).find(x => x.type === "output_text")?.text;
  if (!caption) throw new Error("A resposta da IA não contém texto.");
  return { caption: caption.trim(), source: "openai" };
}
