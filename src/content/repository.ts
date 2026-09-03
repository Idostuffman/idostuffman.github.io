import { promises as fs } from "node:fs";
import path from "node:path";
import { parseContent, type SiteContent } from "./schema";

export interface ContentRepository {
  load(): Promise<SiteContent>;
  save(content: SiteContent): Promise<void>;
}

export class FileContentRepository implements ContentRepository {
  private readonly file: string;
  private cache: { mtimeMs: number; content: SiteContent } | null = null;

  constructor(file?: string) {
    this.file = file ?? process.env.CONTENT_FILE ?? path.join(process.cwd(), "content", "site.json");
  }

  async load(): Promise<SiteContent> {
    try {
      const stat = await fs.stat(this.file);
      if (this.cache && this.cache.mtimeMs === stat.mtimeMs) return this.cache.content;
      const raw = await fs.readFile(this.file, "utf8");
      const content = parseContent(JSON.parse(raw));
      this.cache = { mtimeMs: stat.mtimeMs, content };
      return content;
    } catch (err) {
      console.error(`[content] failed to load ${this.file}:`, err);
      return parseContent({});
    }
  }

  async save(content: SiteContent): Promise<void> {
    const validated = parseContent(content);
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(validated, null, 2), "utf8");
    await fs.rename(tmp, this.file);
    this.cache = null;
  }
}

let repo: ContentRepository | null = null;

export function getRepository(): ContentRepository {
  if (!repo) repo = new FileContentRepository();
  return repo;
}
