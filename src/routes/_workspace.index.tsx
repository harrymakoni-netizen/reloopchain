import { Link, createFileRoute } from "@tanstack/react-router";

import {
  EmptyState,
  Metric,
  Mono,
  Panel,
  PanelHeader,
  Status,
  TableScroll,
  Td,
  Th,
} from "@/components/reloop/primitives";
import {
  DISPOSITION_LABEL,
  ageLabel,
  isStale,
  kg,
  lastEvent,
  shortDate,
  storageResolved,
} from "@/lib/reloop/format";
import {
  batchMetrics,
  devicesOfBatch,
  handlerStatus,
  overviewMetrics,
} from "@/lib/reloop/logic";
import { useReloop } from "@/lib/reloop/store";

export const Route = createFileRoute("/_workspace/")({
  head: () => ({
    meta: [
      { title: "Operations overview — ReLoop by HJM Technologies" },
      {
        name: "description",
        content:
          "Live operations overview for institutional e-waste intake, custody and disposition evidence.",
      },
      { property: "og:title", content: "Operations overview — ReLoop" },
      {
        property: "og:description",
        content:
          "Batches, custody, hazard routing and disposition evidence in one institutional workspace.",
      },
    ],
  }),
  component: Overview,
});

function FlowBar({
  segments,
  total,
}: {
  segments: { label: string; value: number; className: string }[];
  total: number;
}) {
  return (
    <div>
      <div className="flex h-8 w-full overflow-hidden rounded-sm border border-border">
        {segments.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          if (pct <= 0) return null;
          return (
            <div
              key={s.label}
              className={s.className}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${kg(s.value)}`}
            />
          );
        })}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className={`size-2 rounded-[2px] ${s.className}`} />
              {s.label}
            </span>
            <span className="tnum font-medium text-foreground">{kg(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Overview() {
  const { state } = useReloop();
  const m = overviewMetrics(state);

  const reuseMass = state.devices
    .filter((d) => d.disposition === "reuse-redeployed")
    .reduce((s, d) => s + d.massKg, 0);
  const awaitingMass = state.devices
    .filter((d) => d.disposition === "awaiting")
    .reduce((s, d) => s + d.massKg, 0);

  const attention = [
    ...state.devices
      .filter((d) => !storageResolved(d))
      .map((d) => ({
        id: `${d.id}-storage`,
        device: d,
        tone: "danger" as const,
        label: "Storage unresolved",
        detail:
          d.storage.find((s) => s.record?.result === "failed")
            ? "A data destruction attempt failed and has not been re-run."
            : "An identified storage device has no verified destruction record.",
      })),
    ...state.devices
      .filter((d) => isStale(d) && d.disposition === "awaiting")
      .map((d) => ({
        id: `${d.id}-stale`,
        device: d,
        tone: "warn" as const,
        label: "Stale record",
        detail: `No recorded event for ${ageLabel(lastEvent(d)?.at ?? state.demoToday)}.`,
      })),
    ...state.devices
      .filter((d) => d.hazardFlags.length > 0 && d.disposition === "awaiting")
      .map((d) => ({
        id: `${d.id}-hazard`,
        device: d,
        tone: "warn" as const,
        label: "Hazard held",
        detail: "Hazard-flagged item awaiting a hazard-scoped receiving party.",
      })),
  ].slice(0, 8);

  const expiredHandlers = state.handlers.filter(
    (h) => handlerStatus(h).expired || !h.verified,
  );

  return (
    <div>
      <div className="grid gap-8 pb-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <p className="label-caps">Operations overview</p>
          <h1 className="mt-3 max-w-xl text-4xl font-semibold leading-[1.05] text-foreground md:text-5xl">
            Every device.
            <br />
            Accounted for.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Institutional disposal evidence for {state.institutions.length} originating
            organisations. Each item carries a measured mass, a functional test outcome,
            its storage media, hazard flags, custodian and an event history — rolled up,
            never estimated, into the batch figures below.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/intake"
              className="rounded-sm bg-forest px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-ink"
            >
              Register an item
            </Link>
            <Link
              to="/settings"
              className="rounded-sm border border-border-strong px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Guided expo walkthrough
            </Link>
          </div>
        </div>

        <Panel className="hairline-grid">
          <div className="border-b border-border bg-surface/85 px-5 py-3">
            <p className="label-caps">Confirmed disposition</p>
            <p className="tnum mt-2 text-3xl font-semibold">
              {m.confirmedDispositions}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {m.totalItems} items
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unconfirmed items remain “awaiting disposition”. Nothing is inferred.
            </p>
          </div>
          <dl className="grid grid-cols-2 bg-surface/85 text-xs">
            <div className="border-r border-border px-5 py-3">
              <dt className="label-caps">Measured intake mass</dt>
              <dd className="tnum mt-1 text-base font-semibold">
                {kg(m.measuredMassKg, 1)}
              </dd>
            </div>
            <div className="px-5 py-3">
              <dt className="label-caps">Recorded recovered</dt>
              <dd className="tnum mt-1 text-base font-semibold">
                {kg(m.recordedRecoveredMassKg, 1)}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>

      <Panel className="mb-8 grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
        <Metric label="Items on record" value={m.totalItems} sub={`${m.openBatches} open batches`} />
        <Metric
          label="Awaiting disposition"
          value={m.awaitingCount}
          tone={m.awaitingCount > 0 ? "warn" : "default"}
          sub="Not yet confirmed by a receiving party"
        />
        <Metric
          label="Controlled recovery"
          value={kg(m.confirmedRecoveryMassKg, 1)}
          sub={`${m.recoveryCount} items confirmed`}
        />
        <Metric
          label="Hazard-flagged"
          value={m.hazardCount}
          sub="Restricted routing applies"
        />
        <Metric
          label="Storage unresolved"
          value={m.unresolvedStorageCount}
          tone={m.unresolvedStorageCount > 0 ? "warn" : "ok"}
          sub="Blocks certificate specimens"
        />
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title="Batches"
            description="Figures derive from item records — they are not entered at batch level."
            actions={
              <Link
                to="/batches"
                className="rounded-sm border border-border px-2.5 py-1 text-xs font-medium hover:bg-secondary"
              >
                All batches
              </Link>
            }
          />
          <TableScroll>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Batch</Th>
                  <Th>Institution</Th>
                  <Th align="right">Items</Th>
                  <Th align="right">Mass</Th>
                  <Th align="right">Awaiting</Th>
                  <Th align="right">Hazard</Th>
                  <Th align="right">Stale</Th>
                  <Th>Collected</Th>
                </tr>
              </thead>
              <tbody>
                {state.batches.map((b) => {
                  const devices = devicesOfBatch(state, b.id);
                  const bm = batchMetrics(devices);
                  const inst = state.institutions.find((i) => i.id === b.institutionId);
                  return (
                    <tr key={b.id} className="hover:bg-muted/60">
                      <Td>
                        <Link
                          to="/batches/$batchId"
                          params={{ batchId: b.id }}
                          className="whitespace-nowrap font-mono text-[0.75rem] font-medium text-forest underline-offset-2 hover:underline"
                        >
                          {b.ref}
                        </Link>
                      </Td>
                      <Td className="max-w-[220px] truncate">
                        {inst?.name}
                        <span className="block text-[0.6875rem] text-muted-foreground">
                          {inst?.city}
                        </span>
                      </Td>
                      <Td align="right">{bm.itemCount}</Td>
                      <Td align="right">{kg(bm.measuredMassKg, 1)}</Td>
                      <Td align="right">
                        {bm.awaitingCount > 0 ? (
                          <Status tone="warn" dot={false}>
                            {bm.awaitingCount}
                          </Status>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </Td>
                      <Td align="right">{bm.hazardCount}</Td>
                      <Td align="right">
                        {bm.staleCount > 0 ? (
                          <span className="text-warn">{bm.staleCount}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </Td>
                      <Td>{shortDate(b.collectedAt)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
          <div className="border-t border-border px-5 py-4">
            <p className="label-caps mb-3">Material flow by measured mass</p>
            <FlowBar
              total={m.measuredMassKg}
              segments={[
                {
                  label: "Reuse — redeployed",
                  value: reuseMass,
                  className: "bg-fresh",
                },
                {
                  label: "Controlled recovery (confirmed)",
                  value: m.confirmedRecoveryMassKg,
                  className: "bg-forest",
                },
                {
                  label: "Awaiting disposition",
                  value: awaitingMass,
                  className: "bg-warn/55",
                },
              ]}
            />
            <p className="mt-3 text-[0.6875rem] leading-relaxed text-muted-foreground">
              Measured intake mass {kg(m.measuredMassKg, 1)} · recorded recovered
              fractions {kg(m.recordedRecoveredMassKg, 1)}. Recovered fractions are
              separately recorded outputs and are deliberately not netted against intake
              mass. No carbon or emissions equivalence is claimed.
            </p>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Attention queue"
              description="Items whose evidence is incomplete, stale or restricted."
            />
            {attention.length === 0 ? (
              <EmptyState
                title="Nothing needs attention"
                body="Every item has a current event, resolved storage and an eligible route."
              />
            ) : (
              <ul className="divide-y divide-border">
                {attention.map((a) => (
                  <li key={a.id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        to="/devices/$deviceId"
                        params={{ deviceId: a.device.id }}
                        className="truncate font-mono text-[0.75rem] font-medium text-forest hover:underline"
                      >
                        {a.device.serial}
                      </Link>
                      <Status tone={a.tone}>{a.label}</Status>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {a.detail}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader
              title="Routing restrictions"
              description="Parties that cannot currently receive custody."
            />
            <ul className="divide-y divide-border">
              {expiredHandlers.map((h) => (
                <li key={h.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[0.8125rem] font-medium">{h.name}</span>
                    <Status tone="danger">
                      {handlerStatus(h).expired ? "Expired" : "Unverified"}
                    </Status>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {h.tier} · <Mono>{h.authorisationRef}</Mono> · expires{" "}
                    {shortDate(h.authorisationExpiry)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-5 py-3">
              <Link
                to="/handlers"
                className="text-xs font-semibold text-forest hover:underline"
              >
                Handler network →
              </Link>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Most recent activity" />
            <ul className="divide-y divide-border">
              {[...state.devices]
                .map((d) => ({ d, e: lastEvent(d) }))
                .filter((x) => Boolean(x.e))
                .sort((a, b) => (a.e!.at > b.e!.at ? -1 : 1))
                .slice(0, 5)
                .map(({ d, e }) => (
                  <li key={d.id} className="px-5 py-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        to="/devices/$deviceId"
                        params={{ deviceId: d.id }}
                        className="font-mono text-[0.75rem] text-forest hover:underline"
                      >
                        {d.serial}
                      </Link>
                      <span className="text-muted-foreground">{ageLabel(e!.at)}</span>
                    </div>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {e!.note} <span className="text-foreground/70">— {e!.actor}</span>
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {DISPOSITION_LABEL[d.disposition]}
                    </p>
                  </li>
                ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
