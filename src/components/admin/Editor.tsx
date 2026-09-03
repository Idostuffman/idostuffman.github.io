"use client";

import { useMemo, useState } from "react";
import type { BioLayer, InteractionAction, SiteContent } from "@/content/schema";
import { BioLayerKindSchema } from "@/content/schema";
import { Area, Check, ImageField, Lines, ListEditor, Num, Select, Tags, Text, newId } from "./fields";
import { saveContent, signOut, usingSupabase } from "./backend";
import { useSetContent } from "@/content/ContentProvider";
import { ProgressionEditor } from "./ProgressionEditor";
import { BasementEditor } from "./BasementEditor";

type Tab =
  | "identity"
  | "bio"
  | "personality"
  | "interests"
  | "lists"
  | "art"
  | "commissions"
  | "games"
  | "interactions"
  | "secrets"
  | "depth"
  | "look"
  | "strings"
  | "settings"
  | "progression"
  | "basement"
  | "json";

const TABS: { id: Tab; label: string }[] = [
  { id: "identity", label: "Identity & links" },
  { id: "bio", label: "About (staircase)" },
  { id: "personality", label: "Personality" },
  { id: "interests", label: "Interests" },
  { id: "lists", label: "Dislikes / facts / thoughts" },
  { id: "art", label: "Art" },
  { id: "commissions", label: "Commissions" },
  { id: "games", label: "Games" },
  { id: "interactions", label: "Interactions" },
  { id: "secrets", label: "Secrets" },
  { id: "depth", label: "Depth levels" },
  { id: "look", label: "Theme & stickers" },
  { id: "strings", label: "Page text" },
  { id: "progression", label: "Progression (key hunt)" },
  { id: "basement", label: "Basement" },
  { id: "settings", label: "Settings" },
  { id: "json", label: "Raw JSON" },
];

const TRIGGER_TYPES = ["click", "dblclick", "hover", "longpress", "keys", "visit", "visits", "depth", "gameloss", "scroll", "idle"] as const;
const ACTION_TYPES = ["depth", "setDepth", "unlockSecret", "navigate", "message", "reveal", "hide", "setText", "setImage", "flag", "spawn", "glitch", "sound", "confront"] as const;
const FONTS = ["sans", "serif", "hand", "mono", "pixel", "display"] as const;

function defaultAction(type: InteractionAction["type"]): InteractionAction {
  switch (type) {
    case "depth":
      return { type, amount: 1 };
    case "setDepth":
      return { type, depth: 0 };
    case "unlockSecret":
      return { type, secret: "" };
    case "navigate":
      return { type, to: "/" };
    case "message":
      return { type, text: "", style: "note" };
    case "reveal":
    case "hide":
      return { type, target: "" };
    case "setText":
      return { type, target: "", text: "" };
    case "setImage":
      return { type, target: "", src: "" };
    case "flag":
      return { type, key: "", value: true };
    case "spawn":
      return { type, object: "eye", count: 1 };
    case "glitch":
      return { type, ms: 400 };
    case "sound":
      return { type, name: "pop" };
    case "confront":
      return { type };
  }
}

function ActionEditor({ action, onChange }: { action: InteractionAction; onChange: (a: InteractionAction) => void }) {
  const a = action;
  return (
    <div className="admin__grid">
      <Select label="action" value={a.type} options={ACTION_TYPES} onChange={(t) => onChange(defaultAction(t))} />
      {a.type === "depth" && <Num label="amount" value={a.amount} min={-9} max={9} onChange={(v) => onChange({ ...a, amount: v })} />}
      {a.type === "setDepth" && <Num label="depth" value={a.depth} min={0} max={9} onChange={(v) => onChange({ ...a, depth: v })} />}
      {a.type === "unlockSecret" && <Text label="secret id" value={a.secret} onChange={(v) => onChange({ ...a, secret: v })} />}
      {a.type === "navigate" && <Text label="to (path)" value={a.to} onChange={(v) => onChange({ ...a, to: v })} />}
      {a.type === "message" && (
        <>
          <Text label="text" value={a.text} onChange={(v) => onChange({ ...a, text: v })} />
          <Select label="style" value={a.style} options={["note", "whisper", "system", "glitch"] as const} onChange={(v) => onChange({ ...a, style: v })} />
        </>
      )}
      {(a.type === "reveal" || a.type === "hide") && <Text label="element id" value={a.target} onChange={(v) => onChange({ ...a, target: v })} />}
      {a.type === "setText" && (
        <>
          <Text label="element id" value={a.target} onChange={(v) => onChange({ ...a, target: v })} />
          <Text label="text" value={a.text} onChange={(v) => onChange({ ...a, text: v })} />
        </>
      )}
      {a.type === "setImage" && (
        <>
          <Text label="element id" value={a.target} onChange={(v) => onChange({ ...a, target: v })} />
          <Text label="image url" value={a.src} onChange={(v) => onChange({ ...a, src: v })} />
        </>
      )}
      {a.type === "flag" && (
        <>
          <Text label="flag key" value={a.key} onChange={(v) => onChange({ ...a, key: v })} />
          <Check label="value" value={a.value} onChange={(v) => onChange({ ...a, value: v })} />
        </>
      )}
      {a.type === "spawn" && (
        <>
          <Select label="object" value={a.object} options={["eye", "sticker", "window"] as const} onChange={(v) => onChange({ ...a, object: v })} />
          <Num label="count" value={a.count} min={1} max={20} onChange={(v) => onChange({ ...a, count: v })} />
        </>
      )}
      {a.type === "glitch" && <Num label="ms" value={a.ms} min={50} max={5000} onChange={(v) => onChange({ ...a, ms: v })} />}
      {a.type === "sound" && <Select label="sound" value={a.name} options={["click", "blip", "glitch", "hum", "pop", "wrong", "win", "dread"] as const} onChange={(v) => onChange({ ...a, name: v })} />}
      {a.type === "confront" && <p className="admin__help">full-screen blackout, two eyes, the confrontation text below, and the "dread" sound. Uses the settings under "confrontation" at the top of this tab.</p>}
    </div>
  );
}

