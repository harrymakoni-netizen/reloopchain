import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { LogoLockup } from "@/components/reloop/logo";
import {
  Metric,
  Note,
  PageHeading,
  Panel,
  PanelHeader,
  Status,
  TableScroll,
  Td,
  Th,
} from "@/components/reloop/primitives";
import { btnGhost, btnPrimary, selectCls } from "@/components/reloop/controls";
import {
  DISPOSITION_LABEL,
  EXPORT_WATERMARK,
  HAZARD_LABEL,
  METHOD_LABEL,
  ageLabel,
  downloadFile,
  isStale,
  kg,
  lastEvent,
  shortDate,
  storageResolved,
  toCsv,
} from "@/lib/reloop/format";
import { batchMetrics, certificateReadiness, devicesOfBatch } from "@/lib/reloop/logic";
import { useReloop } from "@/lib/reloop/store";

export const Route = createFileRoute("/_workspace/reports")({
  head: () => ({
    meta: [
      { title: "Reports — ReLoop" },
      {
        name: "description",
        content:
          "Batch disposition reporting, CSV export, print-ready report and a clearly marked certificate specimen.",
      },
      { property: "og:title", content: "Reports — ReLoop" },
      {
        property: "og:description",
        content: "Disposition reporting and demonstration certificate specimens.",
      },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { state } = useReloop();
  const [batchId, setBatchId] = useState(state.batches[0]?.id ?? "");
  const [showCertificate, setShowCertificate] = useState(false);

  const batch = state.batches.find((b) => b.id === batchId);
  const devices = useMemo(() => devicesOfBatch(state, batchId), [state, batchId]);
  const metrics = batchMetrics(devices);
  const institution = state.institutions.find((i) => i.id === batch?.institutionId);
  const readiness = certificateReadiness(devices);

  function exportDisposition() {
    if (!batch) return;
    const rows: (string | number | null)[][] = [
      [EXPORT_WATERMARK],
      [`Batch disposition report — ${batch.ref}`],
      [`Institution`, institution?.name ?? ""],
      [`Collected`, batch.collectedAt],
      [`Generated (demo date)`, state.demoToday],
      [],
      ["Measured intake mass (kg)", metrics.measuredMassKg.toFixed(2)],
      ["Confirmed controlled-recovery mass (kg)", metrics.confirmedRecoveryMassKg.toFixed(2)],
      ["Recorded recovered fractions (kg)", metrics.recordedRecoveredMassKg.toFixed(2)],
      ["Confirmed dispositions", `${devices.length - metrics.awaitingCount} / ${devices.length}`],
      [],
      [
        "Serial",
        "Category",
        "Mass kg",
        "Functional test",
        "Asset tag",
        "Hazards",
        "Storage devices",
        "Storage resolved",
        "Disposition",
        "Last event",
        "Stale",
      ],
      ...devices.map((d) => [
        d.serial,
        d.category,
        d.massKg,
        d.functionalTest,
        d.assetTag ?? "unmatched",
        d.hazardFlags.map((h) => HAZARD_LABEL[h]).join(" | ") || "none",
        d.storage.length,
        storageResolved(d) ? "yes" : "no",
        DISPOSITION_LABEL[d.disposition],
        lastEvent(d)?.at ?? "",
        isStale(d) ? "yes" : "no",
      ]),
    ];
    downloadFile(`reloop-demo-disposition-${batch.ref}.csv`, toCsv(rows));
    toast.success("Disposition CSV downloaded.");
  }

  if (!batch) {
    return (
      <PageHeading title="Reports" lede="No batches exist in this workspace yet." />
    );
  }

  return (
    <div>
      <div className="print-hidden">
        <PageHeading
          eyebrow="Reporting"
          title="Batch disposition reports"
          lede="Reports state what is recorded and what is still outstanding. Nothing is rounded up into a claim of complete disposal."
          actions={
            <div className="flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="r-batch">
                Select batch
              </label>
              <select
                id="r-batch"
                className={`${selectCls} w-52`}
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
              >
                {state.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ref}
                  </option>
                ))}
              </select>
              <button type="button" className={btnGhost} onClick={exportDisposition}>
                Download CSV
              </button>
              <button type="button" className={btnPrimary} onClick={() => window.print()}>
                Print report
              </button>
            </div>
          }
        />

        <Panel className="mb-6 grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          <Metric
            label="Confirmed dispositions"
            value={`${devices.length - metrics.awaitingCount} / ${devices.length}`}
            sub="Remainder are awaiting disposition"
          />
          <Metric label="Measured intake mass" value={kg(metrics.measuredMassKg, 1)} />
          <Metric
            label="Confirmed recovery mass"
            value={kg(metrics.confirmedRecoveryMassKg, 1)}
            sub={`Recorded fractions ${kg(metrics.recordedRecoveredMassKg, 1)}`}
          />
          <Metric
            label="Stale records"
            value={metrics.staleCount}
            tone={metrics.staleCount ? "warn" : "ok"}
            sub="No event in over 30 days"
          />
        </Panel>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader
              title={`Disposition detail — ${batch.ref}`}
              description={`${institution?.name} · collected ${shortDate(batch.collectedAt)}`}
            />
            <TableScroll>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Serial</Th>
                    <Th>Category</Th>
                    <Th align="right">Mass</Th>
                    <Th>Storage</Th>
                    <Th>Disposition</Th>
                    <Th>Last event</Th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => (
                    <tr key={d.id}>
                      <Td className="font-mono text-[0.75rem]">{d.serial}</Td>
                      <Td>{d.category}</Td>
                      <Td align="right">{kg(d.massKg)}</Td>
                      <Td>
                        {d.storage.length === 0
                          ? "none"
                          : storageResolved(d)
                            ? "resolved"
                            : "unresolved"}
                      </Td>
                      <Td>
                        <Status tone={d.disposition === "awaiting" ? "warn" : "ok"}>
                          {DISPOSITION_LABEL[d.disposition]}
                        </Status>
                      </Td>
                      <Td>
                        <span
                          className={`whitespace-nowrap ${isStale(d) ? "text-warn" : "text-muted-foreground"}`}
                        >
                          {shortDate(lastEvent(d)?.at ?? state.demoToday)}
                          <span className="block text-[0.625rem]">
                            {ageLabel(lastEvent(d)?.at ?? state.demoToday)}
                          </span>
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </Panel>

          <Panel className="h-fit">
            <PanelHeader
              title="Certificate specimen"
              description="Generation is blocked while storage evidence is incomplete."
            />
            <div className="space-y-3 px-5 py-4">
              {readiness.ready ? (
                <Note tone="ok">
                  All identified storage devices in this batch have a verified destruction
                  record, and every physical destruction has a named witness.
                </Note>
              ) : (
                readiness.blockers.map((b) => (
                  <Note key={b} tone="danger">
                    {b}
                  </Note>
                ))
              )}
              <button
                type="button"
                className={btnPrimary}
                disabled={!readiness.ready}
                onClick={() => setShowCertificate(true)}
              >
                {readiness.ready ? "Generate certificate specimen" : "Blocked"}
              </button>
              {showCertificate && readiness.ready ? (
                <div className="mt-3 border border-border bg-surface p-5">
                  <div className="flex items-start justify-between gap-4">
                    <LogoLockup width={160} />
                    <span className="rounded-sm border border-warn/40 bg-warn/10 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wide text-warn">
                      Demonstration specimen
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">
                    Certificate of recorded disposal evidence
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Batch {batch.ref} from {institution?.name}, collected{" "}
                    {shortDate(batch.collectedAt)}. {devices.length} items with a combined
                    measured mass of {kg(metrics.measuredMassKg, 1)}.{" "}
                    {devices.length - metrics.awaitingCount} of {devices.length} items have
                    a confirmed disposition.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {devices
                      .flatMap((d) => d.storage.map((s) => ({ d, s })))
                      .map(({ d, s }) => (
                        <li key={s.id}>
                          {d.serial} · {s.type} · {METHOD_LABEL[s.record!.method]} ·{" "}
                          {shortDate(s.record!.performedAt)}
                          {s.record!.witness ? ` · witness ${s.record!.witness}` : ""}
                        </li>
                      ))}
                  </ul>
                  <p className="mt-4 border-t border-border pt-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-warn">
                    Demonstration specimen — not evidence of actual destruction
                  </p>
                  <p className="mt-1 text-[0.625rem] leading-relaxed text-muted-foreground">
                    {EXPORT_WATERMARK}. No regulatory approval, certification, accreditation
                    or partnership is claimed or implied.
                  </p>
                </div>
              ) : null}
            </div>
          </Panel>
        </div>
      </div>

      {/* Print-ready report */}
      <div className="print-only print-page p-6">
        <div className="flex items-start justify-between">
          <LogoLockup width={180} />
          <p className="text-[0.625rem] font-semibold uppercase tracking-wide">
            Demonstration specimen — sample data
          </p>
        </div>
        <h1 className="mt-4 text-lg font-semibold">
          Batch disposition report — {batch.ref}
        </h1>
        <p className="text-xs">
          {institution?.name} · collected {shortDate(batch.collectedAt)} · generated{" "}
          {shortDate(state.demoToday)}
        </p>
        <table className="mt-4 w-full border-collapse text-[0.6875rem]">
          <thead>
            <tr>
              <th className="border-b border-black/40 py-1 text-left">Serial</th>
              <th className="border-b border-black/40 py-1 text-left">Category</th>
              <th className="border-b border-black/40 py-1 text-right">Mass kg</th>
              <th className="border-b border-black/40 py-1 text-left">Storage</th>
              <th className="border-b border-black/40 py-1 text-left">Disposition</th>
              <th className="border-b border-black/40 py-1 text-left">Last event</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td className="border-b border-black/10 py-1">{d.serial}</td>
                <td className="border-b border-black/10 py-1">{d.category}</td>
                <td className="border-b border-black/10 py-1 text-right">
                  {d.massKg.toFixed(2)}
                </td>
                <td className="border-b border-black/10 py-1">
                  {d.storage.length === 0 ? "none" : storageResolved(d) ? "resolved" : "unresolved"}
                </td>
                <td className="border-b border-black/10 py-1">
                  {DISPOSITION_LABEL[d.disposition]}
                </td>
                <td className="border-b border-black/10 py-1">
                  {shortDate(lastEvent(d)?.at ?? state.demoToday)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[0.625rem]">{EXPORT_WATERMARK}</p>
      </div>
    </div>
  );
}
