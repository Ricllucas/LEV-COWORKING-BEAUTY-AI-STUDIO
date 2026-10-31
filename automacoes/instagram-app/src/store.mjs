import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export class JsonStore {
  constructor(path) { this.path = path; this.queue = Promise.resolve(); }

  async init(seed = []) {
    await mkdir(dirname(this.path), { recursive: true });
    try { await readFile(this.path, "utf8"); }
    catch { await this.write(seed); }
  }

  async read() {
    return JSON.parse(await readFile(this.path, "utf8"));
  }

  async write(value) {
    const temp = `${this.path}.tmp`;
    await writeFile(temp, JSON.stringify(value, null, 2), "utf8");
    await rename(temp, this.path);
  }

  update(mutator) {
    this.queue = this.queue.then(async () => {
      const data = await this.read();
      const result = await mutator(data);
      await this.write(data);
      return result;
    });
    return this.queue;
  }
}
