"use client";

import type { SiteContent } from "@/content/schema";
import { Area, Check, ImageField, Lines, ListEditor, Num, Select, Text, newId } from "./fields";

type Props = { content: SiteContent; patch: (mutate: (c: SiteContent) => void) => void };

const GAMES = ["reaction", "memory", "clicker", "hideseek", "impossible", "crossing"] as const;
const REQ_TYPES = ["wins", "score", "clicks", "crossings", "dodges", "item"] as const;
const ITEM_GAMES = ["hideseek", "crossing", "impossible", "clicker", "reaction", "memory", "basement", "none"] as const;
const UNDER = ["dirt", "rock", "bush"] as const;
const BEHAVIOURS = ["static", "twitch", "watch", "vanish", "changed"] as const;
const RARITY = ["common", "uncommon", "rare", "???"] as const;

export function ProgressionEditor({ content, patch }: Props) {
  const p = content.progression;
  const areaIds = p.hideSeek.areas.map((a) => a.id);
  return (
    <section>
      <div className="admin__help">
        The hidden RPG. Fragments are earned in games (their requirement is checked every time a game reports a result or a score). Items are found in
        hide &amp; seek (fixed area + cell + cover), granted by games (requirement), or picked up in the basement. Text supports [found], [rocks],
        [fragments], [visits], [moves], [name]. Full reference: EASTER_EGGS.md.
      </div>

      <h2>Key</h2>
      <div className="admin__grid">
        <Num label="fragments required to assemble the key (0 = all)" value={p.requiredFragments} min={0} max={20} onChange={(v) => patch((c) => (c.progression.requiredFragments = v))} />
        <Text label="message: fragment found" value={p.messages.fragmentFound} onChange={(v) => patch((c) => (c.progression.messages.fragmentFound = v))} />
        <Text label="message: all fragments" value={p.messages.allFragments} onChange={(v) => patch((c) => (c.progression.messages.allFragments = v))} />
        <Text label="message: item found" value={p.messages.itemFound} onChange={(v) => patch((c) => (c.progression.messages.itemFound = v))} />
        <Text label="pocket hint (before any fragment)" value={p.messages.pocketHint} onChange={(v) => patch((c) => (c.progression.messages.pocketHint = v))} />
      </div>
      <Area label="back of the note (shown with the code)" value={p.messages.noteBack} onChange={(v) => patch((c) => (c.progression.messages.noteBack = v))} rows={2} />

      <h2>Key fragments</h2>
      <ListEditor
        items={p.fragments}
        onChange={(v) => patch((c) => (c.progression.fragments = v))}
        title={(f) => `${f.name} — ${f.game}: ${f.requirement.type} ${f.requirement.type === "item" ? f.requirement.itemId ?? "" : f.requirement.value}`}
        addLabel="fragment"
        make={() => ({ id: newId("frag"), name: "a piece", description: "", game: "reaction" as const, requirement: { type: "wins" as const, value: 1 }, location: "", hint: "" })}
        render={(f, update) => (
          <>
            <div className="admin__grid">
              <Text label="id" value={f.id} onChange={(v) => update({ id: v })} />
              <Text label="name" value={f.name} onChange={(v) => update({ name: v })} />
              <Select label="game" value={f.game} options={GAMES} onChange={(v) => update({ game: v })} />
              <Select label="requirement" value={f.requirement.type} options={REQ_TYPES} onChange={(v) => update({ requirement: { ...f.requirement, type: v } })} />
              <Num label="value" value={f.requirement.value} min={0} onChange={(v) => update({ requirement: { ...f.requirement, value: v } })} />
              <Text label="item id (for requirement = item)" value={f.requirement.itemId ?? ""} onChange={(v) => update({ requirement: { ...f.requirement, itemId: v || undefined } })} />
              <Text label="hint shown in the pocket" value={f.hint} onChange={(v) => update({ hint: v })} />
              <Text label="location (developer note)" value={f.location} onChange={(v) => update({ location: v })} />
            </div>
            <Area label="description" value={f.description} onChange={(v) => update({ description: v })} rows={2} />
          </>
        )}
      />

      <h2>Items</h2>
      <ListEditor
        items={p.items}
        onChange={(v) => patch((c) => (c.progression.items = v))}
        title={(i) => `${i.name} (${i.location.game}${i.location.area ? " / " + i.location.area + " @ " + i.location.cell : ""}, depth ${i.depthRequired})`}
        addLabel="item"
        make={() => ({
          id: newId("item"),
          name: "a thing",
          description: "",
          laterDescription: "",
          icon: "?",
          image: "",
          depthRequired: 0,
          location: { game: "hideseek" as const, area: areaIds[0], cell: "0,0", under: "rock" as const },
          discoveryMethod: "find" as const,
          rarity: "common" as const,
          behavior: "static" as const,
          hidden: true,
        })}
        render={(i, update) => (
          <>
            <div className="admin__grid">
              <Text label="id" value={i.id} onChange={(v) => update({ id: v })} />
              <Text label="name" value={i.name} onChange={(v) => update({ name: v })} />
              <Text label="icon (emoji / glyph)" value={i.icon} onChange={(v) => update({ icon: v })} />
              <Num label="depth required" value={i.depthRequired} min={0} max={9} onChange={(v) => update({ depthRequired: v })} />
              <Select label="where" value={i.location.game} options={ITEM_GAMES} onChange={(v) => update({ location: { ...i.location, game: v } })} />
              <Select label="hide & seek area" value={i.location.area ?? ""} options={["", ...areaIds]} onChange={(v) => update({ location: { ...i.location, area: v || undefined } })} />
              <Text label="cell (col,row)" value={i.location.cell ?? ""} onChange={(v) => update({ location: { ...i.location, cell: v || undefined } })} />
              <Select label="under" value={i.location.under} options={UNDER} onChange={(v) => update({ location: { ...i.location, under: v } })} />
              <Select label="behaviour" value={i.behavior} options={BEHAVIOURS} onChange={(v) => update({ behavior: v })} />
              <Select label="rarity" value={i.rarity} options={RARITY} onChange={(v) => update({ rarity: v })} />
              <Text label="grants fragment id (optional)" value={i.fragmentId ?? ""} onChange={(v) => update({ fragmentId: v || undefined })} />
              <Select label="requirement (for game rewards)" value={i.requirement?.type ?? ""} options={["", ...REQ_TYPES]} onChange={(v) => update({ requirement: v ? { type: v as (typeof REQ_TYPES)[number], value: i.requirement?.value ?? 1 } : undefined })} />
              {i.requirement && <Num label="requirement value" value={i.requirement.value} min={0} onChange={(v) => update({ requirement: { ...i.requirement!, value: v } })} />}
              <Check label="hidden until found" value={i.hidden} onChange={(v) => update({ hidden: v })} />
            </div>
            <Area label="description" value={i.description} onChange={(v) => update({ description: v })} rows={2} />
            <Area label="description after it has been seen before" value={i.laterDescription} onChange={(v) => update({ laterDescription: v })} rows={2} />
            <ImageField label="image (optional)" value={i.image} onChange={(v) => update({ image: v })} />
          </>
        )}
      />

      <h2>Hide &amp; seek areas</h2>
      <div className="admin__help">Layout characters: . dirt · # bush · O rock · x debris · P start. Items reference an area id and a cell as col,row (0-based).</div>
      <div className="admin__grid">
        <Num label="moves of light per area" value={p.hideSeek.moveBudget} min={20} max={1000} onChange={(v) => patch((c) => (c.progression.hideSeek.moveBudget = v))} />
        <Num label="pushes to trample a bush" value={p.hideSeek.bushHits} min={1} max={10} onChange={(v) => patch((c) => (c.progression.hideSeek.bushHits = v))} />
      </div>
      <ListEditor
        items={p.hideSeek.areas}
        onChange={(v) => patch((c) => (c.progression.hideSeek.areas = v))}
        title={(a) => `${a.name} (depth ${a.depthRequired})`}
        addLabel="area"
        make={() => ({ id: newId("area"), name: "new area", layout: [".O.#.", "..P..", ".#.O."], depthRequired: 0, intro: "" })}
        render={(a, update) => (
          <>
            <div className="admin__grid">
              <Text label="id" value={a.id} onChange={(v) => update({ id: v })} />
              <Text label="name" value={a.name} onChange={(v) => update({ name: v })} />
              <Num label="depth required" value={a.depthRequired} min={0} max={9} onChange={(v) => update({ depthRequired: v })} />
              <Text label="intro line" value={a.intro} onChange={(v) => update({ intro: v })} />
            </div>
            <Lines label="layout rows" value={a.layout} onChange={(v) => update({ layout: v })} />
          </>
        )}
      />

      <h2>The door (/door)</h2>
      <div className="admin__grid">
        <Text label="title" value={p.door.title} onChange={(v) => patch((c) => (c.progression.door.title = v))} />
        <Text label="prompt" value={p.door.prompt} onChange={(v) => patch((c) => (c.progression.door.prompt = v))} />
        <Text label="text when no fragment yet" value={p.door.noKeyText} onChange={(v) => patch((c) => (c.progression.door.noKeyText = v))} />
        <Text label="success text" value={p.door.successText} onChange={(v) => patch((c) => (c.progression.door.successText = v))} />
        <Text label="footer hint" value={p.door.hint} onChange={(v) => patch((c) => (c.progression.door.hint = v))} />
        <Text label="hint after 5 wrong tries" value={p.door.hintAfter} onChange={(v) => patch((c) => (c.progression.door.hintAfter = v))} />
      </div>
      <Lines label="wrong-code responses (in order, last repeats)" value={p.door.wrongMessages} onChange={(v) => patch((c) => (c.progression.door.wrongMessages = v))} />
    </section>
  );
}
