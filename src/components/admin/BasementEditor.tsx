"use client";

import type { SiteContent } from "@/content/schema";
import { Area, ListEditor, Num, Select, Text, newId } from "./fields";

type Props = { content: SiteContent; patch: (mutate: (c: SiteContent) => void) => void };

const LABEL_BEHAVIOURS = ["normal", "flee", "flicker", "wrong", "corrupt"] as const;
const OBJECT_KINDS = ["chair", "door", "lamp", "wall-text", "stain", "window", "eye", "object"] as const;
const LIGHTS = ["lamp", "dim", "none", "flicker"] as const;

export function BasementEditor({ content, patch }: Props) {
  const b = content.basement;
  return (
    <section>
      <div className="admin__help">
        Rooms are reached by slug (/basement/&lt;slug&gt;); the level-1 room is /basement itself. Labels are the navigation: “to” is a room slug or a
        site path; “wrong” labels go to “really” instead. Level 2 rooms need the hall; level 3 needs a level-2 room first. Text supports the same
        placeholders as items. Positions are percentages.
      </div>
      <div className="admin__grid">
        <Text label="tab title while inside" value={b.title} onChange={(v) => patch((c) => (c.basement.title = v))} />
        <Num label="film grain (0–1)" value={b.noise} min={0} max={1} step={0.05} onChange={(v) => patch((c) => (c.basement.noise = v))} />
        <Num label="eyes: max visible at once" value={b.eyes.maxVisible} min={0} max={12} onChange={(v) => patch((c) => (c.basement.eyes.maxVisible = v))} />
        <Num label="eyes: chance one follows the cursor (0–1)" value={b.eyes.followChance} min={0} max={1} step={0.05} onChange={(v) => patch((c) => (c.basement.eyes.followChance = v))} />
        <Num label="eyes: chance of a split-second flash (0–1)" value={b.eyes.flashChance} min={0} max={1} step={0.05} onChange={(v) => patch((c) => (c.basement.eyes.flashChance = v))} />
        <Num label="eyes: chance to glance around per second (0–1)" value={b.eyes.lookChance} min={0} max={1} step={0.05} onChange={(v) => patch((c) => (c.basement.eyes.lookChance = v))} />
        <Num label="eyes: vanish when the pointer is within (px)" value={b.eyes.hideRadius} min={0} max={600} onChange={(v) => patch((c) => (c.basement.eyes.hideRadius = v))} />
        {b.eyes.intervals.map((iv, i) => (
          <div key={i} className="admin__grid" style={{ gridColumn: "1 / -1" }}>
            <Num label={`level ${i + 1}: seconds between eyes (min)`} value={iv.min} min={1} max={600} onChange={(v) => patch((c) => (c.basement.eyes.intervals[i].min = v))} />
            <Num label={`level ${i + 1}: seconds between eyes (max)`} value={iv.max} min={1} max={600} onChange={(v) => patch((c) => (c.basement.eyes.intervals[i].max = v))} />
          </div>
        ))}
      </div>

      <h2>Rooms</h2>
      <ListEditor
        items={b.rooms}
        onChange={(v) => patch((c) => (c.basement.rooms = v))}
        title={(r) => `${r.slug} (level ${r.level})${r.title ? " — " + r.title : ""}`}
        addLabel="room"
        make={() => ({ id: newId("room"), slug: `room-${Date.now().toString(36)}`, title: "", level: 2, body: "", later: "", labels: [], objects: [], light: "lamp" as const, tint: "" })}
        render={(r, update) => (
          <>
            <div className="admin__grid">
              <Text label="slug" value={r.slug} onChange={(v) => update({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
              <Text label="title" value={r.title} onChange={(v) => update({ title: v })} />
              <Num label="level (1–3)" value={r.level} min={1} max={3} onChange={(v) => update({ level: v })} />
              <Select label="light" value={r.light} options={LIGHTS} onChange={(v) => update({ light: v })} />
              <Text label="tint (css colour, optional)" value={r.tint} onChange={(v) => update({ tint: v })} />
            </div>
            <Area label="body (first visit)" value={r.body} onChange={(v) => update({ body: v })} rows={3} />
            <Area label="body (return visits)" value={r.later} onChange={(v) => update({ later: v })} rows={2} />
            <details>
              <summary>labels ({r.labels.length})</summary>
              <ListEditor
                items={r.labels}
                onChange={(v) => update({ labels: v })}
                title={(l) => `${l.text} → ${l.to || "(nowhere)"}`}
                addLabel="label"
                make={() => ({ id: newId("lb"), text: "why", to: "", x: 50, y: 50, behavior: "normal" as const })}
                render={(l, up) => (
                  <div className="admin__grid">
                    <Text label="text" value={l.text} onChange={(v) => up({ text: v })} />
                    <Text label="to (room slug or /path)" value={l.to} onChange={(v) => up({ to: v })} />
                    <Select label="behaviour" value={l.behavior} options={LABEL_BEHAVIOURS} onChange={(v) => up({ behavior: v })} />
                    <Text label="really goes to (for wrong)" value={l.really ?? ""} onChange={(v) => up({ really: v || undefined })} />
                    <Num label="x %" value={l.x} min={0} max={100} onChange={(v) => up({ x: v })} />
                    <Num label="y %" value={l.y} min={0} max={100} onChange={(v) => up({ y: v })} />
                  </div>
                )}
              />
            </details>
            <details>
              <summary>fixtures ({r.objects.length})</summary>
              <ListEditor
                items={r.objects}
                onChange={(v) => update({ objects: v })}
                title={(o) => `${o.kind}${o.text ? ": " + o.text.slice(0, 30) : ""}`}
                addLabel="fixture"
                make={() => ({ id: newId("ob"), kind: "object" as const, text: "", later: "", x: 50, y: 60, size: 1 })}
                render={(o, up) => (
                  <>
                    <div className="admin__grid">
                      <Select label="kind" value={o.kind} options={OBJECT_KINDS} onChange={(v) => up({ kind: v })} />
                      <Num label="x %" value={o.x} min={0} max={100} onChange={(v) => up({ x: v })} />
                      <Num label="y %" value={o.y} min={0} max={100} onChange={(v) => up({ y: v })} />
                      <Num label="size" value={o.size} min={0.3} max={4} step={0.1} onChange={(v) => up({ size: v })} />
                      <Text label="gives item id (optional)" value={o.itemId ?? ""} onChange={(v) => up({ itemId: v || undefined })} />
                      <Text label="leads to (room slug or /path, optional)" value={o.to ?? ""} onChange={(v) => up({ to: v || undefined })} />
                    </div>
                    <Area label="text (wall-text shows it; others say it when clicked)" value={o.text} onChange={(v) => up({ text: v })} rows={2} />
                    <Text label="text on return visits" value={o.later} onChange={(v) => up({ later: v })} />
                  </>
                )}
              />
            </details>
          </>
        )}
      />
    </section>
  );
}
