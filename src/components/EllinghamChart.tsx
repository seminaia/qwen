import { useMemo, useRef, useState } from "react";
import type { Family, Segment } from "../data/ellingham";
import { PHASES } from "../data/ellingham";
import { fmtAxis, fmtG, formatReaction, gAt, kelvin } from "../lib/thermo";

const VW = 1280;
const VH = 820;
const ML = 86;
const MR = 26;
const MT = 28;
const MB = 60;
const PW = VW - ML - MR;
const PH = VH - MT - MB;

const X0 = -780;
const X1 = 2060;
const Y0 = -1350;
const Y1 = 60;

const sx = (t: number) => ML + ((t - X0) / (X1 - X0)) * PW;
const sy = (g: number) => MT + ((Y1 - g) / (Y1 - Y0)) * PH;

const X_TICKS = Array.from({ length: 11 }, (_, i) => i * 200);
const Y_TICKS = Array.from({ length: 14 }, (_, i) => -1300 + i * 100);

interface Props {
  family: Family;
  segments: Segment[];
  probeT: number;
  onProbe: (t: number) => void;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  pinnedId: string | null;
  onPin: (id: string | null) => void;
  animKey: string;
}

export default function EllinghamChart({
  family, segments, probeT, onProbe, hoverId, onHover, pinnedId, onPin, animKey,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const focusId = hoverId ?? pinnedId;
  const focusSeg = useMemo(
    () => segments.find((s) => s.id === focusId) ?? null,
    [segments, focusId],
  );

  const probeClamped = Math.max(X0, Math.min(X1, probeT));
  const probeX = sx(probeClamped);

  const intersections = useMemo(
    () =>
      segments
        .map((seg) => ({ seg, g: gAt(seg, probeClamped) }))
        .filter((h): h is { seg: Segment; g: number } => h.g !== null),
    [segments, probeClamped],
  );

  function pointerToData(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * VW;
    const py = ((e.clientY - rect.top) / rect.height) * VH;
    const t = X0 + ((px - ML) / PW) * (X1 - X0);
    return { px, py, t };
  }

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const { px, py, t } = pointerToData(e);
    setCursor({ x: px, y: py });
    const clamped = Math.round(Math.max(-273.15, Math.min(2050, t)));
    if (clamped !== probeT) onProbe(clamped);
  }

  const chipText = `${Math.round(probeClamped).toLocaleString("en-US")} °C · ${Math.round(kelvin(probeClamped)).toLocaleString("en-US")} K`;
  const chipW = chipText.length * 7.4 + 20;
  const chipX = Math.min(Math.max(probeX - chipW / 2, ML + 4), VW - MR - chipW - 4);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full h-auto block"
      onPointerMove={handleMove}
      onPointerLeave={() => { setCursor(null); onHover(null); }}
      role="img"
      aria-label={`Ellingham diagram — ${family.name}`}
    >
      <defs>
        <clipPath id="plot-clip">
          <rect x={ML} y={MT} width={PW} height={PH} />
        </clipPath>
        <radialGradient id="probe-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb454" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffb454" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* plot background */}
      <rect x={ML} y={MT} width={PW} height={PH} fill="rgba(255,255,255,0.012)" stroke="#262d3a" strokeWidth="1" />

      {/* grid */}
      <g>
        {X_TICKS.map((t) => (
          <line key={`gx${t}`} x1={sx(t)} y1={MT} x2={sx(t)} y2={MT + PH} stroke="#e9e7e0" strokeOpacity={t === 0 ? 0 : 0.05} />
        ))}
        {Y_TICKS.map((g) => (
          <line key={`gy${g}`} x1={ML} y1={sy(g)} x2={ML + PW} y2={sy(g)} stroke="#e9e7e0" strokeOpacity={g === 0 ? 0 : 0.05} />
        ))}
        {/* absolute zero */}
        <line x1={sx(-273.15)} y1={MT} x2={sx(-273.15)} y2={MT + PH} stroke="#6b7686" strokeOpacity="0.4" strokeDasharray="3 6" />
        {/* axes */}
        <line x1={sx(0)} y1={MT} x2={sx(0)} y2={MT + PH} stroke="#97a1b0" strokeOpacity="0.55" strokeWidth="1.2" />
        <line x1={ML} y1={sy(0)} x2={ML + PW} y2={sy(0)} stroke="#97a1b0" strokeOpacity="0.55" strokeWidth="1.2" />
      </g>

      {/* tick labels */}
      <g fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#6b7686">
        {X_TICKS.map((t) => (
          <text key={`tx${t}`} x={sx(t)} y={MT + PH + 22} textAnchor="middle">{t}</text>
        ))}
        <text x={sx(-273.15)} y={MT + PH + 22} textAnchor="middle" fill="#97a1b0">0 K</text>
        {Y_TICKS.map((g) => (
          <text key={`ty${g}`} x={ML - 10} y={sy(g) + 4} textAnchor="end">{fmtAxis(g)}</text>
        ))}
      </g>

      {/* axis titles */}
      <text x={ML + PW * 0.64} y={VH - 14} textAnchor="middle" fontSize="13.5" fill="#97a1b0" fontFamily="IBM Plex Sans, sans-serif" letterSpacing="0.06em">
        TEMPERATURE · °C
      </text>
      <text
        transform={`translate(22 ${MT + PH * 0.5}) rotate(-90)`}
        textAnchor="middle" fontSize="13.5" fill="#97a1b0" fontFamily="IBM Plex Sans, sans-serif" letterSpacing="0.06em"
      >
        {`ΔG°f — kJ / mol ${family.gas}`}
      </text>
      {/* y unit superscript handled in plain text; add small note top-left */}
      <text x={ML + 8} y={MT + 16} fontSize="11.5" fill="#6b7686" fontFamily="IBM Plex Mono, monospace">
        more negative → more stable
      </text>

      {/* segments */}
      <g key={animKey} clipPath="url(#plot-clip)">
        {segments.map((seg, i) => {
          const ph = PHASES[seg.phase];
          const dim = focusId !== null && seg.id !== focusId;
          const op = dim ? Math.min(ph.opacity, 0.14) : ph.opacity;
          const strokeW = seg.id === focusId ? 3 : 1.9;
          const x0 = sx(seg.t0);
          const y0 = sy(seg.g0);
          const x1 = sx(seg.t1);
          const y1 = sy(seg.g1);
          const zero = seg.t1 === seg.t0;
          return (
            <g key={seg.id} className="seg-in" style={{ animationDelay: `${Math.min(i * 16, 640)}ms` }}>
              {zero ? (
                <circle cx={x0} cy={y0} r={3.4} fill={family.color} opacity={op} />
              ) : (
                <>
                  <line
                    x1={x0} y1={y0} x2={x1} y2={y1}
                    stroke={family.color} strokeWidth={strokeW}
                    strokeDasharray={ph.dash || undefined}
                    strokeLinecap={ph.cap ?? "butt"}
                    opacity={op}
                    style={{ transition: "opacity 0.25s ease, stroke-width 0.15s ease" }}
                  />
                  <circle cx={x0} cy={y0} r={2.4} fill={family.color} opacity={op} />
                  <circle cx={x1} cy={y1} r={2.4} fill={family.color} opacity={op} />
                </>
              )}
              {/* hit area */}
              {zero ? (
                <circle
                  cx={x0} cy={y0} r={9} fill="transparent"
                  style={{ cursor: "pointer" }}
                  onPointerEnter={() => onHover(seg.id)}
                  onPointerLeave={() => onHover(null)}
                  onClick={() => onPin(pinnedId === seg.id ? null : seg.id)}
                />
              ) : (
                <line
                  x1={x0} y1={y0} x2={x1} y2={y1}
                  stroke="transparent" strokeWidth={11}
                  style={{ cursor: "pointer" }}
                  onPointerEnter={() => onHover(seg.id)}
                  onPointerLeave={() => onHover(null)}
                  onClick={() => onPin(pinnedId === seg.id ? null : seg.id)}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* ss labels (as in the original plot) */}
      <g clipPath="url(#plot-clip)" pointerEvents="none">
        {segments
          .filter((s) => s.phase === "ss")
          .map((seg) => {
            const dim = focusId !== null && seg.id !== focusId;
            return (
              <text
                key={`lb-${seg.id}`}
                x={sx(seg.t0) - 10}
                y={sy(seg.g0 + seg.offset)}
                textAnchor="end"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
                fill={family.color}
                opacity={dim ? 0.15 : 0.92}
                stroke="#0e1116"
                strokeWidth={3}
                paintOrder="stroke"
                style={{ transition: "opacity 0.2s ease" }}
              >
                {formatReaction(seg.rxn)}
              </text>
            );
          })}
      </g>

      {/* probe crosshair */}
      <g clipPath="url(#plot-clip)" pointerEvents="none">
        <circle cx={probeX} cy={MT + PH - 30} r={90} fill="url(#probe-glow)" />
        <line x1={probeX} y1={MT} x2={probeX} y2={MT + PH} stroke="#ffb454" strokeWidth="1.1" strokeOpacity="0.8" strokeDasharray="5 4" />
        {intersections.map(({ seg, g }) => (
          <g key={`pt-${seg.id}`}>
            <circle cx={sx(probeClamped)} cy={sy(g)} r={9} fill="none" stroke="#ffb454" strokeOpacity="0.5" strokeWidth="1" className="probe-pulse" style={{ display: seg.id === focusId ? undefined : "none" }} />
            <circle
              cx={sx(probeClamped)} cy={sy(g)}
              r={seg.id === focusId ? 4.6 : 3.2}
              fill={family.color} stroke="#0e1116" strokeWidth="1.4"
            />
          </g>
        ))}
      </g>

      {/* temperature chip */}
      <g pointerEvents="none">
        <rect x={chipX} y={MT + 8} width={chipW} height={25} rx={5} fill="#161a22" stroke="#37404f" />
        <rect x={chipX} y={MT + 8} width={3} height={25} rx={1.5} fill="#ffb454" />
        <text x={chipX + 13} y={MT + 25} fontSize="12.5" fill="#ffb454" fontFamily="IBM Plex Mono, monospace" fontWeight={500}>
          {chipText}
        </text>
      </g>

      {/* hover tooltip */}
      {focusSeg && cursor && (
        <g pointerEvents="none" className="fade-in">
          {(() => {
            const text = `${formatReaction(focusSeg.rxn)}   ·   ${PHASES[focusSeg.phase].metal} / ${PHASES[focusSeg.phase].compound}`;
            const gNow = gAt(focusSeg, probeClamped);
            const sub =
              focusSeg.t0 === focusSeg.t1
                ? `reference point at 0 K · ΔG° = ${fmtG(focusSeg.g0)} kJ`
                : gNow !== null
                  ? `ΔG(${Math.round(probeClamped)}°C) = ${fmtG(gNow)} kJ`
                  : `segment spans ${Math.round(focusSeg.t0)} – ${Math.round(focusSeg.t1)} °C`;
            const w = Math.max(text.length, sub.length) * 6.9 + 22;
            const flipX = cursor.x + w + 18 > VW - MR;
            const flipY = cursor.y + 64 > MT + PH;
            const bx = flipX ? cursor.x - w - 14 : cursor.x + 14;
            const by = flipY ? cursor.y - 58 : cursor.y + 12;
            return (
              <g>
                <rect x={bx} y={by} width={w} height={46} rx={6} fill="#161a22" stroke={family.color} strokeOpacity="0.55" />
                <text x={bx + 11} y={by + 18} fontSize="12" fill="#e9e7e0" fontFamily="IBM Plex Mono, monospace">{text}</text>
                <text x={bx + 11} y={by + 36} fontSize="11.5" fill="#ffb454" fontFamily="IBM Plex Mono, monospace">
                  {sub}
                </text>
              </g>
            );
          })()}
        </g>
      )}

      {/* footer note inside plot */}
      <text x={ML + PW - 8} y={MT + PH - 10} textAnchor="end" fontSize="10.5" fill="#6b7686" fontFamily="IBM Plex Mono, monospace" opacity="0.8">
        line style — metal: solid / dashed / dotted = s / l / g · opacity — compound: 100 / 62 / 30 % = s / l / g
      </text>
      <text x={ML + PW - 8} y={MT + PH - 26} textAnchor="end" fontSize="10.5" fill="#6b7686" fontFamily="IBM Plex Mono, monospace" opacity="0.8">
        sources — Reed 1971 (O₂, N₂, F₂, Cl₂) · Coltters 1985 (carbides)
      </text>
    </svg>
  );
}
