import { Nunito, Cormorant_Garamond, Caveat, Space_Mono, VT323, Unbounded } from "next/font/google";

export const fontSans = Nunito({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
export const fontSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
export const fontHand = Caveat({ subsets: ["latin"], variable: "--font-hand", display: "swap" });
export const fontMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });
export const fontPixel = VT323({ subsets: ["latin"], weight: "400", variable: "--font-pixel", display: "swap" });
export const fontDisplay = Unbounded({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-display", display: "swap" });

export const fontClassNames = [
  fontSans.variable,
  fontSerif.variable,
  fontHand.variable,
  fontMono.variable,
  fontPixel.variable,
  fontDisplay.variable,
].join(" ");

export const fontVar: Record<string, string> = {
  sans: "var(--font-sans)",
  serif: "var(--font-serif)",
  hand: "var(--font-hand)",
  mono: "var(--font-mono)",
  pixel: "var(--font-pixel)",
  display: "var(--font-display)",
};
