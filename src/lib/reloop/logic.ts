import { DEMO_TODAY } from "./seed";
import { isStale, storageResolved } from "./format";
import type { Batch, Device, Handler, ReloopState } from "./types";

export interface BatchMetrics {
  itemCount: number;
  measuredMassKg: number;
  confirmedRecoveryMassKg: number;
  recordedRecoveredMassKg: number;
  reuseCount: number;
  recoveryCount: number;
  awaitingCount: number;
  hazardCount: number;
  staleCount: number;
  unresolvedStorageCount: number;
}

export function batchMetrics(devices: Device[]): BatchMetrics {
  return {
    itemCount: devices.length,
    measuredMassKg: devices.reduce((s, d) => s + d.massKg, 0),
    confirmedRecoveryMassKg: devices
      .filter((d) => d.disposition === "controlled-recovery")
      .reduce((s, d) => s + d.massKg, 0),
    recordedRecoveredMassKg: devices.reduce(
      (s, d) => s + d.recoveredFractions.reduce((t, f) => t + f.massKg, 0),
      0,
    ),
    reuseCount: devices.filter((d) => d.disposition === "reuse-redeployed").length,
    recoveryCount: devices.filter((d) => d.disposition === "controlled-recovery").length,
    awaitingCount: devices.filter((d) => d.disposition === "awaiting").length,
    hazardCount: devices.filter((d) => d.hazardFlags.length > 0).length,
    staleCount: devices.filter((d) => isStale(d)).length,
    unresolvedStorageCount: devices.filter((d) => !storageResolved(d)).length,
  };
}

export function devicesOfBatch(state: ReloopState, batchId: string) {
  return state.devices.filter((d) => d.batchId === batchId);
}

export interface Reconciliation {
  matched: { assetTag: string; device: Device }[];
  missing: { assetTag: string; description: string }[];
  unmatched: Device[];
}

export function reconcile(batch: Batch, devices: Device[]): Reconciliation {
  const byTag = new Map(devices.filter((d) => d.assetTag).map((d) => [d.assetTag!, d]));
  const matched: Reconciliation["matched"] = [];
  const missing: Reconciliation["missing"] = [];
  for (const row of batch.assetRegister) {
    const device = byTag.get(row.assetTag);
    if (device) matched.push({ assetTag: row.assetTag, device });
    else missing.push(row);
  }
  const registerTags = new Set(batch.assetRegister.map((r) => r.assetTag));
  const unmatched = devices.filter(
    (d) => !d.assetTag || !registerTags.has(d.assetTag),
  );
  return { matched, missing, unmatched };
}

export function handlerStatus(handler: Handler, today = DEMO_TODAY) {
  const expired = handler.authorisationExpiry < today;
  return {
    expired,
    eligible: handler.verified && !expired,
    label: !handler.verified
      ? "Verification incomplete"
      : expired
        ? "Authorisation expired"
        : "Verified · authorisation current",
  };
}

export interface CustodyCheck {
  allowed: boolean;
  blockers: string[];
  warnings: string[];
}

export function checkCustody(handler: Handler, devices: Device[]): CustodyCheck {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const status = handlerStatus(handler);

  if (!handler.verified) {
    blockers.push(
      `${handler.name} has not completed verification in this workspace, so custody cannot be recorded to them.`,
    );
  }
  if (status.expired) {
    blockers.push(
      `Authorisation ${handler.authorisationRef} expired on ${handler.authorisationExpiry}. Custody transfer is blocked until a current authorisation is recorded.`,
    );
  }
  const hazardous = devices.filter((d) => d.hazardFlags.length > 0);
  if (hazardous.length > 0 && !handler.hazardScope) {
    blockers.push(
      `${hazardous.length} selected item(s) carry hazard flags. ${handler.name} is recorded without hazardous-material scope.`,
    );
  }
  if (handler.tier === "collector" && devices.length > 0) {
    warnings.push(
      "Collector tier may aggregate and transport only — it may not process items or receive hazardous material.",
    );
    if (hazardous.length > 0) {
      blockers.push(
        "Collector tier parties may not receive hazardous items under the routing rules configured for this demonstration.",
      );
    }
  }
  if (devices.length === 0) blockers.push("Select at least one item to transfer.");

  return { allowed: blockers.length === 0, blockers, warnings };
}

export function certificateReadiness(devices: Device[]) {
  const blockers: string[] = [];
  const unresolved = devices.filter((d) => !storageResolved(d));
  if (unresolved.length > 0) {
    blockers.push(
      `${unresolved.length} item(s) have an identified storage device with no verified destruction record (pending or failed).`,
    );
  }
  const destructionNoWitness = devices.filter((d) =>
    d.storage.some(
      (s) => s.record?.method === "physical-destruction" && !s.record.witness,
    ),
  );
  if (destructionNoWitness.length > 0) {
    blockers.push(
      `${destructionNoWitness.length} physical-destruction record(s) have no witness recorded.`,
    );
  }
  return { ready: blockers.length === 0, blockers };
}

export function overviewMetrics(state: ReloopState) {
  const m = batchMetrics(state.devices);
  const confirmed = state.devices.filter((d) => d.disposition !== "awaiting").length;
  return {
    ...m,
    confirmedDispositions: confirmed,
    totalItems: state.devices.length,
    openBatches: state.batches.filter((b) => !b.closed).length,
    pendingTransfers: state.transfers.filter((t) => t.status === "pending").length,
  };
}
