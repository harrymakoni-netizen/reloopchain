import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { LogoLockup } from "@/components/reloop/logo";
import {
  EmptyState,
  Note,
  Panel,
  PanelHeader,
  Status,
  TableScroll,
  Td,
  Th,
} from "@/components/reloop/primitives";
import { QrCode } from "@/components/reloop/qr";
import { btnGhost, btnPrimary, inputCls, selectCls } from "@/components/reloop/controls";
import {
  DISPOSITION_LABEL,
  HAZARD_LABEL,
  METHOD_LABEL,
  ageLabel,
  isStale,
  kg,
  lastEvent,
  shortDate,
  storageResolved,
  usd,
} from "@/lib/reloop/format";
import { fileToEvidenceDataUrl } from "@/lib/reloop/image";
import { ESTIMATE_DISCLAIMER, estimateForMass } from "@/lib/reloop/recovery";
import { useReloop } from "@/lib/reloop/store";
import type { Disposition } from "@/lib/reloop/types";

export const Route = createFileRoute("/_workspace/devices/$deviceId")({
  head: () => ({
    meta: [
      { title: "Device passport — ReLoop" },
      {
        name: "description",
        content:
          "Internal device passport: origin, storage media, hazard flags, custody and verified event history.",
      },
      { property: "og:title", content: "Device passport — ReLoop" },
      {
        property: "og:description",
        content: "Full internal chain-of-custody record for a single registered item.",
      },
    ],
  }),
  component: DevicePassport,
  notFoundComponent: () => (
    <EmptyState
      title="Item not found"
      body="This item is not in the demonstration register. It may have been removed by a sample-data reset."
    />
  ),
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/70 px-5 py-2.5 last:border-b-0">
      <span className="label-caps">{label}</span>
      <span className="text-right text-[0.8125rem] font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

function DevicePassport() {
  const { deviceId } = Route.useParams();
  const { state, updateDevice, appendEvent } = useReloop();
  const device = state.devices.find((d) => d.id === deviceId);
  const [note, setNote] = useState("");
  const [nextDisposition, setNextDisposition] = useState<Disposition>("controlled-recovery");

  if (!device) throw notFound();

  const batch = state.batches.find((b) => b.id === device.batchId);
  const institution = state.institutions.find((i) => i.id === batch?.institutionId);
  const custodian = state.handlers.find((h) => h.id === device.custodianId);
  const last = lastEvent(device);
  const stale = isStale(device);
  const estimate = estimateForMass(device.category, device.massKg);
  const passportUrl =
    typeof window === "undefined"
      ? `/p/${device.serial}`
      : `${window.location.origin}/p/${device.serial}`;

  function confirmDisposition() {
    if (!device) return;
    if (!storageResolved(device)) {
      toast.error(
        "Storage media are unresolved. Record a verified destruction result before confirming disposition.",
      );
      return;
    }
    updateDevice(device.id, { disposition: nextDisposition });
    appendEvent(device.id, {
      at: state.demoToday,
      type: "disposition-confirmed",
      actor: "Demo operator · Compliance",
      note: `Disposition confirmed as “${DISPOSITION_LABEL[nextDisposition]}”.`,
    });
    toast.success("Disposition confirmed and appended to the event history.");
  }

  function addNote() {
    if (!device || !note.trim()) {
      toast.error("Enter a note first.");
      return;
    }
    appendEvent(device.id, {
      at: state.demoToday,
      type: "note",
      actor: "Demo operator",
      note: note.trim(),
    });
    setNote("");
    toast.success("Note appended to the event history.");
  }

  return (
    <div>
      <div className="print-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
          <div>
            <p className="label-caps">
              <Link to="/devices" className="hover:underline">
                Devices
              </Link>{" "}
              / item passport
            </p>
            <h1 className="mt-2 font-mono text-2xl font-semibold tracking-tight">
              {device.serial}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {device.category} · {device.make} {device.model} · {kg(device.massKg)}{" "}
              measured
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Status
              tone={
                device.disposition === "awaiting"
                  ? "warn"
                  : device.disposition === "rejected"
                    ? "danger"
                    : "ok"
              }
            >
              {DISPOSITION_LABEL[device.disposition]}
            </Status>
            <button
              type="button"
              className={btnGhost}
              onClick={() => window.print()}
            >
              Print QR label
            </button>
          </div>
        </div>

        <Panel
          className={`mb-6 flex flex-wrap items-center justify-between gap-4 px-5 py-4 ${
            stale ? "border-warn/45 bg-warn/8" : ""
          }`}
        >
          <div>
            <p className="label-caps">Last verified event</p>
            <p className="mt-1 text-lg font-semibold">
              {last ? shortDate(last.at) : "No events recorded"}{" "}
              <span
                className={`text-sm font-normal ${stale ? "text-warn" : "text-muted-foreground"}`}
              >
                ({last ? ageLabel(last.at) : "—"})
              </span>
            </p>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {last ? `${last.note} — ${last.actor}` : "—"}
            </p>
          </div>
          {stale ? (
            <Status tone="warn">Stale — no event in over 30 days</Status>
          ) : (
            <Status tone="ok">Record current</Status>
          )}
        </Panel>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Panel>
              <PanelHeader title="Item record" />
              <Row label="Category" value={device.category} />
              <Row label="Measured mass" value={kg(device.massKg)} />
              <Row
                label="Functional test"
                value={
                  <Status
                    tone={
                      device.functionalTest === "pass"
                        ? "ok"
                        : device.functionalTest === "fail"
                          ? "danger"
                          : "muted"
                    }
                  >
                    {device.functionalTest}
                  </Status>
                }
              />
              <Row label="Condition" value={device.conditionNote} />
              <Row
                label="Hazard flags"
                value={
                  device.hazardFlags.length === 0
                    ? "None recorded"
                    : device.hazardFlags.map((h) => HAZARD_LABEL[h]).join(", ")
                }
              />
              <Row
                label="Origin institution"
                value={`${institution?.name ?? "—"} · ${institution?.city ?? ""}`}
              />
              <Row
                label="Batch"
                value={
                  batch ? (
                    <Link
                      to="/batches/$batchId"
                      params={{ batchId: batch.id }}
                      className="font-mono text-forest hover:underline"
                    >
                      {batch.ref}
                    </Link>
                  ) : (
                    "—"
                  )
                }
              />
              <Row
                label="Institutional asset tag"
                value={device.assetTag ?? "Not on supplied register"}
              />
              <Row label="Current custodian" value={custodian?.name ?? "—"} />
            </Panel>

            <Panel>
              <PanelHeader
                title="Storage media"
                description="Data destruction is performed externally; ReLoop records the evidence of that work."
                actions={
                  <Link to="/assurance" className={btnGhost}>
                    Data assurance
                  </Link>
                }
              />
              {device.storage.length === 0 ? (
                <EmptyState
                  title="No storage media identified"
                  body="No data-bearing device was identified on this item at intake."
                />
              ) : (
                <TableScroll>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <Th>Serial</Th>
                        <Th>Type</Th>
                        <Th align="right">Capacity</Th>
                        <Th>Method</Th>
                        <Th>Operator</Th>
                        <Th>Date</Th>
                        <Th>Witness</Th>
                        <Th>Result</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {device.storage.map((s) => (
                        <tr key={s.id}>
                          <Td className="font-mono text-[0.75rem]">{s.serial}</Td>
                          <Td>{s.type}</Td>
                          <Td align="right">{s.capacityGb} GB</Td>
                          <Td>{s.record ? METHOD_LABEL[s.record.method] : "—"}</Td>
                          <Td>{s.record?.operator ?? "—"}</Td>
                          <Td>{s.record ? shortDate(s.record.performedAt) : "—"}</Td>
                          <Td>{s.record?.witness ?? "—"}</Td>
                          <Td>
                            {!s.record ? (
                              <Status tone="warn">No record</Status>
                            ) : s.record.result === "verified" ? (
                              <Status tone="ok">Verified</Status>
                            ) : s.record.result === "failed" ? (
                              <Status tone="danger">Failed</Status>
                            ) : (
                              <Status tone="warn">Pending</Status>
                            )}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
              )}
              <div className="px-5 py-3">
                <Note tone={storageResolved(device) ? "ok" : "danger"}>
                  {storageResolved(device)
                    ? "All identified storage media have a verified destruction record."
                    : "At least one identified storage device is unresolved. Certificate specimens are blocked for this item."}
                </Note>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Event history"
                description="Appended in order within this demonstration. This is not a cryptographically secured audit log."
              />
              <ol className="divide-y divide-border">
                {[...device.events]
                  .sort((a, b) => (a.at > b.at ? -1 : 1))
                  .map((e) => (
                    <li key={e.id} className="flex gap-4 px-5 py-3">
                      <div className="w-24 shrink-0">
                        <p className="tnum text-xs font-medium">{shortDate(e.at)}</p>
                        <p className="text-[0.6875rem] text-muted-foreground">
                          {ageLabel(e.at)}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[0.8125rem] font-medium">
                          {e.type.replace(/-/g, " ")}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {e.note}
                        </p>
                        <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                          {e.actor}
                          {e.toParty
                            ? ` · to ${state.handlers.find((h) => h.id === e.toParty)?.name ?? e.toParty}`
                            : ""}
                        </p>
                      </div>
                    </li>
                  ))}
              </ol>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel>
              <PanelHeader
                title="Public passport"
                description="The QR resolves to a minimal public record."
              />
              <div className="flex flex-col items-center gap-3 px-5 py-5">
                <QrCode value={passportUrl} />
                <Link
                  to="/p/$serial"
                  params={{ serial: device.serial }}
                  className="text-xs font-semibold text-forest hover:underline"
                >
                  Open public passport →
                </Link>
                <p className="text-center text-[0.6875rem] leading-relaxed text-muted-foreground">
                  The public view omits the institution, asset tag, storage-media serials,
                  operator names and any device-level material value figure.
                </p>
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Illustrative recovery estimate"
                description={ESTIMATE_DISCLAIMER}
              />
              {estimate.supported ? (
                <div className="px-5 py-4">
                  <p className="tnum text-2xl font-semibold">
                    {usd(estimate.totalLowUsd)} – {usd(estimate.totalHighUsd)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mass-based range from demonstration assumptions applied to{" "}
                    {kg(device.massKg)}.
                  </p>
                  <Link
                    to="/recovery"
                    className="mt-3 inline-block text-xs font-semibold text-forest hover:underline"
                  >
                    Basis and assumptions →
                  </Link>
                </div>
              ) : (
                <div className="px-5 py-4">
                  <Note tone="muted">
                    Reference unavailable for {device.category}. No composition assumption
                    has been entered for this category, so no estimate is shown.
                  </Note>
                </div>
              )}
            </Panel>

            <Panel>
              <PanelHeader
                title="Evidence photographs"
                description="Attached at intake or later. Stored with the item record in this browser."
              />
              <ul className="grid grid-cols-2 gap-3 px-5 py-4">
                {device.photos.map((p) => (
                  <li key={p.id} className="rounded-sm border border-border">
                    {p.dataUrl ? (
                      <img
                        src={p.dataUrl}
                        alt={`Evidence photograph: ${p.label}`}
                        className="h-24 w-full rounded-t-sm object-cover"
                      />
                    ) : (
                      <div className="flex h-24 items-center justify-center rounded-t-sm border-b border-dashed border-border bg-muted px-2 text-center text-[0.625rem] text-muted-foreground">
                        Entry recorded — no image file attached
                      </div>
                    )}
                    <div className="px-2 py-2">
                      <p className="text-[0.6875rem] font-medium">{p.label}</p>
                      <p className="text-[0.625rem] text-muted-foreground">
                        captured {shortDate(p.capturedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-2 px-5 pb-4">
                <label htmlFor="add-photo" className={`${btnGhost} cursor-pointer`}>
                  Attach photograph
                </label>
                <input
                  id="add-photo"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file || !device) return;
                    try {
                      const dataUrl = await fileToEvidenceDataUrl(file);
                      updateDevice(device.id, {
                        photos: [
                          ...device.photos,
                          {
                            id: `pho-${Date.now()}`,
                            label: "Operator photograph",
                            capturedAt: state.demoToday,
                            dataUrl,
                          },
                        ],
                      });
                      appendEvent(device.id, {
                        at: state.demoToday,
                        type: "note",
                        actor: "Demo operator",
                        note: "Evidence photograph attached to the item record.",
                      });
                      toast.success("Photograph attached.");
                    } catch {
                      toast.error("That file could not be read as an image.");
                    }
                  }}
                />
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Record an update" />
              <div className="space-y-4 px-5 py-4">
                <div className="space-y-1.5">
                  <label htmlFor="disp" className="block text-xs font-semibold">
                    Confirm disposition
                  </label>
                  <select
                    id="disp"
                    className={selectCls}
                    value={nextDisposition}
                    onChange={(e) => setNextDisposition(e.target.value as Disposition)}
                  >
                    {(Object.keys(DISPOSITION_LABEL) as Disposition[])
                      .filter((d) => d !== "awaiting")
                      .map((d) => (
                        <option key={d} value={d}>
                          {DISPOSITION_LABEL[d]}
                        </option>
                      ))}
                  </select>
                  <button type="button" className={btnPrimary} onClick={confirmDisposition}>
                    Confirm disposition
                  </button>
                </div>
                <div className="space-y-1.5 border-t border-border pt-4">
                  <label htmlFor="note" className="block text-xs font-semibold">
                    Append a note
                  </label>
                  <input
                    id="note"
                    className={inputCls}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Observation, handover detail, hold reason"
                  />
                  <button type="button" className={btnGhost} onClick={addNote}>
                    Append note
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {/* Print label */}
      <div className="print-only print-page">
        <div className="flex w-[420px] gap-4 border border-black/70 p-4">
          <QrCode value={passportUrl} size={130} />
          <div className="min-w-0">
            <LogoLockup width={150} />
            <p className="mt-2 font-mono text-sm font-semibold">{device.serial}</p>
            <p className="text-xs">
              {device.category} · {kg(device.massKg)}
            </p>
            <p className="text-xs">Batch {batch?.ref ?? "—"}</p>
            <p className="mt-2 text-[0.625rem] leading-snug">
              Scan for the public passport. Demonstration specimen — sample data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
