/* ------------------------------------------------------------------
 * Ellingham diagram data — ported from ellingham_sep.py
 * Raw tables: temperature in K, ΔG in kcal. Converted on load exactly
 * like the original script:  T(°C) = T(K) − 273.15,  ΔG(kJ) = kcal × 4.184.
 * Label offsets are left UNSCALED, as in the source.
 * Sources: Reed (1971), Coltters (1985).
 * ------------------------------------------------------------------ */

export type PhaseKey =
  | "ss" | "ls" | "gs"
  | "sl" | "ll" | "gl"
  | "sg" | "lg" | "gg";

export type RawRow = [number, number, number, number, string, number];
// [T0 K, T1 K, G0 kcal, G1 kcal, reaction (LaTeX-ish), label offset]

export interface Segment {
  id: string;
  t0: number;   // °C
  t1: number;   // °C
  g0: number;   // kJ
  g1: number;   // kJ
  rxn: string;  // raw LaTeX-ish
  offset: number;
  phase: PhaseKey;
  element: string;
}

export const PHASES: Record<
  PhaseKey,
  { code: PhaseKey; metal: "solid" | "liquid" | "gas"; compound: "solid" | "liquid" | "gas"; dash: string; opacity: number; cap?: "round" }
> = {
  ss: { code: "ss", metal: "solid",  compound: "solid",  dash: "",      opacity: 1.0 },
  ls: { code: "ls", metal: "liquid", compound: "solid",  dash: "13 7",  opacity: 1.0 },
  gs: { code: "gs", metal: "gas",    compound: "solid",  dash: "1.5 8", opacity: 1.0, cap: "round" },
  sl: { code: "sl", metal: "solid",  compound: "liquid", dash: "",      opacity: 0.62 },
  ll: { code: "ll", metal: "liquid", compound: "liquid", dash: "13 7",  opacity: 0.62 },
  gl: { code: "gl", metal: "gas",    compound: "liquid", dash: "1.5 8", opacity: 0.62, cap: "round" },
  sg: { code: "sg", metal: "solid",  compound: "gas",    dash: "",      opacity: 0.3 },
  lg: { code: "lg", metal: "liquid", compound: "gas",    dash: "13 7",  opacity: 0.3 },
  gg: { code: "gg", metal: "gas",    compound: "gas",    dash: "1.5 8", opacity: 0.3, cap: "round" },
};

export const PHASE_ORDER: PhaseKey[] = ["ss", "ls", "gs", "sl", "ll", "gl", "sg", "lg", "gg"];

/* ---------------- element reference (subset of molarmass_bin) ---------------- */
export const ELEMENTS: Record<string, { name: string; mass: number }> = {
  Ag: { name: "Silver", mass: 107.87 },  Al: { name: "Aluminium", mass: 26.98 },
  B:  { name: "Boron", mass: 10.81 },    Ba: { name: "Barium", mass: 137.33 },
  Bi: { name: "Bismuth", mass: 208.98 }, C:  { name: "Carbon", mass: 12.01 },
  Ca: { name: "Calcium", mass: 40.08 },  Cs: { name: "Caesium", mass: 132.91 },
  Cu: { name: "Copper", mass: 63.55 },   Fe: { name: "Iron", mass: 55.85 },
  H:  { name: "Hydrogen", mass: 1.01 },  Hg: { name: "Mercury", mass: 200.59 },
  K:  { name: "Potassium", mass: 39.10 },Li: { name: "Lithium", mass: 6.94 },
  Mg: { name: "Magnesium", mass: 24.31 },Mo: { name: "Molybdenum", mass: 95.94 },
  Na: { name: "Sodium", mass: 22.99 },   Nb: { name: "Niobium", mass: 92.91 },
  Ni: { name: "Nickel", mass: 58.69 },   Pt: { name: "Platinum", mass: 195.08 },
  Rb: { name: "Rubidium", mass: 85.47 }, Sb: { name: "Antimony", mass: 121.76 },
  Si: { name: "Silicon", mass: 28.09 },  Sn: { name: "Tin", mass: 118.71 },
  Sr: { name: "Strontium", mass: 87.62 },Ti: { name: "Titanium", mass: 47.87 },
  V:  { name: "Vanadium", mass: 50.94 }, W:  { name: "Tungsten", mass: 183.84 },
  Zn: { name: "Zinc", mass: 65.39 },     Zr: { name: "Zirconium", mass: 91.22 },
};

