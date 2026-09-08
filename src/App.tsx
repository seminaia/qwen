import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import EllinghamChart from "./components/EllinghamChart";
import ProbePanel from "./components/ProbePanel";
import { ElementFilter, FamilyTabs, PhaseMatrix, Sources } from "./components/Panels";
import { familyByKey, PHASE_ORDER, type FamilyKey, type PhaseKey } from "./data/ellingham";
import { fmtTemp, kelvin, probeHits } from "./lib/thermo";

/* ---------------- scroll reveal ---------------- */
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${vis ? "is-visible" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- ambient embers ---------------- */
const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 6.7 + 2.4) % 100,
  size: 2 + (i % 3),
  dur: 16 + (i % 6) * 5,
  delay: -(i * 3.1),
  ex: (i % 2 ? 1 : -1) * (18 + i * 2.4),
  eo: 0.18 + (i % 4) * 0.09,
  color: i % 4 === 1 ? "#4aa8ff" : i % 4 === 3 ? "#e8b23e" : "#ff5c38",
}));

const TEMP_PRESETS = [
  { label: "25 °C", t: 25 },
  { label: "700 °C", t: 700 },
  { label: "1000 °C", t: 1000 },
  { label: "Fe m.p. 1538", t: 1538 },
  { label: "2000 °C", t: 2000 },
];

