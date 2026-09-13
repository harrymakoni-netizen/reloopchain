import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Metric,
  Note,
  Panel,
  PanelHeader,
  Status,
  TableScroll,
  Td,
  Th,
} from "@/components/reloop/primitives";
import { btnGhost, btnPrimary, inputCls } from "@/components/reloop/controls";
import {
  DISPOSITION_LABEL,
  EXPORT_WATERMARK,
  ageLabel,
  downloadFile,
  isStale,
  kg,
  lastEvent,
  shortDate,
  storageResolved,
  toCsv,
} from "@/lib/reloop/format";
import { batchMetrics, devicesOfBatch, reconcile } from "@/lib/reloop/logic";
import { useReloop } from "@/lib/reloop/store";

export const Route = createFileRoute("/_workspace/batches/$batchId")({
  head: () => ({
    meta: [
      { title: "Batch detail — ReLoop" },
      {
        name: "description",
        content:
          "Batch rollups derived from item records, asset register reconciliation and disposition progress.",
      },
      { property: "og:title", content: "Batch detail — ReLoop" },
      {
        property: "og:description",
        content: "Item rollups and asset register reconciliation for one collection batch.",
      },
    ],
  }),
  component: BatchDetail,
  notFoundComponent: () => (
    <EmptyState title="Batch not found" body="This batch is not in the demonstration data." />
  ),
});

type Tab = "items" | "matched" | "unmatched" | "missing";

