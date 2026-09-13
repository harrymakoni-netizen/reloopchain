import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createSeedState, FACILITY_ID, STATE_VERSION } from "./seed";
import type {
  Batch,
  DemoRole,
  Device,
  DeviceEvent,
  ReloopState,
  SanitisationRecord,
  Transfer,
} from "./types";

const STORAGE_KEY = "reloop.demo.state.v4";

interface Ctx {
  state: ReloopState;
  hydrated: boolean;
  setRole: (role: DemoRole) => void;
  reset: () => void;
  addBatch: (batch: Batch) => void;
  updateBatch: (id: string, patch: Partial<Batch>) => void;
  addDevice: (device: Device) => void;
  updateDevice: (id: string, patch: Partial<Device>) => void;
  appendEvent: (deviceId: string, event: Omit<DeviceEvent, "id">) => void;
  setSanitisation: (
    deviceId: string,
    storageId: string,
    record: SanitisationRecord,
  ) => void;
  addTransfer: (transfer: Transfer) => void;
  resolveTransfer: (id: string, accept: boolean, note: string) => void;
}

const ReloopContext = createContext<Ctx | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

export function ReloopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ReloopState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ReloopState;
        if (parsed && parsed.version === STATE_VERSION) setState(parsed);
      }
    } catch {
      /* corrupt or unavailable storage falls back to seed data */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked — demo continues in memory */
    }
  }, [state, hydrated]);

  const patchDevice = useCallback(
    (id: string, fn: (d: Device) => Device) =>
      setState((s) => ({
        ...s,
        devices: s.devices.map((d) => (d.id === id ? fn(d) : d)),
      })),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      setRole: (role) => setState((s) => ({ ...s, role })),
      reset: () => setState(createSeedState()),
      addBatch: (batch) => setState((s) => ({ ...s, batches: [batch, ...s.batches] })),
      updateBatch: (id, patch) =>
        setState((s) => ({
          ...s,
          batches: s.batches.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      addDevice: (device) => setState((s) => ({ ...s, devices: [device, ...s.devices] })),
      updateDevice: (id, patch) => patchDevice(id, (d) => ({ ...d, ...patch })),
      appendEvent: (deviceId, event) =>
        patchDevice(deviceId, (d) => ({
          ...d,
          events: [...d.events, { ...event, id: uid("evt") }],
        })),
      setSanitisation: (deviceId, storageId, record) =>
        patchDevice(deviceId, (d) => ({
          ...d,
          storage: d.storage.map((s) => (s.id === storageId ? { ...s, record } : s)),
          events: [
            ...d.events,
            {
              id: uid("evt"),
              at: record.performedAt,
              type: "sanitisation-recorded",
              actor: `${record.operator} · Operator`,
              note: `Data destruction record captured for ${
                d.storage.find((s) => s.id === storageId)?.serial ?? storageId
              } (${record.result}).`,
            },
          ],
        })),
      addTransfer: (transfer) =>
        setState((s) => ({
          ...s,
          transfers: [transfer, ...s.transfers],
          devices: s.devices.map((d) =>
            transfer.deviceIds.includes(d.id)
              ? {
                  ...d,
                  events: [
                    ...d.events,
                    {
                      id: uid("evt"),
                      at: transfer.initiatedAt,
                      type: "custody-initiated" as const,
                      actor: "Demo operator",
                      note: transfer.reason || "Custody transfer initiated.",
                      fromParty: transfer.fromParty,
                      toParty: transfer.toParty,
                    },
                  ],
                }
              : d,
          ),
        })),
      resolveTransfer: (id, accept, note) =>
        setState((s) => {
          const transfer = s.transfers.find((t) => t.id === id);
          if (!transfer || transfer.status !== "pending") return s;
          const at = s.demoToday;
          return {
            ...s,
            transfers: s.transfers.map((t) =>
              t.id === id
                ? {
                    ...t,
                    status: accept ? ("accepted" as const) : ("declined" as const),
                    acceptedAt: accept ? at : null,
                  }
                : t,
            ),
            devices: s.devices.map((d) =>
              transfer.deviceIds.includes(d.id)
                ? {
                    ...d,
                    custodianId: accept ? transfer.toParty : d.custodianId,
                    events: [
                      ...d.events,
                      {
                        id: uid("evt"),
                        at,
                        type: accept
                          ? ("custody-accepted" as const)
                          : ("custody-declined" as const),
                        actor: "Receiving party (demo)",
                        note:
                          note ||
                          (accept ? "Custody accepted." : "Custody declined."),
                        fromParty: transfer.fromParty,
                        toParty: transfer.toParty,
                      },
                    ],
                  }
                : d,
            ),
          };
        }),
    }),
    [state, hydrated, patchDevice],
  );

  return <ReloopContext.Provider value={value}>{children}</ReloopContext.Provider>;
}

export function useReloop() {
  const ctx = useContext(ReloopContext);
  if (!ctx) throw new Error("useReloop must be used inside ReloopProvider");
  return ctx;
}

export { uid, FACILITY_ID };
