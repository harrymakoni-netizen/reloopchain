import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
  Note,
  PageHeading,
  Panel,
  PanelHeader,
  Status,
  TableScroll,
  Td,
  Th,
} from "@/components/reloop/primitives";
import { btnGhost, btnPrimary, inputCls, selectCls } from "@/components/reloop/controls";
import {
  DISPOSITION_LABEL,
  HAZARD_LABEL,
  ageLabel,
  kg,
  shortDate,
} from "@/lib/reloop/format";
import { checkCustody, handlerStatus } from "@/lib/reloop/logic";
import { FACILITY_ID, useReloop, uid } from "@/lib/reloop/store";

export const Route = createFileRoute("/_workspace/custody")({
  head: () => ({
    meta: [
      { title: "Custody — ReLoop" },
      {
        name: "description",
        content:
          "Initiate and accept custody transfers. Expired, unverified and out-of-scope handlers are blocked with an explanation.",
      },
      { property: "og:title", content: "Custody — ReLoop" },
      {
        property: "og:description",
        content: "Chain-of-custody transfers with verification and hazard-scope routing rules.",
      },
    ],
  }),
  component: CustodyPage,
});

function CustodyPage() {
  const { state, addTransfer, resolveTransfer } = useReloop();
  const [selected, setSelected] = useState<string[]>([]);
  const [toParty, setToParty] = useState(state.handlers[1]?.id ?? "");
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");

  const transferable = useMemo(
    () =>
      state.devices
        .filter((d) => d.custodianId === FACILITY_ID)
        .filter((d) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            d.serial.toLowerCase().includes(q) ||
            d.category.toLowerCase().includes(q) ||
            `${d.make} ${d.model}`.toLowerCase().includes(q)
          );
        }),
    [state.devices, query],
  );

  const selectedDevices = state.devices.filter((d) => selected.includes(d.id));
  const handler = state.handlers.find((h) => h.id === toParty);
  const check = handler
    ? checkCustody(handler, selectedDevices)
    : { allowed: false, blockers: ["Select a receiving party."], warnings: [] };

  function initiate() {
    if (!handler || !check.allowed) {
      toast.error("This transfer is blocked. See the reasons listed.");
      return;
    }
    addTransfer({
      id: uid("trf"),
      deviceIds: selected,
      fromParty: FACILITY_ID,
      toParty: handler.id,
      initiatedAt: state.demoToday,
      acceptedAt: null,
      status: "pending",
      reason: reason.trim() || "Custody transfer initiated from the facility.",
    });
    setSelected([]);
    setReason("");
    toast.success("Transfer initiated. It stays pending until the receiving party accepts.");
  }

  return (
    <div>
      <PageHeading
        eyebrow="Chain of custody"
        title="Custody transfers"
        lede="Custody may pass only to a verified party with a current authorisation and the right hazard scope. Blocked transfers explain exactly why."
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title={`Select items (${selected.length} selected)`}
            description="Only items currently held by the facility can be transferred."
            actions={
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor="c-search">
                  Search items
                </label>
                <input
                  id="c-search"
                  className={`${inputCls} w-44`}
                  placeholder="Search items"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => setSelected([])}
                  disabled={selected.length === 0}
                >
                  Clear
                </button>
              </div>
            }
          />
          {transferable.length === 0 ? (
            <EmptyState title="Nothing to transfer" body="No items match, or all items have moved on to another custodian." />
          ) : (
            <TableScroll>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Select</Th>
                    <Th>Serial</Th>
                    <Th>Category</Th>
                    <Th align="right">Mass</Th>
                    <Th>Hazards</Th>
                    <Th>Disposition</Th>
                  </tr>
                </thead>
                <tbody>
                  {transferable.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/60">
                      <Td>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(d.id)}
                            onChange={() =>
                              setSelected((prev) =>
                                prev.includes(d.id)
                                  ? prev.filter((x) => x !== d.id)
                                  : [...prev, d.id],
                              )
                            }
                            aria-label={`Select ${d.serial}`}
                          />
                        </label>
                      </Td>
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
                      <Td>
                        {d.hazardFlags.length === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-warn">
                            {d.hazardFlags.map((h) => HAZARD_LABEL[h]).join(", ")}
                          </span>
                        )}
                      </Td>
                      <Td className="text-muted-foreground">
                        {DISPOSITION_LABEL[d.disposition]}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Initiate transfer" />
            <div className="space-y-4 px-5 py-5">
              <Field label="Receiving party" htmlFor="c-to">
                <select
                  id="c-to"
                  className={selectCls}
                  value={toParty}
                  onChange={(e) => setToParty(e.target.value)}
                >
                  {state.handlers
                    .filter((h) => h.id !== FACILITY_ID)
                    .map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} · {h.tier}
                      </option>
                    ))}
                </select>
              </Field>
              {handler ? (
                <div className="rounded-sm border border-border px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{handler.name}</span>
                    <Status tone={handlerStatus(handler).eligible ? "ok" : "danger"}>
                      {handlerStatus(handler).label}
                    </Status>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {handler.tier} · authorisation {handler.authorisationRef} · expires{" "}
                    {shortDate(handler.authorisationExpiry)} ·{" "}
                    {handler.hazardScope ? "hazard scope held" : "no hazard scope"}
                  </p>
                </div>
              ) : null}
              <Field label="Reason / consignment note" htmlFor="c-reason">
                <input
                  id="c-reason"
                  className={inputCls}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Metal recovery of stripped chassis"
                />
              </Field>

              {check.blockers.length > 0 ? (
                <div className="space-y-2">
                  {check.blockers.map((b) => (
                    <Note key={b} tone="danger">
                      {b}
                    </Note>
                  ))}
                </div>
              ) : null}
              {check.warnings.map((w) => (
                <Note key={w} tone="warn">
                  {w}
                </Note>
              ))}

              <button
                type="button"
                className={btnPrimary}
                onClick={initiate}
                disabled={!check.allowed}
              >
                {check.allowed ? "Initiate transfer" : "Transfer blocked"}
              </button>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Transfers"
              description="Accepted events are appended in order within this demonstration; they are not a secured immutable audit trail."
            />
            {state.transfers.length === 0 ? (
              <EmptyState title="No transfers yet" body="Initiate a transfer to see it here." />
            ) : (
              <ul className="divide-y divide-border">
                {state.transfers.map((t) => {
                  const to = state.handlers.find((h) => h.id === t.toParty);
                  return (
                    <li key={t.id} className="px-5 py-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{to?.name}</span>
                        <Status
                          tone={
                            t.status === "accepted"
                              ? "ok"
                              : t.status === "declined"
                                ? "danger"
                                : "warn"
                          }
                        >
                          {t.status}
                        </Status>
                      </div>
                      <p className="mt-1 text-muted-foreground">
                        {t.deviceIds.length} item(s) · initiated {shortDate(t.initiatedAt)} (
                        {ageLabel(t.initiatedAt)})
                        {t.acceptedAt ? ` · accepted ${shortDate(t.acceptedAt)}` : ""}
                      </p>
                      <p className="mt-1 text-muted-foreground">{t.reason}</p>
                      {t.status === "pending" ? (
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className={btnPrimary}
                            onClick={() => {
                              resolveTransfer(t.id, true, "Custody accepted by receiving party.");
                              toast.success("Custody accepted and recorded on each item.");
                            }}
                          >
                            Accept as receiving party
                          </button>
                          <button
                            type="button"
                            className={btnGhost}
                            onClick={() => {
                              resolveTransfer(t.id, false, "Custody declined by receiving party.");
                              toast("Transfer declined; custody unchanged.");
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