export const ELEMENT_GROUPS: { label: string; symbols: string[] }[] = [
  { label: "Alkali", symbols: ["Li", "Na", "K", "Rb", "Cs"] },
  { label: "Alkaline earth", symbols: ["Mg", "Ca", "Sr", "Ba"] },
  { label: "Iron group", symbols: ["Fe", "Cu", "Ni", "Zn"] },
  { label: "Refractory", symbols: ["Ti", "V", "Zr", "Nb", "Mo", "W"] },
  { label: "Main group", symbols: ["B", "Al", "Si", "Sn", "Sb", "Bi", "Pt", "Ag", "Hg"] },
  { label: "References", symbols: ["C", "H"] },
];

function elementOf(rxn: string): string {
  const clean = rxn.replace(/[$\\{}_]/g, "").replace(/frac/g, "");
  const m = clean.match(/[A-Z][a-z]?/);
  return m ? m[0] : "?";
}

/* ---------------- raw tables (K, kcal) ---------------- */

const oxss: RawRow[] = [
  [0, 480, -14.0, 0.0, "$4Ag + O_2 = 2Ag_2O$", 0],
  [0, 932, -266.6, -220.0, "$\\frac{4}{3} Al + O_2 = \\frac{2}{3} Al_2O_3$", -13],
  [0, 983, -265.0, -222.0, "$2Ba + O_2 = 2BaO$", 0],
  [0, 544, -92.0, -69.0, "$\\frac{4}{3} Bi + O_2 = \\frac{2}{3} Bi_2O_3$", 6],
  [0, 723, -200.5, -171.5, "$\\frac{4}{3} B + O_2 = \\frac{2}{3} B_2O_3$", -3],
  [0, 1123, -303.0, -249.0, "$2Ca + O_2 = 2CaO$", 0],
  [0, 0, -55.6, -55.6, "$2C + O_2 = 2CO$", 0],
  [0, 0, -94.5, -94.5, "$C + O_2 = CO_2$", -8],
  [0, 0, -38.9, -38.9, "$C + CO_2 = 2CO$", 0],
  [0, 0, -133.4, -133.4, "$2CO + O_2 = 2CO_2$", 0],
  [0, 302, -151.8, -125.0, "$4Cs + O_2 = 2Cs_2O$", -14],
  [0, 1357, -80.0, -33.0, "$4Cu + O_2 = 2Cu_2O$", 0],
  [0, 1357, -74.5, -16.0, "$2Cu + O_2 = 2CuO$", 0],
  [0, 0, -119.3, -119.3, "$4H + O_2 = 2H_2O$", 12],
  [0, 1642, -124.1, -75.0, "$2Fe + O_2 = 2FeO$", -9],
  [0, 1809, -129.2, -55.5, "$\\frac{4}{3} Fe + O_2 = \\frac{2}{3} Fe_2O_3$", -5],
  [0, 453, -286.0, -258.0, "$4Li + O_2 = 2Li_2O$", -12],
  [0, 1068, -120.0, -77.0, "$\\frac{2}{3} Mo + O_2 = \\frac{2}{3} MoO_3$", -3],
  [0, 923, -286.0, -240.0, "$2Mg + O_2 = 2MgO$", 8],
  [0, 0, -44.0, -44.0, "$2Hg + O_2 = 2HgO$", 0],
  [0, 1764, -181.0, -112.0, "$\\frac{4}{5} Nb + O_2 = \\frac{2}{5} Nb_2O_5$", 0],
  [0, 734, -32.0, 0.0, "$\\frac{3}{2} Pt + O_2 = \\frac{1}{2} Pt_3O_4$", 0],
  [0, 336, -172.0, -151.0, "$4K + O_2 = 2K_2O$", -14],
  [0, 312, -157.8, -138.0, "$4Rb + O_2 = 2Rb_2O$", -8],
  [0, 1685, -216.5, -145.8, "$Si + O_2 = SiO_2$", 0],
  [0, 371, -197.0, -176.0, "$4Na + O_2 = 2Na_2O$", 3],
  [0, 1725, -114.0, -44.5, "$2Ni + O_2 = 2NiO$", 0],
  [0, 904, -111.0, -74.0, "$\\frac{4}{3} Sb + O_2 = \\frac{2}{3} Sb_2O_3$", 3],
  [0, 1043, -281.0, -233.0, "$2Sr + O_2 = 2SrO$", 5],
  [0, 505, -138.8, -114.0, "$Sn + O_2 = SnO_2$", -11],
  [0, 1940, -225.5, -142.5, "$Ti + O_2 = TiO_2$", 0],
  [0, 1940, -247.5, -161.0, "$2Ti + O_2 = 2TiO$", 0],
  [0, 1818, -168.0, -100.0, "$V + O_2 = VO_2$", -9],
  [0, 943, -149.5, -110.0, "$\\frac{4}{5} V + O_2 = \\frac{2}{5} V_2O_5$", 2],
  [0, 1743, -133.0, -67.0, "$\\frac{2}{3} W + O_2 = \\frac{2}{3} WO_3$", -10],
  [0, 693, -166.0, -134.0, "$2Zn + O_2 = 2ZnO$", 4],
  [0, 2125, -262.0, -166.0, "$Zr + O_2 = ZrO_2$", 9],
];

