"use client";

import Link from "next/link";
import { useState } from "react";
import { useContent, useStrings } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { useInteractionTarget } from "@/interactions/useInteractionTarget";
import { useOverrideImage, Gated, Revealable, OverrideText } from "@/components/chaos/Gated";
import { Sticker } from "@/components/chaos/Sticker";
import { DraggableWindow } from "@/components/chaos/DraggableWindow";
import { GlitchText } from "@/components/chaos/Glitch";
import { RealEye } from "@/components/chaos/RealEye";
import { RichText } from "@/lib/richtext";
import { playSound } from "@/lib/sound";
import { useIsMobile, useMounted } from "@/lib/utils";
import { asset } from "@/lib/asset";

function Avatar() {
  const content = useContent();
  const { props, count } = useInteractionTarget("home-avatar");
  const depth = useVisitor((s) => s.depth);
  const src = useOverrideImage("home-avatar", content.identity.avatar);
  const [wobble, setWobble] = useState(0);
  const labels = ["me", "me?", "still me", "a picture of me", "who", "me", "..."];
  return (
    <button
      type="button"
      className="home__avatar"
      style={{ transform: `rotate(${3 + (wobble % 3) * 4 - depth}deg)` }}
      aria-label={`${content.identity.name}'s avatar. it reacts when clicked.`}
      {...props}
      onClick={() => {
        props.onClick?.();
        setWobble((w) => w + 1);
        playSound("pop");
      }}
    >
      {}
      <span className="home__avatar-frame">
        {}
        <img src={asset(src)} alt="" />
      </span>
      <span className="note note--pink home__avatar-label" aria-hidden="true">
        {labels[Math.min(labels.length - 1, count)]}
      </span>
    </button>
  );
}

function DeadButton() {
  const t = useStrings();
  const { props, count } = useInteractionTarget("dead-button");
  const { revealed } = useVisitorReveal("dead-button-reveal");
  const labels = [t("home.deadButton", "do not press"), "no", "stop", "why", "please", "..."];
  return (
    <>
      <button type="button" className="btn btn--ghost dead-button" {...props} onClick={() => { props.onClick?.(); playSound("click"); }}>
        {revealed ? "it worked" : labels[Math.min(labels.length - 1, count)]}
      </button>
      <Revealable id="dead-button-reveal">
        <p className="note note--paper appear" style={{ maxWidth: "20rem" }}>
          <OverrideText id="dead-button-reveal">{t("home.deadButtonReveal", "you pressed it.")}</OverrideText>
        </p>
      </Revealable>
    </>
  );
}

function useVisitorReveal(id: string) {
  const revealed = useVisitor((s) => s.revealed.includes(id));
  return { revealed };
}

