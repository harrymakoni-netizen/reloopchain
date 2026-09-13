import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

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
import { btnGhost, selectCls } from "@/components/reloop/controls";
import { HAZARD_LABEL, kg, usd } from "@/lib/reloop/format";
import {
  ASSUMPTION_TABLE_DATE,
  ASSUMPTION_TABLE_VERSION,
  ESTIMATE_DISCLAIMER,
  RECOVERY_ASSUMPTIONS,
  SAMPLE_PRICE_DATE,
  estimateForMass,
} from "@/lib/reloop/recovery";
import { batchMetrics, devicesOfBatch } from "@/lib/reloop/logic";
import { useReloop } from "@/lib/reloop/store";
import type { DeviceCategory } from "@/lib/reloop/types";

export const Route = createFileRoute("/_workspace/recovery")({
  head: () => ({
    meta: [
      { title: "Recovery estimates — ReLoop" },
      {
        name: "description",
        content:
          "Illustrative, clearly marked demonstration assumptions for material composition, recovery efficiency and sample prices.",
      },
      { property: "og:title", content: "Recovery estimates — ReLoop" },
      {
        property: "og:description",
        content: "Mass-based illustrative recovery ranges with a transparent basis drawer.",
      },
    ],
  }),
  component: RecoveryPage,
});

