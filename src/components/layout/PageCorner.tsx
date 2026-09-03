"use client";

import { useInteractionTarget } from "@/interactions/useInteractionTarget";
import { Revealable } from "@/components/chaos/Gated";
import { useStrings } from "@/content/ContentProvider";

export function PageCorner() {
  const { props, count } = useInteractionTarget("page-corner");
  const t = useStrings();
  return (
    <>
      <button
        type="button"
        className="page-corner"
        style={{ "--fold": `${Math.min(3, count) * 8 + 26}px` } as React.CSSProperties}
        aria-label="folded page corner"
        {...props}
      />
      <Revealable id="corner-note">
        <p className="corner-note hand appear">{t("home.cornerNote", "[note under the corner]")}</p>
      </Revealable>
    </>
  );
}
