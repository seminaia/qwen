import type { Family, Segment } from "../data/ellingham";

/* ---------- Unicode chemistry typesetting ---------- */
const SUP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "-": "⁻", "+": "⁺", ".": "·",
};
const SUB: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "-": "₋", "+": "₊", ".": "·",
};
export const toSup = (s: string | number) =>
  String(s).split("").map((c) => SUP[c] ?? c).join("");
export const toSub = (s: string | number) =>
  String(s).split("").map((c) => SUB[c] ?? c).join("");

/** "$\frac{4}{3} Al + O_2 = \frac{2}{3} Al_2O_3$" → "⁴⁄₃ Al + O₂ = ²⁄₃ Al₂O₃" */
export function formatReaction(rxn: string): string {
  let s = rxn.replace(/\$/g, "").trim();
  s = s.replace(/\\frac\{(\d+)\}\{(\d+)\}/g, (_, a: string, b: string) =>
    `${toSup(a)}⁄${toSub(b)}`,
  );
  s = s.replace(/_\{([^}]*)\}/g, (_, c: string) => toSub(c));
  s = s.replace(/_([A-Za-z0-9]+)/g, (_, c: string) => toSub(c));
  return s.replace(/\s+/g, " ").trim();
}

/* ---------- number formatting ---------- */
export const kelvin = (tC: number) => tC + 273.15;

export function fmtTemp(tC: number): string {
  return `${Math.round(tC).toLocaleString("en-US")} °C`;
}

export function fmtG(v: number): string {
  const a = Math.abs(v);
  const s = a >= 100 ? v.toFixed(0) : v.toFixed(1);
  return `${v > 0 ? "+" : ""}${s}`;
}

export function fmtAxis(v: number): string {
  return `${v}`.replace("-", "−");
}

/* ---------- linear interpolation along a segment ---------- */
export function gAt(seg: Segment, tC: number): number | null {
  if (seg.t1 === seg.t0) return null; // zero-width (reference point at 0 K)
  if (tC < seg.t0 || tC > seg.t1) return null;
  return seg.g0 + ((seg.g1 - seg.g0) * (tC - seg.t0)) / (seg.t1 - seg.t0);
}

export const R = 8.314; // J mol⁻¹ K⁻¹

/**
 * Gas-equilibrium readout at temperature T.
 * For every gaseous reference (O₂, N₂, F₂, Cl₂, H₂, S₂) the formation
 * reaction consumes 1 mol of gas, so K = 1/p_gas and
 * log₁₀ p_gas = ΔG° / (2.303 RT). Carbides have solid carbon: log K only.
 */
const GAS_LABEL: Record<string, string> = {
  "O₂": "pO₂", "N₂": "pN₂", "F₂": "pF₂", "Cl₂": "pCl₂", "H₂": "pH₂", "S₂": "pS₂",
};

export function equilibrium(family: Family, gKJ: number, tC: number, pressure: number = 1.0): string {
  const T = kelvin(tC);
  if (T <= 0) return "—";
  const label = GAS_LABEL[family.gas];
  if (label) {
    // ΔG = -RT ln(K) where K = 1/p for standard state
    // With non-standard pressure: ΔG' = ΔG° + RT ln(p/p°)
    // log₁₀(p_eq) = ΔG° / (2.303 RT) when p° = 1 atm
    const logP = (gKJ * 1000) / (2.303 * R * T);
    if (pressure !== 1.0) {
      // Adjust for non-standard pressure
      const correctedLogP = logP + Math.log10(pressure);
      if (correctedLogP > 3) return `${label} ≈ ${correctedLogP.toFixed(1)} atm (p=${pressure} atm)`;
      return `${label} ≈ 10${toSup(correctedLogP.toFixed(1))} atm (p=${pressure} atm)`;
    }
    if (logP > 3) return `${label} ≈ ${logP.toFixed(1)} atm`;
    return `${label} ≈ 10${toSup(logP.toFixed(1))} atm`;
  }
  const logK = (-gKJ * 1000) / (2.303 * R * T);
  return `log K ≈ ${logK > 0 ? "" : "−"}${Math.abs(logK).toFixed(1)}`;
}

/** Calculate effective ΔG at a given pressure */
export function gAtPressure(gStandard: number, tC: number, pressure: number): number {
  const T = kelvin(tC);
  if (T <= 0 || pressure <= 0) return gStandard;
  // ΔG' = ΔG° + RT ln(p/p°), with p° = 1 atm
  const correction = (R * T * Math.log(pressure)) / 1000; // convert J to kJ
  return gStandard + correction;
}

/** Piecewise-linear thermodynamics: slope = −ΔS, and ΔH = ΔG + T·ΔS (T in K). */
export function segmentThermo(seg: Segment): { dS: number; dH: number } | null {
  if (seg.t1 === seg.t0) return null;
  const slope = (seg.g1 - seg.g0) / (seg.t1 - seg.t0); // kJ per K (per °C)
  const dS = -slope * 1000; // J mol⁻¹ K⁻¹
  const dH = seg.g0 + (seg.t0 + 273.15) * dS / 1000; // kJ
  return { dS, dH };
}

export interface ProbeHit {
  seg: Segment;
  g: number;
  eq: string;
}

export function probeHits(segments: Segment[], family: Family, tC: number, pressure: number = 1.0): ProbeHit[] {
  const hits: ProbeHit[] = [];
  for (const seg of segments) {
    let g = gAt(seg, tC);
    if (g !== null && pressure !== 1.0) {
      g = gAtPressure(g, tC, pressure);
    }
    if (g !== null) hits.push({ seg, g, eq: equilibrium(family, g, tC, pressure) });
  }
  return hits.sort((a, b) => a.g - b.g);
}