const oxls: RawRow[] = [
  [932, 2345, -220.0, -147.6, "$\\frac{4}{3} Al + O_2 = \\frac{2}{3} Al_2O_3$", 0],
  [904, 928, -74.0, -73.0, "$\\frac{4}{3} Sb + O_2 = \\frac{2}{3} Sb_2O_3$", 0],
  [983, 1895, -222.0, -183.0, "$2Ba + O_2 = 2BaO$", 0],
  [544, 1098, -69.0, -44.0, "$\\frac{4}{3} Bi + O_2 = \\frac{2}{3} Bi_2O_3$", 0],
  [1123, 1756, -249.0, -217.0, "$2Ca + O_2 = 2CaO$", 0],
  [302, 763, -125.0, -84.0, "$4Cs + O_2 = 2Cs_2O$", -16],
  [1357, 1509, -33.0, -28.0, "$4Cu + O_2 = 2Cu_2O$", 0],
  [1357, 1609, -16.0, -9.5, "$2Cu + O_2 = 2CuO$", 0],
  [453, 1597, -258.0, -173.0, "$4Li + O_2 = 2Li_2O$", 0],
  [336, 980, -151.0, -107.0, "$4K + O_2 = 2K_2O$", 0],
  [0, 630, -44.0, -10.0, "$2Hg + O_2 = 2HgO$", 0],
  [312, 910, -138.0, -96.0, "$4Rb + O_2 = 2Rb_2O$", -8],
  [1685, 1696, -145.8, -145.4, "$Si + O_2 = SiO_2$", 0],
  [371, 1156, -176.0, -122.0, "$4Na + O_2 = 2Na_2O$", 0],
  [1725, 2257, -44.5, -24.5, "$2Ni + O_2 = 2NiO$", 0],
  [1940, 2128, -142.5, -134.5, "$Ti + O_2 = TiO_2$", 0],
  [1940, 2033, -161.0, -159.0, "$2Ti + O_2 = 2TiO$", 0],
  [693, 1180, -134.0, -109.0, "$2Zn + O_2 = 2ZnO$", 0],
  [2125, 2980, -166.0, -130.0, "$Zr + O_2 = ZrO_2$", 0],
];

const oxgs: RawRow[] = [
  [1895, 2191, -183.0, -159.0, "$2Ba + O_2 = 2BaO$", 0],
  [1756, 2887, -217.0, -117.0, "$2Ca + O_2 = 2CaO$", 0],
  [1597, 2000, -173.0, -128.0, "$4Li + O_2 = 2Li_2O$", 0],
  [923, 1376, -240.0, -214.0, "$2Mg + O_2 = 2MgO$", 0],
  [630, 740, -10.0, 0.0, "$2Hg + O_2 = 2HgO$", 0],
  [1156, 1193, -122.0, -119.0, "$4Na + O_2 = 2Na_2O$", 0],
  [1180, 2240, -109.0, -9.0, "$2Zn + O_2 = 2ZnO$", 0],
];

const oxsl: RawRow[] = [
  [723, 2313, -171.5, -112.0, "$\\frac{4}{3} B + O_2 = \\frac{2}{3} B_2O_3$", 0],
  [1642, 1809, -75.0, -71.9, "$2Fe + O_2 = 2FeO$", 0],
  [1068, 1530, -77.0, -64.0, "$\\frac{2}{3} Mo + O_2 = \\frac{2}{3} MoO_3$", 0],
  [1818, 2190, -100.0, -96.0, "$V + O_2 = VO_2$", 0],
  [1743, 2100, -67.0, -57.0, "$\\frac{2}{3} W + O_2 = \\frac{2}{3} WO_3$", 0],
];

