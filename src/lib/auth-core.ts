export const COOKIE_NAME = "chei_admin";
export const SESSION_HOURS = 12;

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  const g = globalThis as any;
  if (!g.__cheiSessionSecret) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    g.__cheiSessionSecret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return g.__cheiSessionSecret as string;
}

export async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now() || !sig) return false;
  return timingSafeEqual(sig, await hmac(`session:${exp}`));
}
