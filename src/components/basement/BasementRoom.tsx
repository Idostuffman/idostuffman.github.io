"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BasementLabel, BasementObject, BasementRoom as Room } from "@/content/schema";
import { useContent } from "@/content/ContentProvider";
import { useVisitor } from "@/state/visitorStore";
import { collectItemById, renderText } from "@/lib/progression";
import { RichText } from "@/lib/richtext";
import { RealEye } from "@/components/chaos/RealEye";
import { corrupt, pick } from "@/lib/utils";
import { playSound } from "@/lib/sound";

function Label({ label, level }: { label: BasementLabel; level: number }) {
  const router = useRouter();
  const [pos, setPos] = useState({ x: label.x, y: label.y });
  const dodges = useRef(0);
  const text = label.behavior === "corrupt" || level >= 3 ? corrupt(label.text, level >= 3 ? 0.35 : 0.2, label.id.length) : label.text;
  const to = label.behavior === "wrong" && label.really ? label.really : label.to;

  const onEnter = () => {
    if (label.behavior !== "flee" || dodges.current > 5) return;
    dodges.current += 1;
    setPos((p) => ({ x: Math.max(4, Math.min(88, p.x + (Math.random() - 0.5) * 30)), y: Math.max(6, Math.min(88, p.y + (Math.random() - 0.5) * 24)) }));
  };

  const cls = `bm__label bm__label--${label.behavior}`;
  const style = { left: `${pos.x}%`, top: `${pos.y}%` } as React.CSSProperties;
  if (!to) {
    return (
      <span className={cls} style={style} onPointerEnter={onEnter}>
        {text}
      </span>
    );
  }
  if (to.startsWith("/")) {
    return (
      <Link className={cls} style={style} href={to} onPointerEnter={onEnter} onClick={() => playSound("click")}>
        {text}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      style={style}
      onPointerEnter={onEnter}
      onClick={() => {
        playSound("click");
        router.push(`/basement/${to}`);
      }}
    >
      {text}
    </button>
  );
}

function Fixture({ obj, revisit }: { obj: BasementObject; revisit: boolean }) {
  const content = useContent();
  const router = useRouter();
  const state = useVisitor();
  const taken = obj.itemId ? state.run.inventory.includes(obj.itemId) : false;
  const [said, setSaid] = useState("");
  const text = renderText(revisit && obj.later ? obj.later : obj.text, state, content.identity.name);

  const act = () => {
    playSound("click");
    if (obj.itemId && !taken) {
      collectItemById(content, obj.itemId);
      setSaid("taken.");
      return;
    }
    if (obj.to) {
      router.push(obj.to.startsWith("/") ? obj.to : `/basement/${obj.to}`);
      return;
    }
    setSaid(text || "…");
    window.setTimeout(() => setSaid(""), 2600);
  };

  const style = { left: `${obj.x}%`, top: `${obj.y}%`, "--s": obj.size } as React.CSSProperties;
  const inner =
    obj.kind === "chair" ? (
      <span className="bm-chair" aria-hidden="true">
        <span className="bm-chair__back" />
        <span className="bm-chair__seat" />
        <span className="bm-chair__leg bm-chair__leg--a" />
        <span className="bm-chair__leg bm-chair__leg--b" />
      </span>
    ) : obj.kind === "door" ? (
      <span className="bm-door" aria-hidden="true">
        <span className="bm-door__knob" />
      </span>
    ) : obj.kind === "lamp" ? (
      <span className="bm-lamp" aria-hidden="true">
        <span className="bm-lamp__cord" />
        <span className="bm-lamp__bulb" />
      </span>
    ) : obj.kind === "stain" ? (
      <span className="bm-stain" aria-hidden="true" />
    ) : obj.kind === "window" ? (
      <span className="bm-window" aria-hidden="true" />
    ) : obj.kind === "eye" ? (
      <RealEye size={70 * obj.size} blinkEvery={7} />
    ) : obj.kind === "wall-text" ? (
      <span className="bm-wall-text">{text}</span>
    ) : (
      <span className={`bm-thing ${taken ? "bm-thing--taken" : ""}`}>{taken ? "" : "▮"}</span>
    );

  const interactive = obj.kind !== "wall-text" && obj.kind !== "stain" && obj.kind !== "window";
  return (
    <div className={`bm__obj bm__obj--${obj.kind}`} style={style}>
      {interactive ? (
        <button type="button" className="bm__objbtn" onClick={act} aria-label={obj.text || obj.kind}>
          {inner}
        </button>
      ) : (
        inner
      )}
      {said && <span className="bm__said">{said}</span>}
    </div>
  );
}

export function BasementRoom({ slug }: { slug: string }) {
  const content = useContent();
  const room: Room | undefined = slug
    ? content.basement.rooms.find((r) => r.slug === slug)
    : (content.basement.rooms.find((r) => r.level === 1) ?? content.basement.rooms[0]);
  if (!room) return <RoomMissing />;
  return <Room_ room={room} />;
}

function RoomMissing() {
  return (
    <section className="bm bm--none">
      <div className="bm__wall" aria-hidden="true" />
      <div className="bm__floor" aria-hidden="true" />
      <p className="bm__body">there is no room here.</p>
      <Link className="bm__label" style={{ left: "50%", top: "70%" }} href="/basement">
        back
      </Link>
    </section>
  );
}

function Room_({ room }: { room: Room }) {
  const content = useContent();
  const state = useVisitor();
  const enterRoom = useVisitor((s) => s.enterRoom);
  const level = Math.max(1, state.run.basementLevel);
  const visitsBefore = useRef<number | null>(null);
  if (visitsBefore.current === null) visitsBefore.current = state.run.seen[`room:${room.slug}`] ?? 0;
  const revisit = (visitsBefore.current ?? 0) > 0;

  useEffect(() => {
    enterRoom(room.slug, room.level);
  }, [room.slug, room.level, enterRoom]);

  const body = renderText(revisit && room.later ? room.later : room.body, state, content.identity.name);
  const title = room.level >= 3 ? corrupt(room.title, 0.4, 7) : room.title;
  const deepWhispers = content.basement.deepWhispers;
  const whisper = deepWhispers.length ? pick(deepWhispers, `${room.slug}-${state.run.roomsVisited.length}`) : "you were not supposed to come this far";

  return (
    <section className={`bm bm--${room.light} bm--level-${room.level}`} style={room.tint ? ({ "--tint": room.tint } as React.CSSProperties) : undefined} aria-label={room.title || "room"}>
      <div className="bm__wall" aria-hidden="true" />
      <div className="bm__floor" aria-hidden="true" />
      {room.title && <h1 className="bm__title">{title}</h1>}
      {body && <RichText className="bm__body" text={body} />}
      {room.objects.map((o) => (
        <Fixture key={o.id} obj={o} revisit={revisit} />
      ))}
      {room.labels.map((l) => (
        <Label key={l.id} label={l} level={level} />
      ))}
      {room.level >= 3 && (
        <p className="bm__whisper" aria-hidden="true">
          {corrupt(whisper, 0.25, state.run.roomsVisited.length)}
        </p>
      )}
    </section>
  );
}
