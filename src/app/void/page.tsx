"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVisitor } from "@/state/visitorStore";

export default function VoidPage() {
  const router = useRouter();
  const hydrated = useVisitor((s) => s.hydrated);
  const unlocked = useVisitor((s) => s.run.basementUnlocked);
  useEffect(() => {
    if (!hydrated) return;
    router.replace(unlocked ? "/basement/below" : "/door");
  }, [hydrated, unlocked, router]);
  return <div className="void" aria-busy="true" />;
}