const oxll: RawRow[] = [
  [2345, 2736, -147.6, -128.5, "$\\frac{4}{3} Al + O_2 = \\frac{2}{3} Al_2O_3$", 0],
  [928, 1698, -73.0, -45.0, "$\\frac{4}{3} Sb + O_2 = \\frac{2}{3} Sb_2O_3$", 0],
  [1098, 1852, -44.0, -12.0, "$\\frac{4}{3} Bi + O_2 = \\frac{2}{3} Bi_2O_3$", 0],
  [1809, 2000, -71.9, -67.9, "$2Fe + O_2 = 2FeO$", 0],
  [1376, 3125, -214.0, 52.0, "$2Mg + O_2 = 2MgO$", 0],
  [763, 915, -84.0, -73.0, "$4Cs + O_2 = 2Cs_2O$", -16],
  [1509, 2500, -28.0, -9.5, "$4Cu + O_2 = 2Cu_2O$", 0],
  [1609, 1870, -9.5, 0, "$2Cu + O_2 = 2CuO$", 0],
  [2257, 2500, -24.5, -15.0, "$2Ni + O_2 = 2NiO$", 0],
  [980, 1031, -107.0, -104.0, "$4K + O_2 = 2K_2O$", 0],
  [910, 952, -96.0, -95.0, "$4Rb + O_2 = 2Rb_2O$", -8],
  [1696, 2500, -145.4, -107.8, "$Si + O_2 = SiO_2$", 0],
  [2128, 2500, -134.5, -121.5, "$Ti + O_2 = TiO_2$", 0],
  [2033, 2500, -159.0, -142.5, "$2Ti + O_2 = 2TiO$", 0],
  [2190, 2500, -96.0, -81.0, "$V + O_2 = VO_2$", 0],
];

const oxgl: RawRow[] = [
  [2191, 2500, -159.0, -131.0, "$2Ba + O_2 = 2BaO$", 0],
  [1031, 1325, -104.0, -71.0, "$4K + O_2 = 2K_2O$", 0],
  [1193, 1600, -119.0, -62.0, "$4Na + O_2 = 2Na_2O$", 0],
  [2240, 2340, -9.0, 0.0, "$2Zn + O_2 = 2ZnO$", 0],
];

const oxsg: RawRow[] = [
  [0, 3400, -55.6, -191.9, "$2C + O_2 = 2CO$", 0],
  [0, 3400, -94.5, -94.5, "$C + O_2 = CO_2$", 0],
  [0, 3400, -38.9, -97.4, "$C + CO_2 = 2CO$", 0],
  [1530, 2500, -64.0, -52.0, "$\\frac{2}{3} Mo + O_2 = \\frac{2}{3} MoO_3$", 0],
  [2100, 2500, -57.0, -52.0, "$\\frac{2}{3} W + O_2 = \\frac{2}{3} WO_3$", 0],
];

const oxlg: RawRow[] = [
  [915, 955, -73.0, -72.0, "$4Cs + O_2 = 2Cs_2O$", -16],
  [1698, 1908, -45.0, -32.0, "$\\frac{4}{3} Sb + O_2 = \\frac{2}{3} Sb_2O_3$", 0],
];

const oxgg: RawRow[] = [
  [0, 3400, -135.4, -4.7, "$2CO + O_2 = 2CO_2$", 0],
  [0, 3400, -119.3, -26.6, "$4H + O_2 = 2H_2O$", 0],
  [1325, 2160, -71.0, 0.0, "$4K + O_2 = 2K_2O$", 0],
  [1600, 2250, -62.0, 0.0, "$4Na + O_2 = 2Na_2O$", 0],
  [1908, 2380, -32.0, 0.0, "$\\frac{4}{3} Sb + O_2 = \\frac{2}{3} Sb_2O_3$", 0],
];

