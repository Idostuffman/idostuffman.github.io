export function asset(src: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!base || !src.startsWith("/") || src.startsWith("//") || src.startsWith(base + "/")) return src;
  return `${base}${src}`;
}
