import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import {
  EmptyState,
  PageHeading,
  Panel,
  PanelHeader,
  Status,
  TableScroll,
  Td,
  Th,
} from "@/components/reloop/primitives";
import { btnGhost, inputCls, selectCls } from "@/components/reloop/controls";
import {
  DISPOSITION_LABEL,
  HAZARD_LABEL,
  ageLabel,
  isStale,
  kg,
  lastEvent,
  storageResolved,
} from "@/lib/reloop/format";
import { useReloop } from "@/lib/reloop/store";
import type { Disposition } from "@/lib/reloop/types";

export const Route = createFileRoute("/_workspace/devices/")({
  head: () => ({
    meta: [
      { title: "Devices — ReLoop" },
      {
        name: "description",
        content:
          "Search every registered item by serial, asset tag, make, model or storage serial and open its full passport.",
      },
      { property: "og:title", content: "Devices — ReLoop" },
      {
        property: "og:description",
        content: "Item-level register with mass, hazard flags, custody and disposition.",
      },
    ],
  }),
  component: DevicesPage,
});

const dispositionTone: Record<Disposition, "ok" | "warn" | "neutral" | "danger"> = {
  awaiting: "warn",
  "reuse-redeployed": "ok",
  "controlled-recovery": "neutral",
  rejected: "danger",
};

function DevicesPage() {
  const { state } = useReloop();
  const [query, setQuery] = useState("");
  const [batchId, setBatchId] = useState("all");
  const [disposition, setDisposition] = useState("all");
  const [flag, setFlag] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.devices
      .filter((d) => batchId === "all" || d.batchId === batchId)
      .filter((d) => disposition === "all" || d.disposition === disposition)
      .filter((d) => {
        if (flag === "hazard") return d.hazardFlags.length > 0;
        if (flag === "stale") return isStale(d);
        if (flag === "storage") return !storageResolved(d);
        return true;
      })
      .filter((d) => {
        if (!q) return true;
        return (
          d.serial.toLowerCase().includes(q) ||
          (d.assetTag?.toLowerCase().includes(q) ?? false) ||
          d.make.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.storage.some((s) => s.serial.toLowerCase().includes(q))
        );
      });
  }, [state.devices, query, batchId, disposition, flag]);

  return (
    <div>
      <PageHeading
        eyebrow="Item register"
        title="Devices"
        lede="Every item carries its own serial, measured mass, functional test outcome, storage media, hazard flags and event history."
      />

      <Panel>
        <PanelHeader
          title={`${rows.length} of ${state.devices.length} items`}
          description="Search matches serial, asset tag, make, model, category and storage-media serials."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="d-search">
                Search devices
              </label>
              <input
                id="d-search"
                className={`${inputCls} w-52`}
                placeholder="Search items"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <label className="sr-only" htmlFor="d-batch">
                Filter by batch
              </label>
              <select
                id="d-batch"
                className={`${selectCls} w-40`}
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
              >
                <option value="all">All batches</option>
                {state.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.ref}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="d-disp">
                Filter by disposition
              </label>
              <select
                id="d-disp"
                className={`${selectCls} w-44`}
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
              >
                <option value="all">Any disposition</option>
                {Object.entries(DISPOSITION_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="d-flag">
                Filter by exception
              </label>
              <select
                id="d-flag"
                className={`${selectCls} w-40`}
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
              >
                <option value="all">No exception filter</option>
                <option value="hazard">Hazard flagged</option>
                <option value="stale">Stale record</option>
                <option value="storage">Storage unresolved</option>
              </select>
            </div>
          }
        />

        {rows.length === 0 ? (
          <EmptyState
            title="No items match"
            body="Nothing in the register matches this combination of search text and filters."
            action={
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  setQuery("");
                  setBatchId("all");
                  setDisposition("all");
                  setFlag("all");
                }}
              >
                Clear all filters
              </button>
            }
          />
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
                  <Th>Hazards</Th>
                  <Th>Disposition</Th>
                  <Th>Last event</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const e = lastEvent(d);
                  const stale = isStale(d);
                  return (
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
                      <Td>
                        <Status
                          tone={
                            d.functionalTest === "pass"
                              ? "ok"
                              : d.functionalTest === "fail"
                                ? "danger"
                                : "muted"
                          }
                        >
                          {d.functionalTest}
                        </Status>
                      </Td>
                      <Td className="font-mono text-[0.75rem]">
                        {d.assetTag ?? (
                          <span className="font-sans text-muted-foreground">unmatched</span>
                        )}
                      </Td>
                      <Td>
                        {d.storage.length === 0 ? (
                          <span className="text-muted-foreground">none identified</span>
                        ) : storageResolved(d) ? (
                          <Status tone="ok">{d.storage.length} resolved</Status>
                        ) : (
                          <Status tone="danger">unresolved</Status>
                        )}
                      </Td>
                      <Td>
                        {d.hazardFlags.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-[0.75rem] text-warn">
                            {d.hazardFlags.map((h) => HAZARD_LABEL[h]).join(", ")}
                          </span>
                        )}
                      </Td>
                      <Td>
                        <Status tone={dispositionTone[d.disposition]}>
                          {DISPOSITION_LABEL[d.disposition]}
                        </Status>
                      </Td>
                      <Td>
                        <span className={stale ? "text-warn" : "text-muted-foreground"}>
                          {e ? ageLabel(e.at) : "no events"}
                          {stale ? " · stale" : ""}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>
    </div>
  );
}
