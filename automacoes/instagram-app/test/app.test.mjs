import test from "node:test";
import assert from "node:assert/strict";
import { generateCaption } from "../src/generator.mjs";
import { publishToInstagram } from "../src/meta.mjs";

test("gera legenda local sem credencial", async () => {
  const result = await generateCaption({ title: "Spa dos pés", specialist: "Elisangela" }, {});
  assert.equal(result.source, "template");
  assert.match(result.caption, /Spa dos pés/);
  assert.match(result.caption, /Elisangela/);
});

test("publicação permanece simulada por padrão", async () => {
  const result = await publishToInstagram({ caption: "Teste", format: "image" }, {});
  assert.equal(result.dryRun, true);
  assert.match(result.mediaId, /^dry-run-/);
});
