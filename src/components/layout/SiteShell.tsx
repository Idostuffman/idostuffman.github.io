"use client";

import { usePathname } from "next/navigation";
import { InteractionProvider } from "@/interactions/InteractionProvider";
import { BackgroundText } from "./BackgroundText";
import { Nav } from "./Nav";
import { Eyes } from "./Eyes";
import { CustomCursor } from "./CustomCursor";
import { Messages } from "./Messages";
import { SpawnedObjects } from "./SpawnedObjects";
import { PageCorner } from "./PageCorner";
import { WhisperLayer } from "./WhisperLayer";
import { PocketButton } from "@/components/inventory/Pocket";

const NORMAL_PREFIXES = ["/commissions", "/admin"];
const BARE_PREFIXES = ["/basement", "/void", "/door"];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const normal = NORMAL_PREFIXES.some((p) => pathname.startsWith(p));
  const bare = BARE_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <InteractionProvider>
      {!normal && !bare && <BackgroundText />}
      {!normal && !bare && <Nav />}
      <main id="main" className={normal ? "normal-site" : undefined}>
        {children}
      </main>
      {!normal && <Messages />}
      {!normal && !bare && <Eyes />}
      {!normal && !bare && <SpawnedObjects />}
      {!normal && !bare && <PageCorner />}
      {!normal && !bare && <WhisperLayer />}
      {!normal && !bare && <PocketButton />}
      {!normal && !bare && <CustomCursor />}
    </InteractionProvider>
  );
}