/* ---------- Carbides (Coltters 1985) ---------- */
const cass: RawRow[] = [
  [0, 1414, -57, -49, "$Si + C = SiC$", -9],
  [0, 1750, -160, -150.5, "$Ti + C = TiC$", -5],
  [0, 723, 23, -1, "$3Fe + C = Fe_3C$", 0],
  [0, 1290, -31, -34, "$2W + C = W_2C$", -1],
  [0, 800, -39.5, -45, "$W + C = WC$", -10],
  [0, 1000, -70, -59, "$2Mo + C = Mo_2C$", -12],
  [0, 720, -183, -175, "$Zr + C = ZrC$", 1],
];
const cals: RawRow[] = [
  [1414, 2000, -49, -30, "$Si + C = SiC$", 0],
];

/* ---------- Nitrides ---------- */
const niss: RawRow[] = [
  [0, 932, -144.3, -101.0, "$2Al + N_2 = 2AlN$", 0],
  [0, 2300, -121.4, -20.8, "$2B + N_2 = 2BN$", 0],
  [0, 1809, -5.8, 38.5, "$8Fe + N_2 = 2Fe_4N$", 12],
  [0, 923, -109.6, -65.8, "$3Mg + N_2 = Mg_3N_2$", 8],
  [0, 1150, -31.9, 0.0, "$4Mo + N_2 = Mo_2N$", 10],
  [0, 0, -24.1, -24.1, "$6H + N_2 = 2NH_3$", 0],
  [0, 1680, -90.0, -22.5, "$\\frac{3}{2} Si + N_2 = \\frac{1}{2} Si_3N_4$", -6],
  [0, 1940, -160.5, -73.4, "$2Ti + N_2 = 2TiN$", 1],
  [0, 2190, -83.3, 3.6, "$2V + N_2 = 2VN$", -13],
  [0, 2128, -163.8, -67.2, "$2Zr + N_2 = 2ZrN$", -2],
];
const nils: RawRow[] = [
  [2300, 2500, -20.8, 0, "$2B + N_2 = 2BN$", 0],
  [923, 1376, -65.8, -41.3, "$3Mg + N_2 = Mg_3N_2$", 0],
  [1680, 2130, -22.5, 0.0, "$\\frac{3}{2} Si + N_2 = \\frac{1}{2} Si_3N_4$", 0],
];
const nigg: RawRow[] = [
  [0, 2000, -24.1, 85.2, "$6H + N_2 = 2NH_3$", 0],
];

/* ---------- Fluorides ---------- */
const flss: RawRow[] = [
  [0, 932, -215.3, -181.0, "$\\frac{2}{3} Al + F_2 = \\frac{2}{3} AlF_3$", 0],
  [0, 1123, -288.0, -245.0, "$Ca + F_2 = CaF_2$", 5],
  [0, 0, -129.8, -129.8, "$2H + F_2 = 2HF$", 0],
  [0, 0, -81.2, -81.2, "$\\frac{1}{2} C + F_2 = \\frac{1}{2} CF_4$", 2],
  [0, 453, -290.0, -271.0, "$2Li + F_2 = 2LiF$", -8],
  [0, 336, -270.0, -253.0, "$2K + F_2 = 2KF$", 0.3],
  [0, 371, -274.0, -255.0, "$2Na + F_2 = 2NaF$", -0.3],
];
const flls: RawRow[] = [
  [932, 1545, -181.0, -156.0, "$\\frac{2}{3} Al + F_2 = \\frac{2}{3} AlF_3$", 0],
  [1123, 1691, -245.0, -224.0, "$Ca + F_2 = CaF_2$", 0],
  [453, 1120, -271.0, -240.0, "$2Li + F_2 = 2LiF$", 0],
  [336, 1031, -253.0, -214.0, "$2K + F_2 = 2KF$", 0],
  [371, 1187, -255.0, -214.0, "$2Na + F_2 = 2NaF$", 0],
];
const flll: RawRow[] = [
  [1545, 2500, -156.0, -157.0, "$\\frac{2}{3} Al + F_2 = \\frac{2}{3} AlF_3$", 0],
  [1691, 1955, -224.0, -222.0, "$Ca + F_2 = CaF_2$", 0],
  [1120, 1597, -240.0, -216.0, "$2Li + F_2 = 2LiF$", 0],
  [1031, 1130, -214.0, -209.0, "$2K + F_2 = 2KF$", 0],
  [1187, 1268, -214.0, -209.0, "$2Na + F_2 = 2NaF$", 0],
];
const flgl: RawRow[] = [
  [1955, 2500, -222.0, -186.0, "$Ca + F_2 = CaF_2$", 0],
  [1597, 1954, -216.0, -194.0, "$2Li + F_2 = 2LiF$", 0],
  [1130, 1775, -209.0, -166.0, "$2K + F_2 = 2KF$", 0],
  [1268, 1977, -209.0, -156.0, "$2Na + F_2 = 2NaF$", 0],
];
const flgg: RawRow[] = [
  [0, 2500, -81.2, -36.0, "$\\frac{1}{2} C + F_2 = \\frac{1}{2} CF_4$", 0],
  [0, 0, -129.8, -129.8, "$2H + F_2 = 2HF$", 0],
  [1954, 2500, -194.0, -179.0, "$2Li + F_2 = 2LiF$", 0],
  [1775, 2500, -166.0, -150.0, "$2K + F_2 = 2KF$", 0],
  [1977, 2500, -156.0, -150.0, "$2Na + F_2 = 2NaF$", 0],
  [0, 1287, -129.8, -134.1, "$2H + F_2 = 2HF$", 0],
];

