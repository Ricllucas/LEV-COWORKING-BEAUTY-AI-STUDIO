import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { JsonStore } from "./store.mjs";
import { generateCaption } from "./generator.mjs";
import { publishToInstagram } from "./meta.mjs";
import { seedIdeas } from "./brand.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const store = new JsonStore(join(root, "data", "posts.json"));
const port = Number(process.env.PORT || 3000);
const html = await readFile(join(root, "public", "index.html"), "utf8");
await store.init([]);

function send(res, status, payload, type = "application/json") {
  res.writeHead(status, { "Content-Type": `${type}; charset=utf-8`, "Cache-Control": "no-store" });
  res.end(type === "application/json" ? JSON.stringify(payload) : payload);
}
async function body(req) {
  let raw = "";
  for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw new Error("Requisição muito grande."); }
  return raw ? JSON.parse(raw) : {};
}
function authorized(req) {
  return !process.env.ADMIN_TOKEN || req.headers.authorization === `Bearer ${process.env.ADMIN_TOKEN}`;
}

async function publish(id) {
  const post = (await store.read()).find(item => item.id === id);
  if (!post) throw new Error("Conteúdo não encontrado.");
  if (!post.approvedAt) throw new Error("O conteúdo precisa ser aprovado antes da publicação.");
  if (post.status === "published") return post;
  try {
    const result = await publishToInstagram(post);
    await store.update(items => Object.assign(items.find(x => x.id === id), { status: "published", publishedAt: new Date().toISOString(), metaMediaId: result.mediaId, dryRun: result.dryRun, error: null }));
  } catch (error) {
    await store.update(items => Object.assign(items.find(x => x.id === id), { status: "error", error: error.message }));
    throw error;
  }
  return (await store.read()).find(x => x.id === id);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "GET" && url.pathname === "/") return send(res, 200, html, "text/html");
    if (req.method === "GET" && url.pathname === "/api/health") return send(res, 200, { ok: true, dryRun: String(process.env.DRY_RUN).toLowerCase() !== "false" });
    if (req.method === "GET" && url.pathname === "/api/posts") return send(res, 200, await store.read());
    if (!authorized(req)) return send(res, 401, { error: "Não autorizado." });
    if (req.method === "POST" && url.pathname === "/api/seed") {
      const created = [];
      for (const idea of seedIdeas) {
        const generated = await generateCaption(idea);
        created.push({ id: randomUUID(), ...idea, ...generated, mediaUrl: "", scheduledAt: null, approvedAt: null, status: "draft", createdAt: new Date().toISOString() });
      }
      await store.update(posts => posts.push(...created));
      return send(res, 201, created);
    }
    if (req.method === "POST" && url.pathname === "/api/posts") {
      const input = await body(req);
      if (!input.title || !input.format) return send(res, 400, { error: "Título e formato são obrigatórios." });
      const generated = input.caption ? { caption: input.caption, source: "manual" } : await generateCaption(input);
      const post = { id: randomUUID(), pillar: input.pillar || "conteúdo", specialist: input.specialist || "LEV", title: input.title, format: input.format, mediaUrl: input.mediaUrl || "", scheduledAt: input.scheduledAt || null, approvedAt: null, status: "draft", createdAt: new Date().toISOString(), ...generated };
      await store.update(posts => posts.push(post));
      return send(res, 201, post);
    }
    const match = url.pathname.match(/^\/api\/posts\/([^/]+)\/(approve|schedule|publish)$/);
    if (req.method === "POST" && match) {
      const [, id, action] = match;
      if (action === "publish") return send(res, 200, await publish(id));
      const input = await body(req);
      const updated = await store.update(posts => {
        const post = posts.find(item => item.id === id);
        if (!post) return null;
        if (action === "approve") Object.assign(post, { approvedAt: new Date().toISOString(), status: post.scheduledAt ? "scheduled" : "approved" });
        if (action === "schedule") {
          if (!input.scheduledAt || Number.isNaN(Date.parse(input.scheduledAt))) throw new Error("Data de agendamento inválida.");
          Object.assign(post, { scheduledAt: new Date(input.scheduledAt).toISOString(), status: post.approvedAt ? "scheduled" : "draft" });
        }
        return post;
      });
      return updated ? send(res, 200, updated) : send(res, 404, { error: "Conteúdo não encontrado." });
    }
    return send(res, 404, { error: "Rota não encontrada." });
  } catch (error) { return send(res, 500, { error: error.message }); }
});

async function runScheduler() {
  const due = (await store.read()).filter(post => post.status === "scheduled" && Date.parse(post.scheduledAt) <= Date.now());
  for (const post of due) await publish(post.id).catch(error => console.error(`[scheduler] ${post.id}:`, error.message));
}
if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => console.log(`LEV Automação: http://localhost:${port} (DRY_RUN=${process.env.DRY_RUN !== "false"})`));
  setInterval(runScheduler, 30_000).unref();
}
export { server, publish };
