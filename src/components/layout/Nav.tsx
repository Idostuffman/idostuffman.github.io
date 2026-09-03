"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContent, useStrings } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { useInteractionTarget } from "@/interactions/useInteractionTarget";
import { SoundToggle } from "./SoundToggle";
import { GlitchText } from "@/components/chaos/Glitch";
import { playSound } from "@/lib/sound";

const LIARS: Record<string, string[]> = {
  "/about": ["about me", "about you", "about us", "who?"],
  "/art": ["art", "art?", "pictures", "evidence"],
  "/games": ["game room", "the room", "play", "lose"],
};

export function Nav() {
  const content = useContent();
  const t = useStrings();
  const pathname = usePathname();
  const depth = useVisitor((s) => s.depth);
  const { props: logoProps, count: logoClicks } = useInteractionTarget("site-logo");

  const label = (path: string, base: string) => {
    if (depth < 3) return base;
    const options = LIARS[path];
    if (!options) return base;
    return options[Math.min(options.length - 1, depth - 2)] ?? base;
  };

  const items = [
    { href: "/about", label: label("/about", t("nav.about", "about me")), r: -3 },
    { href: "/art", label: label("/art", t("nav.art", "art")), r: 2 },
    { href: "/games", label: label("/games", t("nav.games", "game room")), r: -1 },
    { href: "/commissions", label: label("/commissions", t("nav.commissions", "commissions")), r: 3, normal: true },
  ];

  return (
    <nav className="nav" aria-label="main">
      <Link
        href="/"
        className="nav__logo hand"
        {...logoProps}
        onClick={(e) => {
          logoProps.onClick?.();
          playSound("click");
          if (logoClicks > 0 && logoClicks < 5) e.preventDefault();
        }}
        aria-label={`${content.identity.name} — home`}
      >
        <GlitchText text={content.identity.name} />
        <span className="nav__logo-hint tiny mono" aria-hidden="true">
          {logoClicks > 0 && logoClicks < 5 ? ".".repeat(logoClicks) : ""}
        </span>
      </Link>
      <ul className="nav__list">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className={`btn ${it.normal ? "btn--blue" : ""} ${pathname === it.href ? "btn--active" : ""}`}
              style={{ "--r": `${it.r}deg` } as React.CSSProperties}
              aria-current={pathname === it.href ? "page" : undefined}
              onClick={() => playSound("click")}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
      <SoundToggle className="nav__sound" />
    </nav>
  );
}