function BioLayerEditor({ layers, onChange, depth = 0 }: { layers: BioLayer[]; onChange: (l: BioLayer[]) => void; depth?: number }) {
  return (
    <div style={{ marginLeft: depth ? 16 : 0, borderLeft: depth ? "2px solid #d9d4c7" : undefined, paddingLeft: depth ? 10 : 0 }}>
      <ListEditor
        items={layers}
        onChange={onChange}
        title={(l) => l.title}
        addLabel="layer"
        make={() => ({ id: newId("layer"), title: "New layer", body: "[TEXT]", prompt: "more...", children: [] })}
        render={(l, update) => (
          <>
            <div className="admin__grid">
              <Text label="title" value={l.title} onChange={(v) => update({ title: v })} />
              <Select label="built-in block" value={l.kind ?? "custom"} options={BioLayerKindSchema.options} onChange={(v) => update({ kind: v })} />
              <Text label="button label to open next layer" value={l.prompt ?? ""} onChange={(v) => update({ prompt: v })} />
              <Num label="min depth to open" value={l.minDepth ?? 0} min={0} max={9} onChange={(v) => update({ minDepth: v })} />
              <Num label="depth gained on open" value={l.depthGain ?? 0} min={0} max={3} onChange={(v) => update({ depthGain: v })} />
            </div>
            <Area label="body" value={l.body} onChange={(v) => update({ body: v })} />
            <details>
              <summary>nested layers ({l.children?.length ?? 0})</summary>
              <BioLayerEditor layers={l.children ?? []} onChange={(c) => update({ children: c })} depth={depth + 1} />
            </details>
          </>
        )}
      />
    </div>
  );
}