function BrandMark({ color }: { color: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className="shrink-0">
      <rect x="1" y="1" width="32" height="32" rx="6" fill="none" stroke="#37404f" strokeWidth="1.5" />
      <line x1="6" y1="27" x2="28" y2="27" stroke="#6b7686" strokeWidth="1" />
      <line x1="7" y1="6" x2="7" y2="27" stroke="#6b7686" strokeWidth="1" />
      <line x1="8" y1="10" x2="27" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="14" x2="27" y2="17" stroke="#4aa8ff" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="24" x2="27" y2="9" stroke="#e8b23e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const PRESSURE_PRESETS = [
  { label: "0.01 atm", p: 0.01 },
  { label: "0.1 atm", p: 0.1 },
  { label: "1 atm", p: 1.0 },
  { label: "10 atm", p: 10.0 },
  { label: "100 atm", p: 100.0 },
];

export default function App() {
  const [familyKey, setFamilyKey] = useState<FamilyKey>("oxides");
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [phases, setPhases] = useState<Set<PhaseKey>>(new Set(PHASE_ORDER));
  const [probeT, setProbeT] = useState(1000);
  const [pressure, setPressure] = useState(1.0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const family = familyByKey(familyKey);

  useEffect(() => { setPinnedId(null); setHoverId(null); }, [familyKey]);

  const segments = useMemo(
    () =>
      PHASE_ORDER.filter((p) => phases.has(p)).flatMap((p) =>
        family.phases[p].filter((s) => selected === null || selected.has(s.element)),
      ),
    [family, phases, selected],
  );

  const hits = useMemo(() => probeHits(segments, family, probeT, pressure), [segments, family, probeT, pressure]);
  const pinnedSeg = useMemo(() => segments.find((s) => s.id === pinnedId) ?? null, [segments, pinnedId]);

  const animKey = useMemo(
    () =>
      `${familyKey}|${[...phases].sort().join("")}|${selected ? [...selected].sort().join("") : "all"}`,
    [familyKey, phases, selected],
  );

  const togglePhase = (p: PhaseKey) =>
    setPhases((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  return (
    <div className="min-h-screen font-body text-ink-100">
      <div className="ambient" />
      <div className="ambient-grid" />
      {EMBERS.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            background: e.color,
            boxShadow: `0 0 ${e.size * 3}px ${e.color}`,
            animationDuration: `${e.dur}s`,
            animationDelay: `${e.delay}s`,
            ["--ex" as never]: `${e.ex}px`,
            ["--eo" as never]: e.eo,
          }}
        />
      ))}

      {/* ---------------- header ---------------- */}
      <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur-md">
        <div className="max-w-[1660px] mx-auto px-4 lg:px-6 py-3 flex items-center gap-4">
          <BrandMark color={family.color} />
          <div className="min-w-0">
            <h1 className="font-display font-bold text-lg sm:text-xl tracking-tight leading-none">
              ELLINGHAM<span className="text-ink-400 font-medium"> ATLAS</span>
            </h1>
            <p className="text-[11px] text-ink-400 mt-1 truncate">
              standard free energies of formation · seven anion families · Reed 1971 &amp; Coltters 1985
            </p>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-5">
            <a
              href="/ellingham.py"
              download="ellingham.py"
              className="group flex items-center gap-2 rounded-md border border-ink-700 px-3 py-1.5 font-mono text-[11px] text-ink-300 transition-all duration-150 hover:text-ink-950 hover:border-transparent"
              style={{ background: "rgba(255,255,255,0.03)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = family.color)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v7m0 0L3.4 5.4M6 8l2.6-2.6M1.5 10.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              ellingham.py
            </a>
            <div className="font-mono text-[12px] text-ink-300">
              ΔG°<sub>f</sub> = ΔH° − T·ΔS°
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-ink-400">
              <span className="status-dot w-2 h-2 rounded-full" style={{ background: family.color, boxShadow: `0 0 8px ${family.glow}` }} />
              probe {fmtTemp(probeT)} · p = {pressure.toFixed(2)} atm
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1660px] mx-auto px-4 lg:px-6 pt-5 pb-16">
        {/* family tabs + blurb */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:gap-6 mb-4">
          <FamilyTabs active={familyKey} onChange={setFamilyKey} />
          <p key={`blurb-${familyKey}`} className="fade-in text-[12.5px] leading-relaxed text-ink-300 xl:max-w-md xl:ml-auto">
            {family.blurb}
          </p>
        </div>

        {/* ---------------- workbench grid ---------------- */}
        <div className="grid gap-4 lg:grid-cols-[288px_minmax(0,1fr)] xl:grid-cols-[288px_minmax(0,1fr)_344px]">
          {/* left rail */}
          <aside className="space-y-4 order-2 lg:order-1">
            <section className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
              <ElementFilter family={family} selected={selected} onChange={setSelected} />
            </section>
            <section className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
              <PhaseMatrix color={family.color} active={phases} onToggle={togglePhase} onSetAll={(all) => setPhases(all ? new Set(PHASE_ORDER) : new Set())} />
            </section>
            <section className="rounded-xl border border-ink-800 bg-ink-900/70 p-4">
              <Sources family={family} />
            </section>
          </aside>

          {/* chart */}
          <section className="order-1 lg:order-2 rounded-xl border border-ink-800 bg-ink-900/70 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
              <h2 className="font-display font-semibold tracking-wide text-[15px]">
                <span style={{ color: family.color }}>{family.name}</span>
                <span className="text-ink-400 font-mono text-[12px] ml-2">{family.yLabel}</span>
              </h2>
              <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-ink-400">
                <span>{segments.length} segments</span>
                <span className="w-1 h-1 rounded-full bg-ink-600" />
                <span>{hits.length} spanning probe</span>
              </div>
            </div>

            <div className="overflow-x-auto thin-scroll">
              <div className="min-w-[860px]">
                <EllinghamChart
                  family={family}
                  segments={segments}
                  probeT={probeT}
                  onProbe={setProbeT}
                  hoverId={hoverId}
                  onHover={setHoverId}
                  pinnedId={pinnedId}
                  onPin={setPinnedId}
                  animKey={animKey}
                />
              </div>
            </div>

            {/* temperature control */}
            <div className="mt-auto px-4 sm:px-6 pb-4 pt-3 border-t border-ink-800/70 bg-ink-900/60">
              <div className="flex items-center gap-4 mt-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-400 shrink-0">furnace</span>
                <input
                  type="range"
                  className="temp-slider flex-1"
                  min={-273}
                  max={2050}
                  step={1}
                  value={Math.max(-273, Math.min(2050, probeT))}
                  onChange={(e) => setProbeT(Number(e.target.value))}
                  aria-label="Probe temperature in degrees Celsius"
                />
                <div className="font-mono text-[13px] tabular-nums shrink-0 w-[150px] text-right">
                  <span className="text-probe">{fmtTemp(probeT)}</span>
                  <span className="text-ink-400 text-[10.5px] block">{Math.round(kelvin(probeT)).toLocaleString("en-US")} K</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {TEMP_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setProbeT(p.t)}
                    className={`px-2.5 py-1 rounded font-mono text-[11px] border transition-all duration-150 ${
                      probeT === p.t
                        ? "border-probe/60 text-probe bg-probe/10"
                        : "border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              
              {/* pressure control */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-ink-800/50">
                <span className="font-mono text-[11px] uppercase tracking-widest text-ink-400 shrink-0">pressure</span>
                <input
                  type="range"
                  className="temp-slider flex-1"
                  min={-2}
                  max={2}
                  step={0.1}
                  value={Math.log10(pressure)}
                  onChange={(e) => setPressure(Math.pow(10, Number(e.target.value)))}
                  aria-label="Gas pressure in atm (log scale)"
                />
                <div className="font-mono text-[13px] tabular-nums shrink-0 w-[120px] text-right">
                  <span className="text-probe">{pressure >= 0.01 && pressure <= 999 ? pressure.toFixed(2) : pressure.toExponential(1)}</span>
                  <span className="text-ink-400 text-[10.5px] block">atm</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {PRESSURE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setPressure(p.p)}
                    className={`px-2.5 py-1 rounded font-mono text-[11px] border transition-all duration-150 ${
                      pressure === p.p
                        ? "border-probe/60 text-probe bg-probe/10"
                        : "border-ink-700 text-ink-300 hover:border-ink-500 hover:text-ink-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* right rail */}
          <aside className="order-3 rounded-xl border border-ink-800 bg-ink-900/70 p-4 h-[540px] xl:h-auto min-h-0 overflow-hidden flex flex-col lg:col-span-2 xl:col-span-1">
            <ProbePanel
              family={family}
              hits={hits}
              probeT={probeT}
              pressure={pressure}
              hoverId={hoverId}
              onHover={setHoverId}
              pinnedSeg={pinnedSeg}
              onPin={setPinnedId}
            />
          </aside>
        </div>

        {/* ---------------- reading guide ---------------- */}
        <section className="mt-20 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] items-start">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-ink-400 mb-4">Reading the chart</p>
            <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[0.98]">
              Lower lines
              <br />
              <span style={{ color: family.color }}>win the anion.</span>
            </h2>
            <p className="mt-6 text-[14.5px] leading-relaxed text-ink-300 max-w-md">
              An Ellingham diagram ranks compound stability: at any temperature, the element whose line sits lowest
              holds the anion most tightly — and will strip it from every compound plotted above. That single rule is
              the entire logic of smelting, roasting and reactive-gas purification.
            </p>
          </Reveal>

          <div className="space-y-8">
            {[
              {
                n: "01",
                t: "The slope is entropy",
                d: "d(ΔG)/dT = −ΔS. Lines climb steeply when a gas is consumed (metal + O₂ → solid oxide loses disorder) and fall when gas is produced — which is why 2C + O₂ → 2CO slopes downward against every other oxide.",
              },
              {
                n: "02",
                t: "Kinks are phase changes",
                d: "Melting or boiling the metal changes ΔS abruptly, so the line bends. The 3 × 3 phase matrix on the left decodes every regime: dash pattern for the metal, line weight for the compound.",
              },
              {
                n: "03",
                t: "Carbon crosses everything",
                d: "Because the CO line descends, it eventually undercuts every metal oxide. Above each crossing temperature carbon is a legal reductant — the reason blast furnaces and carbothermic processes run hot.",
              },
              {
                n: "04",
                t: "Read it live",
                d: "Drag the furnace slider and the crosshair re-ranks every reaction in real time — ΔG values, equilibrium pO₂ or log K, and which phase regime each line is in at that exact temperature.",
              },
            ].map((item, i) => (
              <Reveal key={item.n} delay={i * 90}>
                <div className="group flex gap-5 border-l-2 border-ink-800 pl-5 py-1 transition-colors duration-300 hover:border-ink-500">
                  <span className="font-mono text-[13px] pt-0.5 text-ink-400 group-hover:text-ink-200 transition-colors shrink-0">{item.n}</span>
                  <div>
                    <h3 className="font-display font-semibold text-lg tracking-tight group-hover:translate-x-0.5 transition-transform duration-300">{item.t}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-300">{item.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      {/* ---------------- footer ---------------- */}
      <footer className="border-t border-ink-800/80">
        <div className="max-w-[1660px] mx-auto px-4 lg:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <p className="font-mono text-[11px] text-ink-400">
            Ellingham Atlas — interactive port of <span className="text-ink-200">ellingham_sep.py</span> · K → °C · kcal → kJ (×4.184)
          </p>
          <p className="font-mono text-[11px] text-ink-400">
            O₂, N₂, F₂, Cl₂ — <span className="text-ink-200">Reed, MIT Press, 1971</span> · C — <span className="text-ink-200">Coltters, Mater. Sci. Eng. 76, 1985</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
