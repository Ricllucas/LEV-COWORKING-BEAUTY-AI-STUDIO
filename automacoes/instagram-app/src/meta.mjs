const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function graph(path, body, env) {
  const version = env.META_API_VERSION || "v23.0";
  const params = new URLSearchParams({ ...body, access_token: env.META_ACCESS_TOKEN });
  const response = await fetch(`https://graph.facebook.com/${version}/${path}`, { method: "POST", body: params });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || `Meta respondeu ${response.status}`);
  return data;
}

export async function publishToInstagram(post, env = process.env) {
  if (String(env.DRY_RUN).toLowerCase() !== "false") return { mediaId: `dry-run-${Date.now()}`, dryRun: true };
  if (!env.META_ACCESS_TOKEN || !env.INSTAGRAM_ACCOUNT_ID) throw new Error("Credenciais da Meta não configuradas.");
  if (!post.mediaUrl) throw new Error("Informe uma URL pública da mídia antes de publicar.");
  const isReel = post.format === "reel";
  const container = await graph(`${env.INSTAGRAM_ACCOUNT_ID}/media`, {
    caption: post.caption,
    ...(isReel ? { media_type: "REELS", video_url: post.mediaUrl } : { image_url: post.mediaUrl })
  }, env);
  if (isReel) await sleep(15000);
  const published = await graph(`${env.INSTAGRAM_ACCOUNT_ID}/media_publish`, { creation_id: container.id }, env);
  return { mediaId: published.id, containerId: container.id, dryRun: false };
}
