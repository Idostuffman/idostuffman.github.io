import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { isAuthenticated } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "Only png, jpg, gif, webp are accepted" }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
  const base = path.basename(file.name, path.extname(file.name)).replace(/[^a-z0-9-]+/gi, "-").slice(0, 40) || "image";
  const name = `${base}-${rand}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), bytes);
  } catch (err) {
    console.error("[admin] upload failed", err);
    return NextResponse.json({ error: "Could not save file. Is public/uploads writable?" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