export function HomePage() {
  const content = useContent();
  const t = useStrings();
  const depth = useVisitor((s) => s.depth);
  const homeChanged = useVisitor((s) => !!s.flags["home-changed"]);
  const discovered = useVisitor((s) => s.discoveredSecrets.length);
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const { identity } = content;

  const stickers = content.stickers.filter((s) => !(isMobile && s.hideOnMobile));

  return (
    <div className="page home">
      <div className="home__stickers" aria-label="stickers">
        {mounted && stickers.map((s) => <Sticker key={s.id} data={s} />)}
      </div>

      <section className="home__hero">
        <div>
          <p className="home__name">
            <GlitchText text={`${identity.name} ${identity.username}`} />
            {identity.pronouns && <span className="mono tiny"> · {identity.pronouns}</span>}
          </p>
          <h1 className="home__welcome hand">{depth >= 4 ? identity.welcome.replace(/welcome/i, "welcome back") : identity.welcome}</h1>
          <p className="home__tagline">{identity.tagline}</p>
          <div className="home__row">
            <Link href="/about" className="btn btn--accent" style={{ "--r": "-2deg" } as React.CSSProperties}>
              {t("nav.about", "about me")} →
            </Link>
            <Link href="/art" className="btn" style={{ "--r": "1.5deg" } as React.CSSProperties}>
              {t("nav.art", "art")}
            </Link>
            <Link href="/games" className="btn btn--pixel" style={{ "--r": "-1deg" } as React.CSSProperties}>
              {t("nav.games", "game room")}
            </Link>
            <DeadButton />
          </div>
          <RichText className="home__intro" text={t("home.intro", "")} />
          <ul className="home__socials" aria-label="links">
            {content.socials.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.icon} {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Avatar />
      </section>

      <section className="home__windows" aria-label="notes">
        <DraggableWindow title="readme.txt">
          <RichText text={content.bio.short} />
          <Link href="/about" className="hand" style={{ fontSize: "1.3rem" }}>
            (the long version is a staircase)
          </Link>
        </DraggableWindow>
        <DraggableWindow title={depth >= 3 ? "currently.exe" : "currently"}>
          <ul className="hand" style={{ fontSize: "1.25rem", lineHeight: 1.3 }}>
            {content.interests.slice(0, 3).map((i) => (
              <li key={i.id}>{i.title}</li>
            ))}
            <li>
              <Link href="/games" className="hidden-link">
                losing at small games
              </Link>
            </li>
          </ul>
        </DraggableWindow>
        <DraggableWindow title={depth >= 2 ? "commissions (safe)" : "commissions"}>
          <p>
            {content.commissions.status === "open" ? "open!" : content.commissions.status === "limited" ? "limited slots" : "closed right now"}{" "}
            <Link href="/commissions" className="btn btn--blue" style={{ "--r": "2deg", fontSize: "0.7rem" } as React.CSSProperties}>
              see the normal page
            </Link>
          </p>
          <p className="mono tiny">this window is the only professional thing on this page.</p>
        </DraggableWindow>
        <Gated min={2}>
          <DraggableWindow title="untitled-2" style={{ background: "#fff9c9" }}>
            <p className="hand" style={{ fontSize: "1.3rem" }}>
              you found {discovered} secret{discovered === 1 ? "" : "s"}. that is {discovered < 3 ? "not many." : discovered < 6 ? "some." : "a lot. maybe too many."}
            </p>
            <p className="mono tiny">
              <Link href="/secrets/nothing">there is nothing here</Link>
            </p>
          </DraggableWindow>
        </Gated>
        <Gated min={4}>
          <DraggableWindow title="?">
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <RealEye size={90} blinkEvery={5} />
              <p className="mono tiny">
                <OverrideText id="face-note">this was always here. you just didn&apos;t look.</OverrideText>
              </p>
            </div>
          </DraggableWindow>
        </Gated>
      </section>

      {homeChanged && (
        <p className="hand appear" style={{ fontSize: "1.4rem", opacity: 0.8 }}>
          (the page rearranged itself while you were away. it does that.)
        </p>
      )}

      <div className="home__filler" aria-hidden="true">
        {depth >= 1 ? "keep scrolling" : "there's nothing down here"}
      </div>

      {}
      {mounted && (
        <>
          <Link href="/about" className="home__tinytext" style={{ left: "4%", top: "46%" }}>
            i am not finished
          </Link>
          <Link href="/secrets/nothing" className="home__tinytext" style={{ right: "6%", top: "92%" }}>
            nothing
          </Link>
          <Gated min={3}>
            <Link href="/door" className="home__tinytext" style={{ left: "50%", top: "97%" }}>
              ↓ basement ↓
            </Link>
          </Gated>
        </>
      )}

      <footer className="home__footer">
        <p>{t("home.footer", "")}</p>
        <Revealable id="footer-secret">
          <p className="home__footer-secret appear">
            <Link href="/door">{t("home.footerSecret", "")}</Link>
          </p>
        </Revealable>
        <div style={{ height: "30vh" }} aria-hidden="true" />
      </footer>
    </div>
  );
}
