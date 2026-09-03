"use client";

import type { SiteContent } from "@/content/schema";
import { remoteConfigured, saveRemoteContent, uploadRemoteImage } from "@/content/remote";

export const usingSupabase = remoteConfigured;

export async function saveContent(content: SiteContent): Promise<{ ok: true; content?: SiteContent } | { ok: false; error: string; issues?: string[] }> {
  if (remoteConfigured()) {
    try {
      await saveRemoteContent(content);
      return { ok: true, content };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "save failed" };
    }
  }
  try {
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(content),
    });
    const data = (await res.json()) as { error?: string; issues?: string[]; content?: SiteContent };
    if (!res.ok) return { ok: false, error: data.error ?? "save failed", issues: data.issues };
    return { ok: true, content: data.content };
  } catch {
    return { ok: false, error: "network error" };
  }
}

export async function uploadImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (remoteConfigured()) {
    try {
      return { ok: true, url: await uploadRemoteImage(file) };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "upload failed" };
    }
  }
  const fd = new FormData();
  fd.append("file", file);
  try {
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok || !data.url) return { ok: false, error: data.error ?? "upload failed" };
    return { ok: true, url: data.url };
  } catch {
    return { ok: false, error: "upload failed" };
  }
}

export async function signOut(): Promise<void> {
  if (remoteConfigured()) {
    const { supabase } = await import("@/lib/supabase");
    await supabase().auth.signOut();
    window.location.href = "/admin";
    return;
  }
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.href = "/admin/login";
}
