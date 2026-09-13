import type { DeviceCategory } from "./types";

/**
 * ILLUSTRATIVE DEMONSTRATION ASSUMPTIONS.
 *
 * These figures are placeholder planning assumptions entered for the expo
 * demonstration. They are not an assay, not a quotation, and are not drawn
 * from any published study or live market feed. Categories without an entry
 * deliberately report "reference unavailable" rather than guessing.
 */
export const ASSUMPTION_TABLE_VERSION = "v0.3-demo";
export const ASSUMPTION_TABLE_DATE = "2026-08-14";
export const SAMPLE_PRICE_DATE = "2026-08-01";

export interface MaterialAssumption {
  material: string;
  /** mass fraction of device mass, low / high bound */
  lowFraction: number;
  highFraction: number;
  /** assumed share actually recovered by a processor of this material */
  recoveryEfficiency: number;
  /** illustrative sample unit price, USD per kg, as entered on the sample date */
  samplePriceUsdPerKg: number;
  precious?: boolean;
}

export const RECOVERY_ASSUMPTIONS: Partial<
  Record<DeviceCategory, MaterialAssumption[]>
> = {
  Laptop: [
    { material: "Aluminium", lowFraction: 0.14, highFraction: 0.24, recoveryEfficiency: 0.9, samplePriceUsdPerKg: 1.4 },
    { material: "Steel", lowFraction: 0.05, highFraction: 0.1, recoveryEfficiency: 0.92, samplePriceUsdPerKg: 0.25 },
    { material: "Copper", lowFraction: 0.03, highFraction: 0.07, recoveryEfficiency: 0.85, samplePriceUsdPerKg: 6.2 },
    { material: "Mixed plastics", lowFraction: 0.18, highFraction: 0.3, recoveryEfficiency: 0.5, samplePriceUsdPerKg: 0.12 },
    { material: "Printed circuit assembly", lowFraction: 0.08, highFraction: 0.14, recoveryEfficiency: 0.8, samplePriceUsdPerKg: 9.5, precious: true },
  ],
  Desktop: [
    { material: "Steel", lowFraction: 0.4, highFraction: 0.55, recoveryEfficiency: 0.93, samplePriceUsdPerKg: 0.25 },
    { material: "Aluminium", lowFraction: 0.03, highFraction: 0.07, recoveryEfficiency: 0.9, samplePriceUsdPerKg: 1.4 },
    { material: "Copper", lowFraction: 0.04, highFraction: 0.08, recoveryEfficiency: 0.85, samplePriceUsdPerKg: 6.2 },
    { material: "Mixed plastics", lowFraction: 0.1, highFraction: 0.18, recoveryEfficiency: 0.5, samplePriceUsdPerKg: 0.12 },
    { material: "Printed circuit assembly", lowFraction: 0.05, highFraction: 0.1, recoveryEfficiency: 0.8, samplePriceUsdPerKg: 8.0, precious: true },
  ],
  Server: [
    { material: "Steel", lowFraction: 0.45, highFraction: 0.6, recoveryEfficiency: 0.93, samplePriceUsdPerKg: 0.25 },
    { material: "Aluminium", lowFraction: 0.05, highFraction: 0.1, recoveryEfficiency: 0.9, samplePriceUsdPerKg: 1.4 },
    { material: "Copper", lowFraction: 0.05, highFraction: 0.1, recoveryEfficiency: 0.85, samplePriceUsdPerKg: 6.2 },
    { material: "Printed circuit assembly", lowFraction: 0.07, highFraction: 0.13, recoveryEfficiency: 0.8, samplePriceUsdPerKg: 11.0, precious: true },
  ],
  "LCD monitor": [
    { material: "Mixed plastics", lowFraction: 0.35, highFraction: 0.5, recoveryEfficiency: 0.5, samplePriceUsdPerKg: 0.12 },
    { material: "Steel", lowFraction: 0.1, highFraction: 0.2, recoveryEfficiency: 0.92, samplePriceUsdPerKg: 0.25 },
    { material: "Glass panel", lowFraction: 0.15, highFraction: 0.28, recoveryEfficiency: 0.4, samplePriceUsdPerKg: 0.02 },
    { material: "Printed circuit assembly", lowFraction: 0.02, highFraction: 0.05, recoveryEfficiency: 0.8, samplePriceUsdPerKg: 6.5, precious: true },
  ],
  "Network switch": [
    { material: "Steel", lowFraction: 0.35, highFraction: 0.5, recoveryEfficiency: 0.92, samplePriceUsdPerKg: 0.25 },
    { material: "Copper", lowFraction: 0.04, highFraction: 0.09, recoveryEfficiency: 0.85, samplePriceUsdPerKg: 6.2 },
    { material: "Printed circuit assembly", lowFraction: 0.1, highFraction: 0.2, recoveryEfficiency: 0.8, samplePriceUsdPerKg: 10.0, precious: true },
  ],
};

export interface EstimateLine {
  material: string;
  lowKg: number;
  highKg: number;
  recoverableLowKg: number;
  recoverableHighKg: number;
  lowValueUsd: number;
  highValueUsd: number;
  precious: boolean;
}

export interface Estimate {
  supported: boolean;
  lines: EstimateLine[];
  totalLowUsd: number;
  totalHighUsd: number;
}

export function estimateForMass(
  category: DeviceCategory,
  massKg: number,
): Estimate {
  const rows = RECOVERY_ASSUMPTIONS[category];
  if (!rows) return { supported: false, lines: [], totalLowUsd: 0, totalHighUsd: 0 };
  const lines = rows.map((r) => {
    const lowKg = massKg * r.lowFraction;
    const highKg = massKg * r.highFraction;
    const recoverableLowKg = lowKg * r.recoveryEfficiency;
    const recoverableHighKg = highKg * r.recoveryEfficiency;
    return {
      material: r.material,
      lowKg,
      highKg,
      recoverableLowKg,
      recoverableHighKg,
      lowValueUsd: recoverableLowKg * r.samplePriceUsdPerKg,
      highValueUsd: recoverableHighKg * r.samplePriceUsdPerKg,
      precious: Boolean(r.precious),
    };
  });
  return {
    supported: true,
    lines,
    totalLowUsd: lines.reduce((s, l) => s + l.lowValueUsd, 0),
    totalHighUsd: lines.reduce((s, l) => s + l.highValueUsd, 0),
  };
}

export const ESTIMATE_DISCLAIMER =
  "Illustrative estimate — not an assay or quotation.";