/* ---------- Chlorides ---------- */
const clss: RawRow[] = [
  [0, 465, -110.9, -92.9, "$\\frac{2}{3} Al + Cl_2 = \\frac{2}{3} AlCl_3$", -5],
  [0, 1055, -188.0, -154.0, "$Ca + Cl_2 = CaCl_2$", 0],
  [0, 0, -12.3, -12.3, "$\\frac{1}{2} C + Cl_2 = \\frac{1}{2} CCl_4$", 0],
  [0, 0, -45.0, -45.0, "$2H + Cl_2 = 2HCl$", -11],
  [0, 459, -193.6, -177.6, "$2Li + Cl_2 = 2LiCl$", 0],
  [0, 336, -209.4, -193.2, "$2K + Cl_2 = 2KCl$", 0],
  [0, 371, -196.8, -180.0, "$2Na + Cl_2 = 2NaCl$", -5],
  [0, 0, -36.1, -36.1, "$\\frac{1}{3} W + Cl_2 = \\frac{1}{3} WCl_6$", 8],
];
const clls: RawRow[] = [
  [459, 887, -177.6, -161.0, "$2Li + Cl_2 = 2LiCl$", 0],
  [336, 1031, -193.2, -161.0, "$2K + Cl_2 = 2KCl$", 0],
  [371, 1073, -180.0, -149.4, "$2Na + Cl_2 = 2NaCl$", 0],
];
const clsl: RawRow[] = [
  [465, 500, -92.9, -91.7, "$\\frac{2}{3} Al + Cl_2 = \\frac{2}{3} AlCl_3$", 0],
  [1055, 1123, -154.0, -152.0, "$Ca + Cl_2 = CaCl_2$", 0],
  [0, 548, -36.1, -15.0, "$\\frac{1}{3} W + Cl_2 = \\frac{1}{3} WCl_6$", 0],
];
const clll: RawRow[] = [
  [1123, 1755, -152.0, -136.0, "$Ca + Cl_2 = CaCl_2$", 0],
  [887, 1597, -161.0, -141.2, "$2Li + Cl_2 = 2LiCl$", 0],
  [1031, 1043, -161.0, -160.0, "$2K + Cl_2 = 2KCl$", 0],
  [1073, 1156, -149.4, -145.6, "$2Na + Cl_2 = 2NaCl$", 0],
];
const clgl: RawRow[] = [
  [1755, 1900, -136.0, -128.0, "$Ca + Cl_2 = CaCl_2$", 0],
  [1597, 1655, -141.2, -138.4, "$2Li + Cl_2 = 2LiCl$", 0],
  [1043, 1680, -160.0, -122.4, "$2K + Cl_2 = 2KCl$", 0],
  [1156, 1738, -145.6, -110.0, "$2Na + Cl_2 = 2NaCl$", 0],
];
const clsg: RawRow[] = [
  [500, 932, -91.7, -84.6, "$\\frac{2}{3} Al + Cl_2 = \\frac{2}{3} AlCl_3$", 0],
  [548, 1500, -15.0, -0.8, "$\\frac{1}{3} W + Cl_2 = \\frac{1}{3} WCl_6$", 0],
];
const cllg: RawRow[] = [
  [932, 2273, -84.6, -70.2, "$\\frac{2}{3} Al + Cl_2 = \\frac{2}{3} AlCl_3$", 0],
];
const clgg: RawRow[] = [
  [2273, 2500, -70.2, -71.6, "$\\frac{2}{3} Al + Cl_2 = \\frac{2}{3} AlCl_3$", 0],
  [1900, 2500, -128.0, -114.0, "$Ca + Cl_2 = CaCl_2$", 0],
  [0, 2500, -12.3, 27.4, "$\\frac{1}{2} C + Cl_2 = \\frac{1}{2} CCl_4$", 0],
  [0, 2500, -45.0, -53.3, "$2H + Cl_2 = 2HCl$", 0],
  [1655, 2500, -138.4, -118.4, "$2Li + Cl_2 = 2LiCl$", 0],
  [1680, 2500, -122.4, -110.4, "$2K + Cl_2 = 2KCl$", 0],
  [1738, 2500, -110.0, -96.8, "$2Na + Cl_2 = 2NaCl$", 0],
];

