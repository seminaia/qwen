import type { Family, Segment } from "../data/ellingham";
import { PHASES } from "../data/ellingham";
import { fmtG, formatReaction, gAt, kelvin, segmentThermo, type ProbeHit } from "../lib/thermo";

function LineGlyph({ dash, opacity, color }: { dash: string; opacity: number; color: string }) {
  return (
    <svg width="26" height="8" className="shrink-0 mt-0.5">
      <line x1="1" y1="4" x2="25" y2="4" stroke={color} strokeWidth="2" strokeDasharray={dash || undefined} strokeLinecap="round" opacity={Math.max(opacity, 0.5)} />
    </svg>
  );
}

interface Props {
  family: Family;
  hits: ProbeHit[];
  probeT: number;
  pressure: number;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  pinnedSeg: Segment | null;
  onPin: (id: string | null) => void;
}

export default function ProbePanel({ family, hits, probeT, pressure, hoverId, onHover, pinnedSeg, onPin }: Props) {
  const pinnedG = pinnedSeg ? gAt(pinnedSeg, probeT) : null;
  const thermo = pinnedSeg ? segmentThermo(pinnedSeg) : null;

  return (
    <div className="flex flex-col h-full">
      {/* pinned detail */}
      {pinnedSeg && (
        <div className="fade-in mb-3 rounded-lg border p-3.5" style={{ borderColor: `${family.color}55`, background: `${family.color}0d` }}>
          <div className="flex items-start justify-between gap-2">
            <div className="font-mono text-[13px] text-ink-100 leading-snug">{formatReaction(pinnedSeg.rxn)}</div>
            <button
              onClick={() => onPin(null)}
              aria-label="Unpin reaction"
              className="shrink-0 w-6 h-6 grid place-items-center rounded border border-ink-600 text-ink-300 hover:text-ink-100 hover:border-ink-400 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[11px]">
            <div className="text-ink-400">phase</div>
            <div className="text-ink-200 text-right">{PHASES[pinnedSeg.phase].metal} metal → {PHASES[pinnedSeg.phase].compound} cpd</div>
            <div className="text-ink-400">range</div>
            <div className="text-ink-200 text-right">{Math.round(pinnedSeg.t0)} – {Math.round(pinnedSeg.t1)} °C</div>
            <div className="text-ink-400">ΔG at probe</div>
            <div className="text-right" style={{ color: family.color }}>{pinnedG !== null ? `${fmtG(pinnedG)} kJ` : "out of range"}</div>
            {thermo && (
              <>
                <div className="text-ink-400">ΔS° (slope)</div>
                <div className="text-ink-200 text-right">{thermo.dS > 0 ? "+" : ""}{thermo.dS.toFixed(1)} J·K⁻¹</div>
                <div className="text-ink-400">ΔH° ≈</div>
                <div className="text-ink-200 text-right">{fmtG(thermo.dH)} kJ</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* live ranking */}
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display font-semibold text-sm tracking-wide text-ink-200">Stability ranking</h3>
        <span className="font-mono text-[11px] text-ink-400">{hits.length} active at T</span>
      </div>

      {hits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-700 p-5 text-center text-[12px] text-ink-400">
          No segments span this temperature — drag the probe or re-enable phases.
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto thin-scroll -mr-1 pr-1">
          <ol className="space-y-1">
            {hits.map(({ seg, g, eq }, i) => {
              const ph = PHASES[seg.phase];
              const hot = hoverId === seg.id;
              return (
                <li key={seg.id}>
                  <button
                    onPointerEnter={() => onHover(seg.id)}
                    onPointerLeave={() => onHover(null)}
                    onClick={() => onPin(seg.id)}
                    className={`w-full flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 text-left transition-all duration-150 ${
                      hot ? "bg-ink-800 border-ink-600 translate-x-0.5" : "border-transparent hover:bg-ink-850 hover:border-ink-700"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-ink-400 w-4 shrink-0 text-right">{i + 1}</span>
                    <LineGlyph dash={ph.dash} opacity={ph.opacity} color={family.color} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-mono text-[12px] text-ink-100 truncate">{formatReaction(seg.rxn)}</span>
                      <span className="block font-mono text-[10px] text-ink-400">{eq} · <span style={{ color: `${family.color}aa` }}>{seg.phase}</span></span>
                    </span>
                    <span className="font-mono text-[12.5px] font-medium tabular-nums shrink-0" style={{ color: family.color }}>
                      {fmtG(g)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="mt-3 pt-2.5 border-t border-ink-800 font-mono text-[10.5px] leading-relaxed text-ink-400">
        kJ per mol {family.gas} · T = {Math.round(probeT).toLocaleString("en-US")} °C = {Math.round(kelvin(probeT)).toLocaleString("en-US")} K · p = {pressure.toFixed(2)} atm · hover to trace, click to pin
      </div>
    </div>
  );
}
