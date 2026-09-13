import { DEMO_TODAY } from "./seed";
import type { Device, Disposition, HazardFlag, SanitisationMethod } from "./types";

export const STALE_DAYS = 30;

export function kg(value: number, digits = 2) {
  return `${value.toFixed(digits)} kg`;
}

export function usd(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function shortDate(iso: string) {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function daysSince(iso: string, today = DEMO_TODAY) {
  const a = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function ageLabel(iso: string) {
  const d = daysSince(iso);
  if (d <= 0) return "today";
  if (d === 1) return "1 day ago";
  return `${d} days ago`;
}

export function lastEvent(device: Device) {
  return device.events.reduce(
    (latest, e) => (e.at > latest.at ? e : latest),
    device.events[0],
  );
}

export function isStale(device: Device) {
  const e = lastEvent(device);
  return e ? daysSince(e.at) > STALE_DAYS : true;
}

export const DISPOSITION_LABEL: Record<Disposition, string> = {
  awaiting: "Awaiting disposition",
  "reuse-redeployed": "Reuse — redeployed",
  "controlled-recovery": "Controlled recovery",
  rejected: "Rejected at intake",
};

export const HAZARD_LABEL: Record<HazardFlag, string> = {
  "lead-glass": "Leaded CRT glass",
  "sealed-lead-acid": "Sealed lead-acid",
  "lithium-cell": "Lithium cell",
  "mercury-backlight": "Mercury backlight",
  "toner-residue": "Toner residue",
};

export const METHOD_LABEL: Record<SanitisationMethod, string> = {
  "overwrite-purge": "Overwrite purge",
  "cryptographic-erase": "Cryptographic erase",
  degauss: "Degauss",
  "physical-destruction": "Physical destruction",
};

export function storageResolved(device: Device) {
  if (device.storage.length === 0) return true;
  return device.storage.every((s) => s.record && s.record.result === "verified");
}

export function downloadFile(filename: string, content: string, mime = "text/csv") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toCsv(rows: (string | number | null)[][]) {
  return rows
    .map((r) =>
      r
        .map((cell) => {
          const s = cell === null || cell === undefined ? "" : String(cell);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

export const EXPORT_WATERMARK =
  "ReLoop by HJM Technologies — EXPO DEMONSTRATION · SAMPLE DATA · not evidence of actual disposal";
