import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  EmptyState,
  Note,
  PageHeading,
  Panel,
  PanelHeader,
  Status,
  TableScroll,
  Td,
  Th,
} from "@/components/reloop/primitives";
import { inputCls } from "@/components/reloop/controls";
import { kg, shortDate } from "@/lib/reloop/format";
import { handlerStatus } from "@/lib/reloop/logic";
import { FACILITY_ID, useReloop } from "@/lib/reloop/store";

export const Route = createFileRoute("/_workspace/handlers")({
  head: () => ({
    meta: [
      { title: "Handler network — ReLoop" },
      {
        name: "description",
        content:
          "Verification tier, authorisation scope and expiry for every receiving party, plus their incoming work.",
      },
      { property: "og:title", content: "Handler network — ReLoop" },
      {
        property: "og:description",
        content: "Verification tiers, authorisation scope and incoming consignments.",
      },
    ],
  }),
  component: HandlersPage,
});

function HandlersPage() {
  const { state } = useReloop();
  const [query, setQuery] = useState("");

  const handlers = state.handlers.filter((h) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.tier.toLowerCase().includes(q) ||
      h.scope.join(" ").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeading
        eyebrow="Network"
        title="Handler network"
        lede="Every party in this demonstration is fictional. Authorisation references are sample values and assert nothing about any real licence, agency or partnership."
      />

      <div className="mb-6">
        <Note tone="muted">
          Tier determines what a party may do: collectors aggregate and transport only,
          processors dismantle and recover, refiners take separated material streams.
          Hazard scope is recorded separately and is required for hazard-flagged items.
        </Note>
      </div>

      <Panel>
        <PanelHeader
          title={`${handlers.length} parties`}
          actions={
            <>
              <label className="sr-only" htmlFor="h-search">
                Search handlers
              </label>
              <input
                id="h-search"
                className={`${inputCls} w-52`}
                placeholder="Search handlers"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </>
          }
        />
        {handlers.length === 0 ? (
          <EmptyState title="No parties match" body="Clear the search to see the full network." />
        ) : (
          <TableScroll>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Party</Th>
                  <Th>Tier</Th>
                  <Th>City</Th>
                  <Th>Scope</Th>
                  <Th>Hazard scope</Th>
                  <Th>Authorisation</Th>
                  <Th>Expiry</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {handlers.map((h) => {
                  const st = handlerStatus(h);
                  return (
                    <tr key={h.id} className="hover:bg-muted/60">
                      <Td>
                        {h.name}
                        {h.id === FACILITY_ID ? (
                          <span className="ml-2 text-[0.6875rem] text-muted-foreground">
                            this facility
                          </span>
                        ) : null}
                        <span className="block text-[0.6875rem] text-muted-foreground">
                          {h.contact}
                        </span>
                      </Td>
                      <Td className="capitalize">{h.tier}</Td>
                      <Td>{h.city}</Td>
                      <Td className="max-w-[240px] text-muted-foreground">
                        {h.scope.join(" · ")}
                      </Td>
                      <Td>
                        {h.hazardScope ? (
                          <Status tone="ok">Held</Status>
                        ) : (
                          <Status tone="muted">Not held</Status>
                        )}
                      </Td>
                      <Td className="font-mono text-[0.75rem]">{h.authorisationRef}</Td>
                      <Td>{shortDate(h.authorisationExpiry)}</Td>
                      <Td>
                        <Status tone={st.eligible ? "ok" : "danger"}>{st.label}</Status>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {handlers.map((h) => {
          const incoming = state.transfers.filter((t) => t.toParty === h.id);
          const held = state.devices.filter((d) => d.custodianId === h.id);
          const st = handlerStatus(h);
          return (
            <Panel key={h.id}>
              <PanelHeader
                title={h.name}
                description={`${h.tier} · ${h.city}`}
                actions={<Status tone={st.eligible ? "ok" : "danger"}>{st.eligible ? "Eligible" : "Blocked"}</Status>}
              />
              <dl className="px-5 py-4 text-xs">
                <div className="flex justify-between border-b border-border/70 py-1.5">
                  <dt className="text-muted-foreground">Items currently held</dt>
                  <dd className="tnum font-medium">
                    {held.length} · {kg(held.reduce((s, d) => s + d.massKg, 0), 1)}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-border/70 py-1.5">
                  <dt className="text-muted-foreground">Incoming consignments</dt>
                  <dd className="tnum font-medium">{incoming.length}</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-muted-foreground">Pending acceptance</dt>
                  <dd className="tnum font-medium">
                    {incoming.filter((t) => t.status === "pending").length}
                  </dd>
                </div>
              </dl>
              {!st.eligible ? (
                <div className="px-5 pb-4">
                  <Note tone="danger">
                    {h.verified
                      ? `Authorisation expired on ${shortDate(h.authorisationExpiry)}. Custody transfers to this party are blocked.`
                      : "Verification is incomplete in this workspace, so custody transfers to this party are blocked."}
                  </Note>
                </div>
              ) : null}
              <div className="border-t border-border px-5 py-3">
                <Link to="/custody" className="text-xs font-semibold text-forest hover:underline">
                  Route work to this party →
                </Link>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
