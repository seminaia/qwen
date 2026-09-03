import { useMemo } from "react";
import {
  ELEMENT_GROUPS, ELEMENTS, FAMILIES, PHASES, PHASE_ORDER,
  type Family, type FamilyKey, type PhaseKey,
} from "../data/ellingham";

/* ------------------------------------------------------------------ */
export function FamilyTabs({
  active, onChange,
}: { active: FamilyKey; onChange: (k: FamilyKey) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto thin-scroll pb-1">
      {FAMILIES.map((f) => {
        const on = f.key === active;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={`group relative shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-md border transition-all duration-200 ${
              on
                ? "border-transparent bg-ink-800 text-ink-100 shadow-lg"
                : "border-ink-700/60 bg-ink-900/40 text-ink-300 hover:text-ink-100 hover:border-ink-600 hover:-translate-y-px"
            }`}
            style={on ? { boxShadow: `inset 0 -2px 0 ${f.color}, 0 8px 24px -12px ${f.glow}` } : undefined}
          >
            <span
              className="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-125"
              style={{ background: f.color, boxShadow: on ? `0 0 10px ${f.glow}` : "none" }}
            />
            <span className="font-display font-semibold text-sm tracking-wide">{f.name}</span>
            <span className="font-mono text-[11px] text-ink-400">{f.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
function Glyph({ phase, color, active }: { phase: PhaseKey; color: string; active: boolean }) {
  const ph = PHASES[phase];
  return (
    <svg width="34" height="8" className="shrink-0">
      <line
        x1="1" y1="4" x2="33" y2="4"
        stroke={active ? color : "#6b7686"}
        strokeWidth="2"
        strokeDasharray={ph.dash || undefined}
        strokeLinecap={ph.cap ?? "butt"}
        opacity={active ? ph.opacity : 0.35}
      />
    </svg>
  );
}

const METALS: ("solid" | "liquid" | "gas")[] = ["solid", "liquid", "gas"];
const COMPOUNDS: ("solid" | "liquid" | "gas")[] = ["solid", "liquid", "gas"];

export function PhaseMatrix({
  color, active, onToggle, onSetAll,
}: {
  color: string;
  active: Set<PhaseKey>;
  onToggle: (p: PhaseKey) => void;
  onSetAll: (all: boolean) => void;
}) {
  const code = (m: string, c: string) => `${m[0]}${c[0]}` as PhaseKey;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-display font-semibold text-sm tracking-wide text-ink-200">
          Phase regime
        </h3>
        <div className="flex gap-1">
          <button onClick={() => onSetAll(true)} className="px-2 py-0.5 rounded text-[10.5px] font-mono text-ink-300 border border-ink-700 hover:border-ink-500 hover:text-ink-100 transition-colors">all</button>
          <button onClick={() => onSetAll(false)} className="px-2 py-0.5 rounded text-[10.5px] font-mono text-ink-300 border border-ink-700 hover:border-ink-500 hover:text-ink-100 transition-colors">none</button>
        </div>
      </div>

      <div className="grid grid-cols-[46px_repeat(3,1fr)] gap-1 items-center">
        <div />
        {METALS.map((m) => (
          <div key={`mh-${m}`} className="text-center pb-1">
            <div className="text-[9.5px] font-mono uppercase tracking-widest text-ink-400">{m[0]}·metal</div>
          </div>
        ))}
        {COMPOUNDS.map((c) => (
          <div key={`row-${c}`} className="contents">
            <div className="text-right pr-1.5">
              <span className="text-[9.5px] font-mono uppercase tracking-widest text-ink-400">{c[0]}·cpd</span>
            </div>
            {METALS.map((m) => {
              const p = code(m, c);
              const on = active.has(p);
              return (
                <button
                  key={p}
                  onClick={() => onToggle(p)}
                  title={`${m} metal → ${c} compound`}
                  className={`flex flex-col items-center gap-0.5 py-1.5 rounded border transition-all duration-150 ${
                    on
                      ? "border-ink-600 bg-ink-800 hover:border-ink-500"
                      : "border-transparent bg-ink-900/60 opacity-50 hover:opacity-80"
                  }`}
                  style={on ? { borderColor: `${color}55` } : undefined}
                >
                  <Glyph phase={p} color={color} active={on} />
                  <span className={`font-mono text-[10px] ${on ? "text-ink-200" : "text-ink-400"}`}>{p}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
        Dash encodes the <em className="not-italic text-ink-300">metal</em> state, opacity the{" "}
        <em className="not-italic text-ink-300">compound</em> state — kinks in a line mark melting or vaporisation.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function ElementFilter({
  family, selected, onChange,
}: {
  family: Family;
  selected: Set<string> | null;
  onChange: (s: Set<string> | null) => void;
}) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of PHASE_ORDER) {
      for (const seg of family.phases[p]) m.set(seg.element, (m.get(seg.element) ?? 0) + 1);
    }
    return m;
  }, [family]);

  const present = useMemo(() => [...counts.keys()].sort(), [counts]);
  const grouped = ELEMENT_GROUPS.filter((g) => g.symbols.some((s) => present.includes(s)));

  const toggle = (sym: string) => {
    const next = new Set(selected ?? []);
    if (next.has(sym)) next.delete(sym);
    else next.add(sym);
    onChange(next.size === 0 || next.size === present.length ? null : next);
  };

  const setGroup = (syms: string[]) => {
    const next = new Set(syms.filter((s) => present.includes(s)));
    onChange(next.size === present.length ? null : next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-display font-semibold text-sm tracking-wide text-ink-200">Elements</h3>
        <button
          onClick={() => onChange(null)}
          className={`px-2 py-0.5 rounded text-[10.5px] font-mono border transition-colors ${
            selected === null
              ? "border-ink-500 text-ink-100 bg-ink-800"
              : "border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100"
          }`}
        >
          all
        </button>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {grouped.map((g) => (
          <button
            key={g.label}
            onClick={() => setGroup(g.symbols)}
            className="px-2 py-0.5 rounded text-[10.5px] font-mono text-ink-400 border border-ink-800 hover:border-ink-600 hover:text-ink-200 transition-colors"
          >
            {g.label.toLowerCase()}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {present.map((sym) => {
          const on = selected === null || selected.has(sym);
          const info = ELEMENTS[sym];
          return (
            <button
              key={sym}
              onClick={() => toggle(sym)}
              title={`${info?.name ?? sym} · ${counts.get(sym)} segments`}
              className={`group flex items-baseline gap-1 px-2 py-1 rounded border font-mono text-[12px] transition-all duration-150 ${
                on
                  ? "border-ink-600 bg-ink-800 text-ink-100"
                  : "border-ink-800 bg-transparent text-ink-400 opacity-60 hover:opacity-100"
              }`}
              style={on && selected ? { borderColor: `${family.color}66`, color: family.color } : undefined}
            >
              <span className="font-semibold">{sym}</span>
              <span className="text-[9.5px] text-ink-400 group-hover:text-ink-300">{counts.get(sym)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-ink-400">
        {selected === null
          ? "Showing every element in this family."
          : `${selected.size} of ${present.length} elements selected.`}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
export function Sources({ family }: { family: Family }) {
  return (
    <div className="text-[11px] leading-relaxed text-ink-400 space-y-2">
      <h3 className="font-display font-semibold text-sm tracking-wide text-ink-200 mb-1.5">Sources</h3>
      <p>
        <span className="text-ink-300">{family.gas === "C" ? "Carbide" : `${family.gas}`} data</span> — Reed, T.B. (1971).{" "}
        <em>Free Energy of Formation of Binary Compounds</em>. MIT Press, Cambridge, Mass.
      </p>
      <p>
        <span className="text-ink-300">Carbon data</span> — Coltters, R.G. (1985). Thermodynamics of binary metallic
        carbides: a review. <em>Materials Science and Engineering</em> 76, 1–50.
      </p>
      <p>
        <span className="text-ink-300">Hydrides, sulfides &amp; added salts</span> — linear ΔH − TΔS segments compiled
        from Barin, I. (1993), <em>Thermochemical Data of Pure Substances</em>, VCH.
      </p>
      <p className="pt-1 border-t border-ink-800 font-mono text-[10.5px]">
        original tables: K → °C, kcal → kJ (×4.184), per mole of {family.gas === "C" ? "C" : family.gas}
      </p>
    </div>
  );
}
