export type DeviceCategory =
  | "Laptop"
  | "Desktop"
  | "Server"
  | "LCD monitor"
  | "CRT monitor"
  | "Printer"
  | "Network switch"
  | "UPS battery unit"
  | "Mobile handset";

export type FunctionalTest = "pass" | "fail" | "untested";

export type Disposition =
  | "awaiting"
  | "reuse-redeployed"
  | "controlled-recovery"
  | "rejected";

export type HazardFlag =
  | "lead-glass"
  | "sealed-lead-acid"
  | "lithium-cell"
  | "mercury-backlight"
  | "toner-residue";

export type StorageType = "HDD" | "SSD" | "NVMe" | "eMMC" | "Flash card";

export type SanitisationMethod =
  | "overwrite-purge"
  | "cryptographic-erase"
  | "degauss"
  | "physical-destruction";

export type SanitisationResult = "verified" | "failed" | "pending";

export interface SanitisationRecord {
  id: string;
  method: SanitisationMethod;
  operator: string;
  performedAt: string;
  result: SanitisationResult;
  standardRef: string | null;
  evidenceNote: string;
  witness: string | null;
}

export interface StorageDevice {
  id: string;
  serial: string;
  type: StorageType;
  capacityGb: number;
  record: SanitisationRecord | null;
}

export interface EvidencePhoto {
  id: string;
  label: string;
  capturedAt: string;
  /** Downscaled JPEG data URL when an operator attached a photo. */
  dataUrl: string | null;
}

export type EventType =
  | "intake-registered"
  | "functional-test"
  | "custody-initiated"
  | "custody-accepted"
  | "custody-declined"
  | "sanitisation-recorded"
  | "disposition-confirmed"
  | "note";

export interface DeviceEvent {
  id: string;
  at: string;
  type: EventType;
  actor: string;
  note: string;
  fromParty?: string;
  toParty?: string;
}

export interface Device {
  id: string;
  serial: string;
  category: DeviceCategory;
  make: string;
  model: string;
  massKg: number;
  functionalTest: FunctionalTest;
  conditionNote: string;
  batchId: string;
  assetTag: string | null;
  storage: StorageDevice[];
  hazardFlags: HazardFlag[];
  photos: EvidencePhoto[];
  custodianId: string;
  disposition: Disposition;
  recoveredFractions: { material: string; massKg: number }[];
  events: DeviceEvent[];
}

export interface Institution {
  id: string;
  name: string;
  city: "Harare" | "Bulawayo";
  sector: string;
}

export type HandlerTier = "collector" | "processor" | "refiner";

export interface Handler {
  id: string;
  name: string;
  tier: HandlerTier;
  city: string;
  verified: boolean;
  authorisationRef: string;
  authorisationExpiry: string;
  scope: string[];
  hazardScope: boolean;
  contact: string;
}

export interface AssetRegisterRow {
  assetTag: string;
  description: string;
}

export interface Batch {
  id: string;
  ref: string;
  institutionId: string;
  openedAt: string;
  collectedAt: string;
  location: string;
  custodianId: string;
  note: string;
  assetRegister: AssetRegisterRow[];
  closed: boolean;
}

export interface Transfer {
  id: string;
  deviceIds: string[];
  fromParty: string;
  toParty: string;
  initiatedAt: string;
  acceptedAt: string | null;
  status: "pending" | "accepted" | "declined";
  reason: string;
}

export type DemoRole = "intake-officer" | "compliance-lead" | "handler";

export interface ReloopState {
  version: number;
  institutions: Institution[];
  handlers: Handler[];
  batches: Batch[];
  devices: Device[];
  transfers: Transfer[];
  role: DemoRole;
  /** Fixed "today" for the demonstration so seeded ages stay consistent. */
  demoToday: string;
}
