import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@/styles/depth.css";
import "@/styles/components.css";
import "@/styles/basement.css";
import { fontClassNames, fontVar } from "@/styles/fonts";
import { getContent } from "@/content/getContent";
import { asset } from "@/lib/asset";
import type { SiteContent } from "@/content/schema";
import { ContentProvider } from "@/content/ContentProvider";
import { SiteShell } from "@/components/layout/SiteShell";


function depthPreloadScript(settings: SiteContent["settings"]): string {
  const guard = "if(!/^\\/(commissions|admin)(\\/|$)/.test(location.pathname))";
  if (settings.persistProgress) {
    return (
      "<script>try{" +
      guard +
      "{var s=JSON.parse(localStorage.getItem('chei-visitor-v2')||'null');var d=s&&s.state&&s.state.depth;if(typeof d==='number'&&d>0){document.documentElement.setAttribute('data-depth',String(Math.min(7,Math.max(0,Math.round(d)))));}}}catch(e){}</script>"
    );
  }
  if (settings.startDepth > 0) {
    return "<script>try{" + guard + "{document.documentElement.setAttribute('data-depth','" + settings.startDepth + "');}}catch(e){}</script>";
  }
  return "";
}

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    title: content.identity.siteTitle,
    description: content.identity.tagline,
    icons: { icon: asset("/icon.svg") },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6efe2",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  const theme = content.theme;
  const themeVars = {
    "--paper": theme.paper,
    "--ink": theme.ink,
    "--accent": theme.accent,
    "--accent2": theme.accent2,
    "--accent3": theme.accent3,
    "--normal-accent": theme.normalAccent,
    "--body-font": fontVar[theme.bodyFont] ?? "var(--font-sans)",
    "--heading-font": fontVar[theme.headingFont] ?? "var(--font-display)",
  } as React.CSSProperties;

  return (
    <html lang="en" className={fontClassNames} style={themeVars} data-depth="0" suppressHydrationWarning>
      <body>
        {}
        <div hidden aria-hidden="true" dangerouslySetInnerHTML={{ __html: depthPreloadScript(content.settings) }} />
        <a href="#main" className="skip-link">
          skip to content
        </a>
        <ContentProvider content={content}>
          <SiteShell>{children}</SiteShell>
        </ContentProvider>
      </body>
    </html>
  );
}
