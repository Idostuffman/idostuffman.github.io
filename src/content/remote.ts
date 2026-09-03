import { parseContent, type SiteContent } from "./schema";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const remoteConfigured = () => !!url() && !!anon();

const TABLE = "site_content";
const ROW = "main";

const cacheMode = (): RequestCache =>
  typeof window === "undefined" && process.env.STATIC_EXPORT === "1" ? "force-cache" : "no-store";

export async function fetchRemoteContent(): Promise<SiteContent | null> {
  if (!remoteConfigured()) return null;
  try {
    const res = await fetch(`${url()}/rest/v1/${TABLE}?id=eq.${ROW}&select=data`, {
      headers: { apikey: anon(), Authorization: `Bearer ${anon()}` },
      cache: cacheMode(),
    });
    if (!res.ok) {
      console.error("[content] supabase read failed", res.status, await res.text());
      return null;
    }
    const rows = (await res.json()) as { data: unknown }[];
    if (!rows.length) return null;
    return parseContent(rows[0].data);
  } catch (err) {
    console.error("[content] supabase read failed", err);
    return null;
  }
}

function explainWriteFailure(message: string, what: "save" | "upload"): string {
  if (!/row-level security/i.test(message)) return message;
  if (what === "upload") {
    return "Supabase refused the upload. The “uploads” bucket is missing its storage policies — step 3 of SUPABASE.md.";
  }
  if (message.includes("USING expression")) {
    return "Supabase allowed the first save but refuses this one: the table has no UPDATE policy. See “Save worked once, now it fails” in SUPABASE.md for the SQL that fixes it.";
  }
  return "Supabase refused the write. Either the session expired (log out and back in), or the policies in step 2 of SUPABASE.md were never run.";
}

export async function saveRemoteContent(content: SiteContent): Promise<void> {
  const { supabase, CONTENT_TABLE, CONTENT_ROW_ID } = await import("@/lib/supabase");
  const validated = parseContent(content);
  const { error } = await supabase()
    .from(CONTENT_TABLE)
    .upsert({ id: CONTENT_ROW_ID, data: validated, updated_at: new Date().toISOString() });
  if (error) throw new Error(explainWriteFailure(error.message, "save"));
}

export async function uploadRemoteImage(file: File): Promise<string> {
  const { supabase, UPLOAD_BUCKET } = await import("@/lib/supabase");
  const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-]+/gi, "-").slice(0, 40) || "image";
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");
  const name = `${base}-${rand}.${ext}`;
  const client = supabase();
  const { error } = await client.storage.from(UPLOAD_BUCKET).upload(name, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(explainWriteFailure(error.message, "upload"));
  return client.storage.from(UPLOAD_BUCKET).getPublicUrl(name).data.publicUrl;
}
