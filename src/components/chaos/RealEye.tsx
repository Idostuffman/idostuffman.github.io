"use client";

import { useId, useMemo } from "react";

const ALMOND = "M 10 60 C 40 14, 160 14, 190 60 C 160 106, 40 106, 10 60 Z";
const IRISES = ["#5a3a22", "#3b5a4a", "#4a5f7a", "#6a4a2a", "#2f3d3a", "#7a5a3a"];

export function pickIris(seed: number): string {
  return IRISES[Math.abs(Math.floor(seed)) % IRISES.length];
}

export type RealEyeProps = {
  size?: number;
  iris?: string;
  skin?: string;
  blinkEvery?: number;
  blinkDelay?: number;
  halo?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function RealEye({ size = 120, iris = "#5a3a22", skin = "#8e6b5b", blinkEvery = 6, blinkDelay = 0, halo = true, className, style }: RealEyeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fibres = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const r1 = 14 + ((i * 7) % 5);
      const r2 = 31 - ((i * 3) % 4);
      out.push(`M ${100 + Math.cos(a) * r1} ${60 + Math.sin(a) * r1} L ${100 + Math.cos(a) * r2} ${60 + Math.sin(a) * r2}`);
    }
    return out;
  }, []);

  return (
    <span
      className={`realeye ${halo ? "realeye--halo" : ""} ${blinkEvery > 0 ? "realeye--blink" : ""} ${className ?? ""}`}
      style={{ width: size, height: size * 0.6, "--blink-dur": `${blinkEvery}s`, "--blink-delay": `${blinkDelay}s`, "--skin": skin, ...style } as React.CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 120" width="100%" height="100%" focusable="false">
        <defs>
          <radialGradient id={`${uid}s`} cx="50%" cy="45%" r="65%">
            <stop offset="0" stopColor="#fbf8f3" />
            <stop offset="0.65" stopColor="#efe7de" />
            <stop offset="1" stopColor="#c8b8ab" />
          </radialGradient>
          <radialGradient id={`${uid}i`} cx="42%" cy="38%" r="62%">
            <stop offset="0" stopColor={iris} stopOpacity="1" />
            <stop offset="0.25" stopColor={iris} />
            <stop offset="0.7" stopColor={iris} />
            <stop offset="1" stopColor="#120a06" />
          </radialGradient>
          <linearGradient id={`${uid}t`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#000" stopOpacity="0.6" />
            <stop offset="0.38" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}c`}>
            <path d={ALMOND} />
          </clipPath>
        </defs>
        {halo && <ellipse cx="100" cy="60" rx="118" ry="78" fill={skin} opacity="0.95" />}
        <path d={ALMOND} fill={`url(#${uid}s)`} />
        <g clipPath={`url(#${uid}c)`}>
          <path d="M 18 62 C 40 52, 52 58, 66 52" stroke="#c4433a" strokeWidth="0.9" fill="none" opacity="0.4" />
          <path d="M 20 70 C 44 66, 56 74, 70 70" stroke="#c4433a" strokeWidth="0.7" fill="none" opacity="0.35" />
          <path d="M 182 58 C 160 50, 150 62, 138 56" stroke="#c4433a" strokeWidth="0.8" fill="none" opacity="0.4" />
          <g className="realeye__iris">
            <circle cx="100" cy="60" r="34" fill={`url(#${uid}i)`} />
            <g stroke="#000" strokeWidth="0.7" opacity="0.22" fill="none">
              {fibres.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <circle cx="100" cy="60" r="34" fill="none" stroke="#0d0704" strokeWidth="2.2" opacity="0.75" />
            <g className="realeye__pupil">
              <circle cx="100" cy="60" r="13" fill="#040202" />
            </g>
            <ellipse cx="89" cy="47" rx="7" ry="4.5" fill="#fff" opacity="0.92" transform="rotate(-20 89 47)" />
            <circle cx="112" cy="73" r="2.4" fill="#fff" opacity="0.5" />
          </g>
          <path d={ALMOND} fill={`url(#${uid}t)`} />
          <ellipse cx="15" cy="63" rx="7" ry="4.5" fill="#c97b7b" opacity="0.65" />
          <g className="realeye__lids">
            <rect className="realeye__lid realeye__lid--upper" x="-10" y="-80" width="220" height="90" fill={skin} />
            <rect className="realeye__lid realeye__lid--lower" x="-10" y="110" width="220" height="90" fill={skin} />
          </g>
        </g>
        <path d={ALMOND} fill="none" stroke="#24150f" strokeWidth="2.6" opacity="0.85" />
        <path d="M 12 58 C 40 16, 160 16, 188 58" fill="none" stroke="#120806" strokeWidth="3.2" opacity="0.7" />
      </svg>
    </span>
  );
}