/* ---------------- conversion (mirrors convert_units) ---------------- */
const K0 = 273.15;
const KCAL = 4.184;

function build(family: string, phase: PhaseKey, rows: RawRow[]): Segment[] {
  return rows.map((r, i) => ({
    id: `${family}-${phase}-${i}`,
    t0: r[0] - K0,
    t1: r[1] - K0,
    g0: r[2] * KCAL,
    g1: r[3] * KCAL,
    rxn: r[4],
    offset: r[5],
    phase,
    element: elementOf(r[4]),
  }));
}

export type FamilyKey = "oxides" | "carbides" | "nitrides" | "fluorides" | "chlorides";

export interface Family {
  key: FamilyKey;
  name: string;
  formula: string;
  color: string;
  glow: string;
  yLabel: string;
  gas: string;
  blurb: string;
  phases: Record<PhaseKey, Segment[]>;
  count: number;
}

function makeFamily(
  key: FamilyKey, name: string, formula: string, color: string, glow: string,
  gas: string, blurb: string,
  d: Partial<Record<PhaseKey, RawRow[]>>,
): Family {
  const phases = {} as Record<PhaseKey, Segment[]>;
  let count = 0;
  for (const p of PHASE_ORDER) {
    phases[p] = build(key, p, d[p] ?? []);
    count += phases[p].length;
  }
  return { key, name, formula, color, glow, gas, blurb, phases, count, yLabel: `ΔG°f · kJ / mol ${gas}` };
}

export const FAMILIES: Family[] = [
  makeFamily("oxides", "Oxides", "O₂", "#ff5c38", "rgba(255,92,56,0.35)", "O₂",
    "The classic metallurgical chart — stability of oxides from silver to zirconium, with the carbon and hydrogen reference lines that make reduction possible.",
    { ss: oxss, ls: oxls, gs: oxgs, sl: oxsl, ll: oxll, gl: oxgl, sg: oxsg, lg: oxlg, gg: oxgg }),
  makeFamily("carbides", "Carbides", "C", "#b9c6d4", "rgba(185,198,212,0.30)", "C",
    "Carbide formers of steelmaking and hard-metal tooling — TiC, WC and ZrC sit far below the iron carbide line.",
    { ss: cass, ls: cals }),
  makeFamily("nitrides", "Nitrides", "N₂", "#4aa8ff", "rgba(74,168,255,0.35)", "N₂",
    "Refractory nitrides AlN, TiN, ZrN and BN against the ammonia reference line.",
    { ss: niss, ls: nils, gg: nigg }),
  makeFamily("fluorides", "Fluorides", "F₂", "#3ad68d", "rgba(58,214,141,0.35)", "F₂",
    "The most exothermic family on the chart — alkali and alkaline-earth fluorides anchor the bottom of the diagram.",
    { ss: flss, ls: flls, ll: flll, gl: flgl, gg: flgg }),
  makeFamily("chlorides", "Chlorides", "Cl₂", "#e8b23e", "rgba(232,178,62,0.35)", "Cl₂",
    "Volatile chlorides of the alkali metals and aluminium — the chemistry behind the Kroll and Hunter processes.",
    { ss: clss, ls: clls, sl: clsl, ll: clll, gl: clgl, sg: clsg, lg: cllg, gg: clgg }),
];

export const familyByKey = (k: FamilyKey): Family => FAMILIES.find((f) => f.key === k)!;
