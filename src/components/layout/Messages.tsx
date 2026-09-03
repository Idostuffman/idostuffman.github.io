"use client";

import { useEffect } from "react";
import { useVisitor, type Message } from "@/state/visitorStore";

function MessageItem({ m }: { m: Message }) {
  const dismiss = useVisitor((s) => s.dismissMessage);
  useEffect(() => {
    const t = window.setTimeout(() => dismiss(m.id), m.ttl);
    return () => window.clearTimeout(t);
  }, [m.id, m.ttl, dismiss]);
  return (
    <button type="button" className={`message message--${m.style}`} onClick={() => dismiss(m.id)} aria-label={`dismiss: ${m.text}`}>
      {m.text}
    </button>
  );
}

export function Messages() {
  const messages = useVisitor((s) => s.messages);
  return (
    <div className="messages" role="status" aria-live="polite">
      {messages.map((m) => (
        <MessageItem key={m.id} m={m} />
      ))}
    </div>
  );
}
