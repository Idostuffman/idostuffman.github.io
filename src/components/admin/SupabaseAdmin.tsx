"use client";

import { useEffect, useState } from "react";
import type { SiteContent } from "@/content/schema";
import { fetchRemoteContent } from "@/content/remote";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useContent } from "@/content/ContentProvider";
import { Editor } from "./Editor";

type Phase = "checking" | "anonymous" | "ready";

export function SupabaseAdmin() {
  const baked = useContent();
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState<SiteContent | null>(null);
  const [who, setWho] = useState("");

  const configured = isSupabaseConfigured();

  const load = async () => {
    const fresh = await fetchRemoteContent();
    setContent(fresh ?? baked);
    setPhase("ready");
  };

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    supabase()
      .auth.getSession()
      .then(async ({ data }) => {
        if (cancelled) return;
        if (!data.session) {
          setPhase("anonymous");
          return;
        }
        setWho(data.session.user.email ?? "");
        await load();
      })
      .catch(() => setPhase("anonymous"));
    const { data: sub } = supabase().auth.onAuthStateChange((_e, session) => {
      if (!session) {
        setPhase("anonymous");
        setContent(null);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  if (!configured) {
    return (
      <div className="admin">
        <h1>Supabase is not configured</h1>
        <p>
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (in <code>.env.local</code> for local
          development, and as repository variables for the deployed site), then reload. See <code>SUPABASE.md</code>.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data, error: err } = await supabase().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setWho(data.user?.email ?? "");
    setPassword("");
    await load();
  };

  if (phase === "checking") {
    return (
      <div className="admin">
        <p className="admin__status">…</p>
      </div>
    );
  }

  if (phase === "anonymous") {
    return (
      <div className="admin">
        <form className="admin__login" onSubmit={submit}>
          <h1>Editor</h1>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(ev) => setEmail(ev.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="pw">Password</label>
            <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(ev) => setPassword(ev.target.value)} required />
          </div>
          {error && <p className="admin__status admin__status--error">{error}</p>}
          <button type="submit" className="admin__btn admin__btn--primary" disabled={busy}>
            {busy ? "…" : "Log in"}
          </button>
          <p className="admin__status" style={{ marginTop: "0.8rem" }}>
            Accounts are created in the Supabase dashboard. Sign-ups are disabled on purpose.
          </p>
        </form>
      </div>
    );
  }

  return <Editor initial={content ?? baked} who={who} />;
}