export function Editor({ initial, who }: { initial: SiteContent; who?: string }) {
  const [content, setContent] = useState<SiteContent>(initial);
  const setLiveContent = useSetContent();
  const [tab, setTab] = useState<Tab>("identity");
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [dirty, setDirty] = useState(false);
  const [jsonDraft, setJsonDraft] = useState("");

  const patch = (mutate: (c: SiteContent) => void) => {
    setContent((prev) => {
      const next = structuredClone(prev);
      mutate(next);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setStatus({ text: "saving…" });
    const res = await saveContent(content);
    if (!res.ok) {
      setStatus({ text: `${res.error}${res.issues ? ": " + res.issues.join("; ") : ""}`, error: true });
      return;
    }
    if (res.content) setContent(res.content);
    setLiveContent(res.content ?? content);
    setDirty(false);
    setStatus({ text: usingSupabase() ? "saved. visitors see it on their next page load." : "saved. the public site updates immediately." });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "site.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    file.text().then((txt) => {
      try {
        setContent(JSON.parse(txt) as SiteContent);
        setDirty(true);
        setStatus({ text: "imported. save to apply." });
      } catch {
        setStatus({ text: "that file is not valid JSON", error: true });
      }
    });
  };

  const logout = () => void signOut();

  const artIds = useMemo(() => content.art.works.map((w) => w.id), [content.art.works]);

  return (
    <div className="admin">
      <div className="admin__bar">
        <h1 style={{ margin: 0 }}>Editor</h1>
        <button type="button" className="admin__btn admin__btn--primary" onClick={save} disabled={!dirty && status.text !== ""}>
          {dirty ? "Save changes" : "Saved"}
        </button>
        <a className="admin__btn" href="/" target="_blank" rel="noreferrer">
          Open site ↗
        </a>
        <a className="admin__btn" href="/stage" target="_blank" rel="noreferrer">
          Stage picker ↗
        </a>
        <button type="button" className="admin__btn" onClick={exportJson}>
          Export JSON
        </button>
        <label className="admin__btn" style={{ cursor: "pointer" }}>
          Import JSON
          <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </label>
        <button
          type="button"
          className="admin__btn"
          onClick={() => {
            localStorage.removeItem("chei-visitor-v2");
            setStatus({ text: "visitor state cleared in this browser (depth, secrets, eyes). reload the site to see it fresh." });
          }}
        >
          Reset my visitor state
        </button>
        <button type="button" className="admin__btn admin__btn--danger" onClick={logout}>
          Log out
        </button>
        <span className={`admin__status ${status.error ? "admin__status--error" : ""}`}>{status.text}</span>
        {who && <span className="admin__status">signed in as {who}</span>}
      </div>

      <div className="admin__tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="admin__tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "identity" && (
        <section>
          <div className="admin__help">Text fields support blank lines for paragraphs, "- " bullets, "&gt; " quotes, *emphasis*, and [links](https://…).</div>
          <div className="admin__grid">
            <Text label="name" value={content.identity.name} onChange={(v) => patch((c) => (c.identity.name = v))} />
            <Text label="username" value={content.identity.username} onChange={(v) => patch((c) => (c.identity.username = v))} />
            <Text label="pronouns (optional)" value={content.identity.pronouns} onChange={(v) => patch((c) => (c.identity.pronouns = v))} />
            <Text label="site title (browser tab)" value={content.identity.siteTitle} onChange={(v) => patch((c) => (c.identity.siteTitle = v))} />
            <Text label="deep title (tab title at depth 3+)" value={content.identity.deepTitle} onChange={(v) => patch((c) => (c.identity.deepTitle = v))} />
            <Text label="tagline" value={content.identity.tagline} onChange={(v) => patch((c) => (c.identity.tagline = v))} />
          </div>
          <Area label="welcome message (home)" value={content.identity.welcome} onChange={(v) => patch((c) => (c.identity.welcome = v))} rows={3} />
          <ImageField label="avatar" value={content.identity.avatar} onChange={(v) => patch((c) => (c.identity.avatar = v))} />
          <Area label="short bio (home readme window)" value={content.bio.short} onChange={(v) => patch((c) => (c.bio.short = v))} />
          <h2>Social links</h2>
          <ListEditor
            items={content.socials}
            onChange={(v) => patch((c) => (c.socials = v))}
            title={(s) => s.label}
            addLabel="link"
            make={() => ({ id: newId("s"), label: "new link", url: "https://", icon: "✦" })}
            render={(s, update) => (
              <div className="admin__grid">
                <Text label="label" value={s.label} onChange={(v) => update({ label: v })} />
                <Text label="url" value={s.url} onChange={(v) => update({ url: v })} />
                <Text label="icon (emoji)" value={s.icon} onChange={(v) => update({ icon: v })} />
              </div>
            )}
          />
        </section>
      )}

      {tab === "bio" && (
        <section>
          <div className="admin__help">
            The about page is a staircase: each layer opens the next. Layers with a built-in block also render that data (likes, dislikes, facts…). Set a
            minimum depth to lock a layer until the visitor has explored enough.
          </div>
          <BioLayerEditor layers={content.bio.layers} onChange={(v) => patch((c) => (c.bio.layers = v))} />
        </section>
      )}

      {tab === "personality" && (
        <section>
          <Area label="intro" value={content.personality.intro} onChange={(v) => patch((c) => (c.personality.intro = v))} />
          <h2>Traits</h2>
          <ListEditor
            items={content.personality.traits}
            onChange={(v) => patch((c) => (c.personality.traits = v))}
            title={(t) => t.trait}
            addLabel="trait"
            make={() => ({ id: newId("t"), trait: "new trait", description: "", intensity: 3, hidden: false })}
            render={(t, update) => (
              <>
                <div className="admin__grid">
                  <Text label="trait" value={t.trait} onChange={(v) => update({ trait: v })} />
                  <Num label="intensity (1-5)" value={t.intensity} min={1} max={5} onChange={(v) => update({ intensity: v })} />
                  <Check label="hidden (only shows at depth 3+)" value={t.hidden} onChange={(v) => update({ hidden: v })} />
                </div>
                <Area label="description" value={t.description} onChange={(v) => update({ description: v })} />
              </>
            )}
          />
          <h2>Layers (the onion)</h2>
          <ListEditor
            items={content.personality.layers}
            onChange={(v) => patch((c) => (c.personality.layers = v))}
            title={(l) => l.title || "(blank title)"}
            addLabel="layer"
            make={() => ({ id: newId("p"), title: "How Chei …", body: "" })}
            render={(l, update) => (
              <>
                <Text label="title" value={l.title} onChange={(v) => update({ title: v })} />
                <Area label="body" value={l.body} onChange={(v) => update({ body: v })} />
              </>
            )}
          />
        </section>
      )}

      {tab === "interests" && (
        <ListEditor
          items={content.interests}
          onChange={(v) => patch((c) => (c.interests = v))}
          title={(i) => i.title}
          addLabel="interest"
          make={() => ({ id: newId("i"), title: "new interest", description: "", image: "", tags: [], rating: 3, hiddenContent: "" })}
          render={(i, update) => (
            <>
              <div className="admin__grid">
                <Text label="title" value={i.title} onChange={(v) => update({ title: v })} />
                <Num label="favourite rating (1-5)" value={i.rating} min={1} max={5} onChange={(v) => update({ rating: v })} />
                <Tags label="tags" value={i.tags} onChange={(v) => update({ tags: v })} />
              </div>
              <Area label="description" value={i.description} onChange={(v) => update({ description: v })} />
              <Area label="hidden content (depth 2+)" value={i.hiddenContent} onChange={(v) => update({ hiddenContent: v })} />
              <ImageField label="image" value={i.image} onChange={(v) => update({ image: v })} />
            </>
          )}
        />
      )}

      {tab === "lists" && (
        <section>
          <h2>Dislikes</h2>
          <ListEditor
            items={content.dislikes}
            onChange={(v) => patch((c) => (c.dislikes = v))}
            title={(d) => d.text}
            addLabel="dislike"
            make={() => ({ id: newId("d"), text: "", reason: "" })}
            render={(d, update) => (
              <div className="admin__grid">
                <Text label="dislike" value={d.text} onChange={(v) => update({ text: v })} />
                <Text label="reason / aside" value={d.reason} onChange={(v) => update({ reason: v })} />
              </div>
            )}
          />
          <h2>Random facts</h2>
          <ListEditor
            items={content.facts}
            onChange={(v) => patch((c) => (c.facts = v))}
            title={(f) => f.text}
            addLabel="fact"
            make={() => ({ id: newId("f"), text: "", minDepth: 0 })}
            render={(f, update) => (
              <div className="admin__grid">
                <Text label="fact" value={f.text} onChange={(v) => update({ text: v })} />
                <Num label="min depth" value={f.minDepth} min={0} max={9} onChange={(v) => update({ minDepth: v })} />
              </div>
            )}
          />
          <h2>Thoughts</h2>
          <ListEditor
            items={content.thoughts}
            onChange={(v) => patch((c) => (c.thoughts = v))}
            title={(f) => f.text}
            addLabel="thought"
            make={() => ({ id: newId("th"), text: "", minDepth: 0 })}
            render={(f, update) => (
              <div className="admin__grid">
                <Text label="thought" value={f.text} onChange={(v) => update({ text: v })} />
                <Num label="min depth" value={f.minDepth} min={0} max={9} onChange={(v) => update({ minDepth: v })} />
              </div>
            )}
          />
        </section>
      )}

      {tab === "art" && (
        <section>
          <Area label="gallery intro" value={content.art.intro} onChange={(v) => patch((c) => (c.art.intro = v))} rows={2} />
          <h2>Categories</h2>
          <ListEditor
            items={content.art.categories}
            onChange={(v) => patch((c) => (c.art.categories = v))}
            title={(cat) => cat.label}
            addLabel="category"
            make={() => ({ id: newId("cat"), label: "new category" })}
            render={(cat, update) => (
              <div className="admin__grid">
                <Text label="id (used by artworks)" value={cat.id} onChange={(v) => update({ id: v })} />
                <Text label="label" value={cat.label} onChange={(v) => update({ label: v })} />
              </div>
            )}
          />
          <h2>Artworks</h2>
          <ListEditor
            items={content.art.works}
            onChange={(v) => patch((c) => (c.art.works = v))}
            title={(w) => w.title}
            addLabel="artwork"
            make={() => ({
              id: newId("a"),
              title: "[ARTWORK]",
              image: "/placeholders/art-1.svg",
              description: "",
              date: "",
              category: content.art.categories[0]?.id ?? "misc",
              tags: [],
              commissionStatus: "personal" as const,
              hidden: { type: "none" as const, image: "", text: "", href: "", clicks: 3, depthGain: 1 },
            })}
            render={(w, update) => (
              <>
                <div className="admin__grid">
                  <Text label="title" value={w.title} onChange={(v) => update({ title: v })} />
                  <Text label="date" value={w.date} onChange={(v) => update({ date: v })} />
                  <Select label="category" value={w.category} options={content.art.categories.map((c) => c.id)} onChange={(v) => update({ category: v })} />
                  <Select label="status" value={w.commissionStatus} options={["personal", "commission", "example"] as const} onChange={(v) => update({ commissionStatus: v })} />
                  <Tags label="tags" value={w.tags} onChange={(v) => update({ tags: v })} />
                </div>
                <ImageField label="image" value={w.image} onChange={(v) => update({ image: v })} />
                <Area label="description" value={w.description} onChange={(v) => update({ description: v })} />
                <details>
                  <summary>hidden interaction</summary>
                  <div className="admin__grid">
                    <Select label="type" value={w.hidden.type} options={["none", "alt-image", "text", "link"] as const} onChange={(v) => update({ hidden: { ...w.hidden, type: v } })} />
                    <Num label="clicks to trigger" value={w.hidden.clicks} min={1} max={50} onChange={(v) => update({ hidden: { ...w.hidden, clicks: v } })} />
                    <Num label="depth gained" value={w.hidden.depthGain} min={0} max={3} onChange={(v) => update({ hidden: { ...w.hidden, depthGain: v } })} />
                    <Text label="text / message" value={w.hidden.text} onChange={(v) => update({ hidden: { ...w.hidden, text: v } })} />
                    <Text label="link (for type=link)" value={w.hidden.href} onChange={(v) => update({ hidden: { ...w.hidden, href: v } })} />
                  </div>
                  {w.hidden.type === "alt-image" && <ImageField label="alternate image" value={w.hidden.image} onChange={(v) => update({ hidden: { ...w.hidden, image: v } })} />}
                </details>
              </>
            )}
          />
        </section>
      )}

      {tab === "commissions" && (
        <section>
          <div className="admin__help">This is the "normal website". Keep it calm. Artwork ids available: {artIds.join(", ") || "none"}.</div>
          <div className="admin__grid">
            <Text label="headline" value={content.commissions.headline} onChange={(v) => patch((c) => (c.commissions.headline = v))} />
            <Select label="status" value={content.commissions.status} options={["open", "limited", "closed"] as const} onChange={(v) => patch((c) => (c.commissions.status = v))} />
            <Text label="status note" value={content.commissions.statusNote} onChange={(v) => patch((c) => (c.commissions.statusNote = v))} />
            <Text label="turnaround" value={content.commissions.turnaround} onChange={(v) => patch((c) => (c.commissions.turnaround = v))} />
            <Text label="contact method" value={content.commissions.contact.method} onChange={(v) => patch((c) => (c.commissions.contact.method = v))} />
            <Text label="contact value" value={content.commissions.contact.value} onChange={(v) => patch((c) => (c.commissions.contact.value = v))} />
            <Text label="contact note" value={content.commissions.contact.note} onChange={(v) => patch((c) => (c.commissions.contact.note = v))} />
            <Tags label="gallery artwork ids" value={content.commissions.gallery} onChange={(v) => patch((c) => (c.commissions.gallery = v))} />
          </div>
          <Area label="intro" value={content.commissions.intro} onChange={(v) => patch((c) => (c.commissions.intro = v))} />
          <h2>Commission types</h2>
          <ListEditor
            items={content.commissions.types}
            onChange={(v) => patch((c) => (c.commissions.types = v))}
            title={(t) => `${t.name} — ${t.price}`}
            addLabel="type"
            make={() => ({ id: newId("c"), name: "New type", price: "$", description: "", examples: [], available: true })}
            render={(t, update) => (
              <>
                <div className="admin__grid">
                  <Text label="name" value={t.name} onChange={(v) => update({ name: v })} />
                  <Text label="price" value={t.price} onChange={(v) => update({ price: v })} />
                  <Tags label="example artwork ids" value={t.examples} onChange={(v) => update({ examples: v })} />
                  <Check label="available" value={t.available} onChange={(v) => update({ available: v })} />
                </div>
                <Area label="description" value={t.description} onChange={(v) => update({ description: v })} />
              </>
            )}
          />
          <Lines label="process steps" value={content.commissions.process} onChange={(v) => patch((c) => (c.commissions.process = v))} />
          <Lines label="terms" value={content.commissions.terms} onChange={(v) => patch((c) => (c.commissions.terms = v))} />
          <h2>FAQ</h2>
          <ListEditor
            items={content.commissions.faq}
            onChange={(v) => patch((c) => (c.commissions.faq = v))}
            title={(f) => f.q}
            addLabel="question"
            make={() => ({ id: newId("q"), q: "", a: "" })}
            render={(f, update) => (
              <>
                <Text label="question" value={f.q} onChange={(v) => update({ q: v })} />
                <Area label="answer" value={f.a} onChange={(v) => update({ a: v })} />
              </>
            )}
          />
        </section>
      )}

      {tab === "games" && (
        <section>
          <div className="admin__help">Loss messages show in order after consecutive losses. The eyes appear at the eye threshold (total losses); the room transforms at the transform threshold.</div>
          <Lines label="loss messages" value={content.games.lossMessages} onChange={(v) => patch((c) => (c.games.lossMessages = v))} />
          <div className="admin__grid">
            <Num label="eye threshold (total losses)" value={content.games.eyeThreshold} min={1} max={100} onChange={(v) => patch((c) => (c.games.eyeThreshold = v))} />
            <Num label="transform threshold" value={content.games.transformThreshold} min={1} max={200} onChange={(v) => patch((c) => (c.games.transformThreshold = v))} />
            <Num label="reaction: rounds" value={content.games.reaction.rounds} min={1} max={20} onChange={(v) => patch((c) => (c.games.reaction.rounds = v))} />
            <Num label="reaction: window ms" value={content.games.reaction.windowMs} min={150} max={3000} onChange={(v) => patch((c) => (c.games.reaction.windowMs = v))} />
            <Num label="memory: start length" value={content.games.memory.startLength} min={1} max={10} onChange={(v) => patch((c) => (c.games.memory.startLength = v))} />
            <Num label="memory: win length" value={content.games.memory.winLength} min={2} max={30} onChange={(v) => patch((c) => (c.games.memory.winLength = v))} />
            <Num label="road: columns" value={content.games.crossing.cols} min={5} max={15} onChange={(v) => patch((c) => (c.games.crossing.cols = v))} />
            <Num label="road: lanes at start" value={content.games.crossing.startLanes} min={1} max={10} onChange={(v) => patch((c) => (c.games.crossing.startLanes = v))} />
            <Num label="road: max lanes" value={content.games.crossing.maxLanes} min={1} max={12} onChange={(v) => patch((c) => (c.games.crossing.maxLanes = v))} />
            <Num label="road: base speed (cells/s)" value={content.games.crossing.baseSpeed} min={0.2} max={10} step={0.1} onChange={(v) => patch((c) => (c.games.crossing.baseSpeed = v))} />
            <Num label="road: speed per crossing" value={content.games.crossing.speedStep} min={0} max={5} step={0.05} onChange={(v) => patch((c) => (c.games.crossing.speedStep = v))} />
            <Num label="road: gap between vehicles" value={content.games.crossing.spawnGap} min={0.5} max={10} step={0.1} onChange={(v) => patch((c) => (c.games.crossing.spawnGap = v))} />
            <Num label="road: minimum gap" value={content.games.crossing.minGap} min={0.5} max={10} step={0.1} onChange={(v) => patch((c) => (c.games.crossing.minGap = v))} />
            <Num label="road: crossings to win" value={content.games.crossing.winCrossings} min={1} max={50} onChange={(v) => patch((c) => (c.games.crossing.winCrossings = v))} />
            <Num label="road: strange vehicles from crossing" value={content.games.crossing.weirdFrom} min={0} max={50} onChange={(v) => patch((c) => (c.games.crossing.weirdFrom = v))} />
            <Text label="impossible: label" value={content.games.impossible.label} onChange={(v) => patch((c) => (c.games.impossible.label = v))} />
            <Num label="impossible: flee distance px" value={content.games.impossible.fleeDistance} min={40} max={400} onChange={(v) => patch((c) => (c.games.impossible.fleeDistance = v))} />
            <Num label="impossible: catchable after N dodges" value={content.games.impossible.catchableAfter} min={1} max={200} onChange={(v) => patch((c) => (c.games.impossible.catchableAfter = v))} />
          </div>
          <h2>Eyes</h2>
          <div className="admin__help">
            eyes = depthCounts[depth] + (eyes from losses × loss weight) + (secrets found × eyes per secret), capped at max eyes. Depth is the main driver;
            game losses and spawn actions stack on top.
          </div>
          <div className="admin__grid">
            <Check label="eyes enabled" value={content.eyes.enabled} onChange={(v) => patch((c) => (c.eyes.enabled = v))} />
            <Num label="max eyes on screen" value={content.eyes.maxEyes} min={0} max={150} onChange={(v) => patch((c) => (c.eyes.maxEyes = v))} />
            <Num label="loss weight" value={content.eyes.lossWeight} min={0} max={5} step={0.1} onChange={(v) => patch((c) => (c.eyes.lossWeight = v))} />
            <Num label="eyes per secret" value={content.eyes.perSecret} min={0} max={5} step={0.1} onChange={(v) => patch((c) => (c.eyes.perSecret = v))} />
            <Num label="shy radius (px)" value={content.eyes.shyRadius} min={0} max={600} onChange={(v) => patch((c) => (c.eyes.shyRadius = v))} />
            {content.eyes.depthCounts.map((n, i) => (
              <Num key={i} label={`eyes at depth ${i}`} value={n} min={0} max={100} onChange={(v) => patch((c) => (c.eyes.depthCounts[i] = v))} />
            ))}
          </div>
          <h2>The button</h2>
          <div className="admin__grid">
            <Num label="button starts moving at (clicks)" value={content.games.clicker.moveAt} min={1} max={10000} onChange={(v) => patch((c) => (c.games.clicker.moveAt = v))} />
            <Check label="a miss resets the count once it moves" value={content.games.clicker.resetOnMiss} onChange={(v) => patch((c) => (c.games.clicker.resetOnMiss = v))} />
          </div>
          <h2>Clicker milestones</h2>
          <ListEditor
            items={content.games.clicker.milestones.map((m, i) => ({ ...m, id: `m${i}` }))}
            onChange={(v) => patch((c) => (c.games.clicker.milestones = v.map(({ at, text }) => ({ at, text }))))}
            title={(m) => `${m.at}: ${m.text}`}
            addLabel="milestone"
            make={() => ({ id: newId("m"), at: 10, text: "" })}
            render={(m, update) => (
              <div className="admin__grid">
                <Num label="at clicks" value={m.at} min={1} onChange={(v) => update({ at: v })} />
                <Text label="text" value={m.text} onChange={(v) => update({ text: v })} />
              </div>
            )}
          />
        </section>
      )}

      {tab === "interactions" && (
        <section>
          <div className="admin__help">
            trigger → conditions → actions. Targets that exist in the site: site-logo, home-avatar, dead-button, page-corner, any sticker target, and bg-&lt;word&gt; for
            background words. Element ids for reveal/setText: dead-button-reveal, corner-note, footer-secret, face-note.
          </div>
          <h3 style={{ fontSize: "0.9rem" }}>confrontation (the "confront" action)</h3>
          <div className="admin__grid">
            <Text label="big text" value={content.confrontation.text} onChange={(v) => patch((c) => (c.confrontation.text = v))} />
            <Num label="stays up for (ms)" value={content.confrontation.holdMs} min={1000} max={30000} step={500} onChange={(v) => patch((c) => (c.confrontation.holdMs = v))} />
          </div>
          <p className="admin__help">
            The default interaction for this is below — trigger "keys", target "chei", count 20. Change the target/count there to change the word or how many times it needs typing.
          </p>
          <ListEditor
            items={content.interactions}
            onChange={(v) => patch((c) => (c.interactions = v))}
            title={(it) => `${it.id} — ${it.trigger.type} ${it.trigger.target} ×${it.trigger.count}`}
            addLabel="interaction"
            make={() => ({ id: newId("ix"), note: "", trigger: { type: "click" as const, target: "", count: 1 }, conditions: {}, actions: [], once: true, enabled: true })}
            render={(it, update) => (
              <>
                <div className="admin__grid">
                  <Text label="id" value={it.id} onChange={(v) => update({ id: v })} />
                  <Text label="note" value={it.note} onChange={(v) => update({ note: v })} />
                  <Select label="trigger" value={it.trigger.type} options={TRIGGER_TYPES} onChange={(v) => update({ trigger: { ...it.trigger, type: v } })} />
                  <Text label="target" value={it.trigger.target} onChange={(v) => update({ trigger: { ...it.trigger, target: v } })} />
                  <Num label="count" value={it.trigger.count} min={1} max={1000} onChange={(v) => update({ trigger: { ...it.trigger, count: v } })} />
                  <Num label="min depth (optional)" value={it.conditions.minDepth ?? 0} min={0} max={9} onChange={(v) => update({ conditions: { ...it.conditions, minDepth: v || undefined } })} />
                  <Text label="requires secret (id)" value={it.conditions.requiresSecret ?? ""} onChange={(v) => update({ conditions: { ...it.conditions, requiresSecret: v || undefined } })} />
                  <Text label="requires flag" value={it.conditions.requiresFlag ?? ""} onChange={(v) => update({ conditions: { ...it.conditions, requiresFlag: v || undefined } })} />
                  <Check label="fire once per visitor" value={it.once} onChange={(v) => update({ once: v })} />
                  <Check label="enabled" value={it.enabled} onChange={(v) => update({ enabled: v })} />
                </div>
                <h3 style={{ fontSize: "0.9rem" }}>actions</h3>
                {it.actions.map((a, ai) => (
                  <div key={ai} className="admin__item">
                    <ActionEditor action={a} onChange={(na) => update({ actions: it.actions.map((x, k) => (k === ai ? na : x)) })} />
                    <button type="button" className="admin__btn admin__btn--danger" onClick={() => update({ actions: it.actions.filter((_, k) => k !== ai) })}>
                      remove action
                    </button>
                  </div>
                ))}
                <button type="button" className="admin__btn" onClick={() => update({ actions: [...it.actions, defaultAction("message")] })}>
                  + action
                </button>
              </>
            )}
          />
        </section>
      )}

      {tab === "secrets" && (
        <ListEditor
          items={content.secrets}
          onChange={(v) => patch((c) => (c.secrets = v))}
          title={(s) => `${s.title} (/secrets/${s.slug})`}
          addLabel="secret page"
          make={() => ({ id: newId("sec"), slug: `secret-${Date.now().toString(36)}`, title: "new secret", body: "[SECRET]", style: "note" as const, urlUnlockable: false, depthGain: 1, leadsTo: [], unlockMessage: "you found something" })}
          render={(s, update) => (
            <>
              <div className="admin__grid">
                <Text label="id (used by unlockSecret actions)" value={s.id} onChange={(v) => update({ id: v })} />
                <Text label="slug (url)" value={s.slug} onChange={(v) => update({ slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
                <Text label="title" value={s.title} onChange={(v) => update({ title: v })} />
                <Select label="style" value={s.style} options={["note", "terminal", "void", "shrine", "notice", "window"] as const} onChange={(v) => update({ style: v })} />
                <Check label="unlockable by visiting the URL" value={s.urlUnlockable} onChange={(v) => update({ urlUnlockable: v })} />
                <Num label="depth gained on unlock" value={s.depthGain} min={0} max={3} onChange={(v) => update({ depthGain: v })} />
                <Text label="unlock message" value={s.unlockMessage} onChange={(v) => update({ unlockMessage: v })} />
                <Tags label="leads to (secret ids)" value={s.leadsTo} onChange={(v) => update({ leadsTo: v })} />
              </div>
              <Area label="body" value={s.body} onChange={(v) => update({ body: v })} />
            </>
          )}
        />
      )}

      {tab === "depth" && (
        <section>
          <div className="admin__help">Depth 0 is the normal site; 7 is the bottom. Background words accumulate as the visitor goes deeper. Whispers pop up occasionally at that depth.</div>
          <ListEditor
            items={content.deepLevels.map((l) => ({ ...l, id: `depth-${l.depth}` }))}
            onChange={(v) => patch((c) => (c.deepLevels = v.map(({ id: _id, ...rest }) => rest)))}
            title={(l) => `depth ${l.depth} — ${l.name}`}
            addLabel="level"
            make={() => ({ id: newId("depth"), depth: content.deepLevels.length, name: "new level", note: "", backgroundWords: [], whispers: [] })}
            render={(l, update) => (
              <>
                <div className="admin__grid">
                  <Num label="depth" value={l.depth} min={0} max={9} onChange={(v) => update({ depth: v })} />
                  <Text label="name" value={l.name} onChange={(v) => update({ name: v })} />
                  <Text label="tab title override" value={l.title ?? ""} onChange={(v) => update({ title: v || undefined })} />
                </div>
                <Lines label="background words" value={l.backgroundWords} onChange={(v) => update({ backgroundWords: v })} />
                <Lines label="whispers" value={l.whispers} onChange={(v) => update({ whispers: v })} />
              </>
            )}
          />
        </section>
      )}

      {tab === "look" && (
        <section>
          <h2>Theme</h2>
          <div className="admin__grid">
            <Text label="paper (background)" value={content.theme.paper} onChange={(v) => patch((c) => (c.theme.paper = v))} />
            <Text label="ink (text)" value={content.theme.ink} onChange={(v) => patch((c) => (c.theme.ink = v))} />
            <Text label="accent" value={content.theme.accent} onChange={(v) => patch((c) => (c.theme.accent = v))} />
            <Text label="accent 2" value={content.theme.accent2} onChange={(v) => patch((c) => (c.theme.accent2 = v))} />
            <Text label="accent 3" value={content.theme.accent3} onChange={(v) => patch((c) => (c.theme.accent3 = v))} />
            <Text label="commission page accent" value={content.theme.normalAccent} onChange={(v) => patch((c) => (c.theme.normalAccent = v))} />
            <Select label="body font" value={content.theme.bodyFont} options={FONTS} onChange={(v) => patch((c) => (c.theme.bodyFont = v))} />
            <Select label="heading font" value={content.theme.headingFont} options={FONTS} onChange={(v) => patch((c) => (c.theme.headingFont = v))} />
          </div>
          <h2>Home page stickers</h2>
          <ListEditor
            items={content.stickers}
            onChange={(v) => patch((c) => (c.stickers = v))}
            title={(s) => `${s.content} @ ${s.x}%,${s.y}%`}
            addLabel="sticker"
            make={() => ({ id: newId("st"), content: "★", image: "", x: 50, y: 50, rotate: 0, size: 1.6, target: undefined as string | undefined, says: "", draggable: true, hideOnMobile: false })}
            render={(s, update) => (
              <>
                <div className="admin__grid">
                  <Text label="emoji / text" value={s.content} onChange={(v) => update({ content: v })} />
                  <Text label="says when tapped" value={s.says} onChange={(v) => update({ says: v })} />
                  <Text label="interaction target id (optional)" value={s.target ?? ""} onChange={(v) => update({ target: v || undefined })} />
                  <Num label="x %" value={s.x} min={0} max={100} onChange={(v) => update({ x: v })} />
                  <Num label="y %" value={s.y} min={0} max={100} onChange={(v) => update({ y: v })} />
                  <Num label="rotate" value={s.rotate} min={-180} max={180} onChange={(v) => update({ rotate: v })} />
                  <Num label="size (rem)" value={s.size} min={0.5} max={6} step={0.1} onChange={(v) => update({ size: v })} />
                  <Check label="draggable" value={s.draggable} onChange={(v) => update({ draggable: v })} />
                  <Check label="hide on mobile" value={s.hideOnMobile} onChange={(v) => update({ hideOnMobile: v })} />
                </div>
                <ImageField label="image (optional, replaces emoji)" value={s.image} onChange={(v) => update({ image: v })} />
              </>
            )}
          />
        </section>
      )}

      {tab === "strings" && (
        <section>
          <div className="admin__help">Loose text used around the site (nav labels, footers, basement text…).</div>
          {Object.entries(content.strings).map(([k, v]) => (
            <Area key={k} label={k} value={v} rows={2} onChange={(nv) => patch((c) => (c.strings[k] = nv))} />
          ))}
        </section>
      )}

      {tab === "progression" && <ProgressionEditor content={content} patch={patch} />}
      {tab === "basement" && <BasementEditor content={content} patch={patch} />}

      {tab === "settings" && (
        <section>
          <div className="admin__help">
            How the site behaves for visitors. Text, art, prices and secrets are edited in the other tabs; this tab is about progression. Use{" "}
            <a href="/stage" target="_blank" rel="noreferrer">
              /stage
            </a>{" "}
            to preview any stage.
          </div>
          <Check
            label="remember progress between reloads (off = every reload starts at the first stage)"
            value={content.settings.persistProgress}
            onChange={(v) => patch((c) => (c.settings.persistProgress = v))}
          />
          <Num label="start stage (depth every visit begins at, 0–7)" value={content.settings.startDepth} min={0} max={7} onChange={(v) => patch((c) => (c.settings.startDepth = v))} />
          <Check label="stage picker (/stage) is public (off = only logged-in admins)" value={content.settings.stagePickerPublic} onChange={(v) => patch((c) => (c.settings.stagePickerPublic = v))} />
        </section>
      )}

      {tab === "json" && (
        <section>
          <div className="admin__help">Edit the whole document. "Apply" replaces the editor state; you still need to Save.</div>
          <textarea className="admin__json" value={jsonDraft || JSON.stringify(content, null, 2)} onChange={(e) => setJsonDraft(e.target.value)} spellCheck={false} />
          <button
            type="button"
            className="admin__btn"
            onClick={() => {
              try {
                setContent(JSON.parse(jsonDraft || JSON.stringify(content)) as SiteContent);
                setDirty(true);
                setJsonDraft("");
                setStatus({ text: "applied. save to publish." });
              } catch {
                setStatus({ text: "invalid JSON", error: true });
              }
            }}
          >
            Apply JSON
          </button>
        </section>
      )}
    </div>
  );
}