function BatchDetail() {
  const { batchId } = Route.useParams();
  const { state, updateBatch } = useReloop();
  const batch = state.batches.find((b) => b.id === batchId);
  const [tab, setTab] = useState<Tab>("items");
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!batch) throw notFound();

  const devices = devicesOfBatch(state, batch.id);
  const metrics = batchMetrics(devices);
  const institution = state.institutions.find((i) => i.id === batch.institutionId);
  const rec = useMemo(() => reconcile(batch, devices), [batch, devices]);

  const filtered = devices.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      d.serial.toLowerCase().includes(q) ||
      (d.assetTag?.toLowerCase().includes(q) ?? false) ||
      d.category.toLowerCase().includes(q) ||
      `${d.make} ${d.model}`.toLowerCase().includes(q)
    );
  });

  function importCsv(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast.error("That file contained no rows.");
      return;
    }
    const startsWithHeader = /asset|tag/i.test(lines[0] ?? "");
    const rows = (startsWithHeader ? lines.slice(1) : lines)
      .map((line) => {
        const [assetTag = "", ...rest] = line.split(",");
        return {
          assetTag: assetTag.replace(/^"|"$/g, "").trim(),
          description: rest.join(",").replace(/^"|"$/g, "").trim() || "No description",
        };
      })
      .filter((r) => r.assetTag);
    if (rows.length === 0) {
      toast.error("No asset tags could be read from the first column.");
      return;
    }
    updateBatch(batch!.id, { assetRegister: rows });
    setTab("missing");
    toast.success(`Imported ${rows.length} asset register rows.`);
  }

  function exportBatchCsv() {
    const rows: (string | number | null)[][] = [
      [EXPORT_WATERMARK],
      [`Batch ${batch!.ref}`, institution?.name ?? "", `Collected ${batch!.collectedAt}`],
      [],
      [
        "Serial",
        "Category",
        "Make",
        "Model",
        "Mass kg",
        "Functional test",
        "Asset tag",
        "Hazards",
        "Storage resolved",
        "Disposition",
        "Last event",
      ],
      ...devices.map((d) => [
        d.serial,
        d.category,
        d.make,
        d.model,
        d.massKg,
        d.functionalTest,
        d.assetTag ?? "unmatched",
        d.hazardFlags.join(" | ") || "none",
        storageResolved(d) ? "yes" : "no",
        DISPOSITION_LABEL[d.disposition],
        lastEvent(d)?.at ?? "",
      ]),
    ];
    downloadFile(`reloop-demo-${batch!.ref}.csv`, toCsv(rows));
    toast.success("CSV downloaded.");
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "items", label: "Items", count: devices.length },
    { key: "matched", label: "Matched", count: rec.matched.length },
    { key: "unmatched", label: "Unmatched intake", count: rec.unmatched.length },
    { key: "missing", label: "Missing from intake", count: rec.missing.length },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div>
          <p className="label-caps">
            <Link to="/batches" className="hover:underline">
              Batches
            </Link>{" "}
            / {institution?.name}
          </p>
          <h1 className="mt-2 font-mono text-2xl font-semibold">{batch.ref}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
            {batch.location} · collected {shortDate(batch.collectedAt)} · custodian{" "}
            {state.handlers.find((h) => h.id === batch.custodianId)?.name}
          </p>
          {batch.note ? (
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">{batch.note}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              importCsv(await file.text());
              e.target.value = "";
            }}
          />
          <button type="button" className={btnGhost} onClick={() => fileRef.current?.click()}>
            Import asset register (CSV)
          </button>
          <button type="button" className={btnPrimary} onClick={exportBatchCsv}>
            Download batch CSV
          </button>
        </div>
      </div>

      <Panel className="mb-6 grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
        <Metric label="Items" value={metrics.itemCount} sub={`${rec.matched.length} matched to register`} />
        <Metric label="Measured mass" value={kg(metrics.measuredMassKg, 1)} sub="Summed from item records" />
        <Metric
          label="Confirmed recovery mass"
          value={kg(metrics.confirmedRecoveryMassKg, 1)}
          sub={`Recorded recovered fractions ${kg(metrics.recordedRecoveredMassKg, 1)}`}
        />
        <Metric
          label="Awaiting disposition"
          value={metrics.awaitingCount}
          tone={metrics.awaitingCount ? "warn" : "ok"}
          sub={`${metrics.reuseCount} reuse · ${metrics.recoveryCount} recovery`}
        />
        <Metric
          label="Storage unresolved"
          value={metrics.unresolvedStorageCount}
          tone={metrics.unresolvedStorageCount ? "warn" : "ok"}
          sub={`${metrics.hazardCount} hazard-flagged · ${metrics.staleCount} stale`}
        />
      </Panel>

      <Panel>
        <PanelHeader
          title="Batch contents and reconciliation"
          description={`Asset register supplied by the institution holds ${batch.assetRegister.length} rows.`}
          actions={
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="bd-search">
                Search items in this batch
              </label>
              <input
                id="bd-search"
                className={`${inputCls} w-48`}
                placeholder="Search items"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          }
        />
        <div
          className="flex flex-wrap gap-1 border-b border-border px-5 py-2"
          role="tablist"
          aria-label="Batch views"
        >
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === t.key
                  ? "bg-ink text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {tab === "items" ? (
          filtered.length === 0 ? (
            <EmptyState title="No items match" body="Clear the search to see all items in this batch." />
          ) : (
            <TableScroll>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Serial</Th>
                    <Th>Category</Th>
                    <Th>Make / model</Th>
                    <Th align="right">Mass</Th>
                    <Th>Test</Th>
                    <Th>Asset tag</Th>
                    <Th>Storage</Th>
                    <Th>Disposition</Th>
                    <Th>Last event</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/60">
                      <Td>
                        <Link
                          to="/devices/$deviceId"
                          params={{ deviceId: d.id }}
                          className="font-mono text-[0.75rem] font-medium text-forest hover:underline"
                        >
                          {d.serial}
                        </Link>
                      </Td>
                      <Td>{d.category}</Td>
                      <Td className="text-muted-foreground">
                        {d.make} {d.model}
                      </Td>
                      <Td align="right">{kg(d.massKg)}</Td>
                      <Td>{d.functionalTest}</Td>
                      <Td className="font-mono text-[0.75rem]">{d.assetTag ?? "—"}</Td>
                      <Td>
                        {d.storage.length === 0
                          ? "—"
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
                        <span className={isStale(d) ? "text-warn" : "text-muted-foreground"}>
                          {ageLabel(lastEvent(d)?.at ?? state.demoToday)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )
        ) : null}

        {tab === "matched" ? (
          <TableScroll>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Asset tag</Th>
                  <Th>Item serial</Th>
                  <Th>Category</Th>
                  <Th align="right">Mass</Th>
                  <Th>Disposition</Th>
                </tr>
              </thead>
              <tbody>
                {rec.matched.map((m) => (
                  <tr key={m.assetTag}>
                    <Td className="font-mono text-[0.75rem]">{m.assetTag}</Td>
                    <Td>
                      <Link
                        to="/devices/$deviceId"
                        params={{ deviceId: m.device.id }}
                        className="font-mono text-[0.75rem] text-forest hover:underline"
                      >
                        {m.device.serial}
                      </Link>
                    </Td>
                    <Td>{m.device.category}</Td>
                    <Td align="right">{kg(m.device.massKg)}</Td>
                    <Td>{DISPOSITION_LABEL[m.device.disposition]}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : null}

        {tab === "unmatched" ? (
          rec.unmatched.length === 0 ? (
            <EmptyState
              title="Everything received is on the register"
              body="No item in this batch is missing an asset tag match."
            />
          ) : (
            <>
              <div className="px-5 pt-4">
                <Note tone="warn">
                  Received at intake but not present on the institution&apos;s supplied
                  register. These require confirmation from the institution before
                  disposition.
                </Note>
              </div>
              <TableScroll>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Serial</Th>
                      <Th>Category</Th>
                      <Th align="right">Mass</Th>
                      <Th>Condition</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rec.unmatched.map((d) => (
                      <tr key={d.id}>
                        <Td>
                          <Link
                            to="/devices/$deviceId"
                            params={{ deviceId: d.id }}
                            className="font-mono text-[0.75rem] text-forest hover:underline"
                          >
                            {d.serial}
                          </Link>
                        </Td>
                        <Td>{d.category}</Td>
                        <Td align="right">{kg(d.massKg)}</Td>
                        <Td className="text-muted-foreground">{d.conditionNote}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </>
          )
        ) : null}

        {tab === "missing" ? (
          rec.missing.length === 0 ? (
            <EmptyState
              title="Register fully accounted for"
              body="Every asset tag on the supplied register was matched to an item received at intake."
            />
          ) : (
            <>
              <div className="px-5 pt-4">
                <Note tone="danger">
                  On the institution&apos;s register but never received at intake. These
                  are reported as unaccounted, not assumed disposed.
                </Note>
              </div>
              <TableScroll>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Asset tag</Th>
                      <Th>Register description</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {rec.missing.map((m) => (
                      <tr key={m.assetTag}>
                        <Td className="font-mono text-[0.75rem]">{m.assetTag}</Td>
                        <Td className="text-muted-foreground">{m.description}</Td>
                        <Td>
                          <Status tone="danger">Not received</Status>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </>
          )
        ) : null}
      </Panel>
    </div>
  );
}
