"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchRemoteContent, remoteConfigured } from "./remote";
import type { SiteContent } from "./schema";
import { fontVar } from "@/styles/fonts";

type Ctx = { content: SiteContent; setContent: (c: SiteContent) => void };
const ContentContext = createContext<Ctx | null>(null);

function applyTheme(theme: SiteContent["theme"]) {
  const el = document.documentElement;
  el.style.setProperty("--paper", theme.paper);
  el.style.setProperty("--ink", theme.ink);
  el.style.setProperty("--accent", theme.accent);
  el.style.setProperty("--accent2", theme.accent2);
  el.style.setProperty("--accent3", theme.accent3);
  el.style.setProperty("--normal-accent", theme.normalAccent);
  el.style.setProperty("--body-font", fontVar[theme.bodyFont] ?? "var(--font-sans)");
  el.style.setProperty("--heading-font", fontVar[theme.headingFont] ?? "var(--font-display)");
}

export function ContentProvider({ content: initial, children }: { content: SiteContent; children: ReactNode }) {
  const [content, setContent] = useState(initial);

  useEffect(() => {
    if (!remoteConfigured()) return;
    let cancelled = false;
    fetchRemoteContent()
      .then((fresh) => {
        if (cancelled || !fresh) return;
        setContent((prev) => (JSON.stringify(prev) === JSON.stringify(fresh) ? prev : fresh));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyTheme(content.theme);
  }, [content.theme]);

  return <ContentContext.Provider value={{ content, setContent }}>{children}</ContentContext.Provider>;
}

export function useContent(): SiteContent {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used inside <ContentProvider>");
  return ctx.content;
}

export function useSetContent(): (c: SiteContent) => void {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useSetContent must be used inside <ContentProvider>");
  return ctx.setContent;
}

export function useStrings() {
  const content = useContent();
  return (key: string, fallback = ""): string => content.strings[key] ?? fallback;
}
