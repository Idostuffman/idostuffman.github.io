"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { StagePicker } from "./StagePicker";

export function StageGate() {
  const [state, setState] = useState<"checking" | "in" | "out">("checking");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState("out");
      return;
    }
    supabase()
      .auth.getSession()
      .then(({ data }) => setState(data.session ? "in" : "out"))
      .catch(() => setState("out"));
  }, []);

  if (state === "checking") return <div className="page" aria-busy="true" />;
  if (state === "out") {
    return (
      <div className="page secret__locked">
        <p className="mono">the stage picker is for the owner.</p>
        <p className="tiny">
          <Link href="/admin">log in</Link> · <Link href="/">home</Link>
        </p>
      </div>
    );
  }
  return <StagePicker />;
}
