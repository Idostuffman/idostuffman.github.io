import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getRepository } from "@/content/repository";
import { safeParseContent } from "@/content/schema";

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await getRepository().load());
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const parsed = safeParseContent(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 20).map((i) => `${i.path.join(".")}: ${i.message}`);
    return NextResponse.json({ error: "Content failed validation", issues }, { status: 422 });
  }
  try {
    await getRepository().save(parsed.data);
  } catch (err) {
    console.error("[admin] save failed", err);
    return NextResponse.json({ error: "Could not write content. Is the content directory writable?" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, content: parsed.data });
}
