"use client";

export type SoundName = "click" | "blip" | "glitch" | "hum" | "pop" | "wrong" | "win";

let ctx: AudioContext | null = null;
let enabled = false;

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (!on && ctx && ctx.state === "running") void ctx.suspend();
  if (on && ctx && ctx.state === "suspended") void ctx.resume();
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  ac: AudioContext,
  { freq, to, type = "sine", dur = 0.12, gain = 0.06, when = 0 }: {
    freq: number;
    to?: number;
    type?: OscillatorType;
    dur?: number;
    gain?: number;
    when?: number;
  },
) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  const t0 = ac.currentTime + when;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(ac: AudioContext, dur = 0.25, gain = 0.05) {
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const g = ac.createGain();
  g.gain.value = gain;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800 + Math.random() * 1500;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start();
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  switch (name) {
    case "click":
      tone(ac, { freq: 900, to: 500, type: "square", dur: 0.05, gain: 0.03 });
      break;
    case "blip":
      tone(ac, { freq: 600, to: 1200, type: "triangle", dur: 0.09 });
      break;
    case "pop":
      tone(ac, { freq: 300, to: 900, type: "sine", dur: 0.08, gain: 0.08 });
      break;
    case "wrong":
      tone(ac, { freq: 220, to: 110, type: "sawtooth", dur: 0.25, gain: 0.05 });
      break;
    case "win":
      tone(ac, { freq: 523, type: "triangle", dur: 0.1 });
      tone(ac, { freq: 659, type: "triangle", dur: 0.1, when: 0.1 });
      tone(ac, { freq: 784, type: "triangle", dur: 0.18, when: 0.2 });
      break;
    case "glitch":
      noise(ac, 0.2, 0.06);
      tone(ac, { freq: 80, to: 40, type: "sawtooth", dur: 0.2, gain: 0.04 });
      break;
    case "hum":
      tone(ac, { freq: 55, type: "sine", dur: 1.6, gain: 0.05 });
      tone(ac, { freq: 57, type: "sine", dur: 1.6, gain: 0.03 });
      break;
  }
}