function RecoveryPage() {
  const { state } = useReloop();
  const [batchId, setBatchId] = useState(state.batches[0]?.id ?? "");
  const [showBasis, setShowBasis] = useState(false);

  const devices = useMemo(() => devicesOfBatch(state, batchId), [state, batchId]);
  const metrics = batchMetrics(devices);

  const rollup = useMemo(() => {
    let low = 0;
    let high = 0;
    let preciousLow = 0;
    let preciousHigh = 0;
    const unsupported = new Map<DeviceCategory, number>();
    for (const d of devices) {
      const est = estimateForMass(d.category, d.massKg);
      if (!est.supported) {
        unsupported.set(d.category, (unsupported.get(d.category) ?? 0) + 1);
        continue;
      }
      low += est.totalLowUsd;
      high += est.totalHighUsd;
      for (const line of est.lines) {
        if (line.precious) {
          preciousLow += line.lowValueUsd;
          preciousHigh += line.highValueUsd;
        }
      }
    }
    return { low, high, preciousLow, preciousHigh, unsupported };
  }, [devices]);

  const hazardRows = useMemo(() => {
    const map = new Map<string, { count: number; massKg: number }>();
    for (const d of state.devices) {
      for (const h of d.hazardFlags) {
        const cur = map.get(h) ?? { count: 0, massKg: 0 };
        map.set(h, { count: cur.count + 1, massKg: cur.massKg + d.massKg });
      }
    }
    return [...map.entries()];
  }, [state.devices]);

  const recorded = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of devices) {
      for (const f of d.recoveredFractions) {
        map.set(f.material, (map.get(f.material) ?? 0) + f.massKg);
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [devices]);

  return (
    <div>
      <PageHeading
        eyebrow="Recovery"
        title="Illustrative recovery estimates"
        lede="These figures come from placeholder planning assumptions entered for this demonstration. They are not an assay, not a quotation, and no published composition study or live market feed is claimed."
        actions={
          <select
            className={`${selectCls} w-56`}
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            aria-label="Select batch"
          >
            {state.batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.ref}
              </option>
            ))}
          </select>
        }
      />

      <div className="mb-6">
        <Note tone="warn">
          {ESTIMATE_DISCLAIMER} Assumption table {ASSUMPTION_TABLE_VERSION}, entered{" "}
          {ASSUMPTION_TABLE_DATE}; sample unit prices dated {SAMPLE_PRICE_DATE}.
        </Note>
      </div>

      <Panel className="mb-6 grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <Metric
          label="Measured intake mass"
          value={kg(metrics.measuredMassKg, 1)}
          sub="Fact — weighed at intake"
        />
        <Metric
          label="Confirmed controlled-recovery mass"
          value={kg(metrics.confirmedRecoveryMassKg, 1)}
          sub="Items with a confirmed recovery disposition"
        />
        <Metric
          label="Actual recorded recovered fractions"
          value={kg(metrics.recordedRecoveredMassKg, 1)}
          sub="Reported by the processor, per item"
        />
        <Metric
          label="Illustrative estimated value"
          value={`${usd(rollup.low)} – ${usd(rollup.high)}`}
          sub="Demonstration assumptions only"
        />
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title="Batch-level estimate basis"
            description="Mass-based: measured mass × composition fraction × recovery efficiency × sample price."
            actions={
              <button
                type="button"
                className={btnGhost}
                onClick={() => setShowBasis((v) => !v)}
                aria-expanded={showBasis}
              >
                {showBasis ? "Hide detailed basis" : "Show detailed basis"}
              </button>
            }
          />
          {showBasis ? (
            <TableScroll>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Category</Th>
                    <Th>Material</Th>
                    <Th align="right">Fraction low</Th>
                    <Th align="right">Fraction high</Th>
                    <Th align="right">Recovery efficiency</Th>
                    <Th align="right">Sample price / kg</Th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(RECOVERY_ASSUMPTIONS).flatMap(([cat, lines]) =>
                    (lines ?? []).map((l) => (
                      <tr key={`${cat}-${l.material}`}>
                        <Td>{cat}</Td>
                        <Td>
                          {l.material}
                          {l.precious ? (
                            <span className="ml-2 text-[0.6875rem] text-muted-foreground">
                              precious-bearing
                            </span>
                          ) : null}
                        </Td>
                        <Td align="right">{(l.lowFraction * 100).toFixed(1)}%</Td>
                        <Td align="right">{(l.highFraction * 100).toFixed(1)}%</Td>
                        <Td align="right">{(l.recoveryEfficiency * 100).toFixed(0)}%</Td>
                        <Td align="right">{usd(l.samplePriceUsdPerKg)}</Td>
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </TableScroll>
          ) : (
            <div className="px-5 py-4 text-xs leading-relaxed text-muted-foreground">
              Every estimate is derived only from the measured mass of the item and the
              assumption row for its category. No device is inspected, assayed or sampled.
              Open the detailed basis to see every fraction, efficiency and sample price
              used.
            </div>
          )}

          <div className="border-t border-border px-5 py-4">
            <p className="label-caps mb-3">Items in {state.batches.find((b) => b.id === batchId)?.ref}</p>
            <TableScroll>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Serial</Th>
                    <Th>Category</Th>
                    <Th align="right">Measured mass</Th>
                    <Th align="right">Illustrative low</Th>
                    <Th align="right">Illustrative high</Th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => {
                    const est = estimateForMass(d.category, d.massKg);
                    return (
                      <tr key={d.id}>
                        <Td className="font-mono text-[0.75rem]">{d.serial}</Td>
                        <Td>{d.category}</Td>
                        <Td align="right">{kg(d.massKg)}</Td>
                        {est.supported ? (
                          <>
                            <Td align="right">{usd(est.totalLowUsd)}</Td>
                            <Td align="right">{usd(est.totalHighUsd)}</Td>
                          </>
                        ) : (
                          <Td align="right" className="text-muted-foreground">
                            reference unavailable for this category
                          </Td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableScroll>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Precious-metal bearing fraction"
              description="Batch level only. Never shown on an individual public passport."
            />
            <div className="px-5 py-4">
              <p className="tnum text-2xl font-semibold">
                {usd(rollup.preciousLow)} – {usd(rollup.preciousHigh)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Attributable to printed circuit assemblies across this batch under the
                demonstration assumptions. This is an aggregate planning figure, not a
                refiner settlement.
              </p>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Actual recorded recovered fractions" description="Reported per item by the processor." />
            {recorded.length === 0 ? (
              <div className="px-5 py-4 text-xs text-muted-foreground">
                No recovered fractions have been reported for this batch yet.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recorded.map(([material, mass]) => (
                  <li
                    key={material}
                    className="flex items-center justify-between px-5 py-2.5 text-xs"
                  >
                    <span>{material}</span>
                    <span className="tnum font-medium">{kg(mass)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Unsupported categories" />
            {rollup.unsupported.size === 0 ? (
              <div className="px-5 py-4 text-xs text-muted-foreground">
                Every category in this batch has an assumption row.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {[...rollup.unsupported.entries()].map(([cat, count]) => (
                  <li key={cat} className="flex items-center justify-between px-5 py-2.5 text-xs">
                    <span>
                      {cat} · {count} item(s)
                    </span>
                    <Status tone="muted">reference unavailable</Status>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Hazard overview" description="Across the whole workspace." />
            <ul className="divide-y divide-border">
              {hazardRows.map(([flag, v]) => (
                <li key={flag} className="flex items-center justify-between px-5 py-2.5 text-xs">
                  <span>{HAZARD_LABEL[flag as keyof typeof HAZARD_LABEL]}</span>
                  <span className="tnum text-muted-foreground">
                    {v.count} item(s) · {kg(v.massKg, 1)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="px-5 py-3 text-[0.6875rem] text-muted-foreground">
              Hazardous items may only be routed to a party recorded with hazardous-material
              scope. No environmental or emissions equivalence is claimed anywhere in this
              workspace.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
