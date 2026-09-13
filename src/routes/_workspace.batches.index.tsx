import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
  PageHeading,
  Panel,
  PanelHeader,
  Status,
  TableScroll,
  Td,
  Th,
} from "@/components/reloop/primitives";
import { btnGhost, btnPrimary, inputCls, selectCls } from "@/components/reloop/controls";
import { kg, shortDate } from "@/lib/reloop/format";
import { batchMetrics, devicesOfBatch } from "@/lib/reloop/logic";
import { FACILITY_ID, useReloop, uid } from "@/lib/reloop/store";

export const Route = createFileRoute("/_workspace/batches/")({
  head: () => ({
    meta: [
      { title: "Batches — ReLoop" },
      {
        name: "description",
        content:
          "Institutional collection batches with item rollups, asset register reconciliation and disposition status.",
      },
      { property: "og:title", content: "Batches — ReLoop" },
      {
        property: "og:description",
        content: "Collection batches, rollups and asset register reconciliation.",
      },
    ],
  }),
  component: BatchesPage,
});

function BatchesPage() {
  const { state, addBatch } = useReloop();
  const [query, setQuery] = useState("");
  const [institution, setInstitution] = useState("all");
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    ref: "",
    institutionId: state.institutions[0]?.id ?? "",
    collectedAt: state.demoToday,
    location: "",
    note: "",
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.batches
      .filter((b) => institution === "all" || b.institutionId === institution)
      .filter((b) => {
        if (!q) return true;
        const inst = state.institutions.find((i) => i.id === b.institutionId);
        return (
          b.ref.toLowerCase().includes(q) ||
          b.location.toLowerCase().includes(q) ||
          (inst?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .map((b) => ({
        batch: b,
        metrics: batchMetrics(devicesOfBatch(state, b.id)),
        institution: state.institutions.find((i) => i.id === b.institutionId),
      }));
  }, [state, query, institution]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ref.trim()) {
      toast.error("A batch reference is required.");
      return;
    }
    if (state.batches.some((b) => b.ref.toLowerCase() === form.ref.trim().toLowerCase())) {
      toast.error("That batch reference already exists.");
      return;
    }
    addBatch({
      id: uid("bat"),
      ref: form.ref.trim().toUpperCase(),
      institutionId: form.institutionId,
      openedAt: state.demoToday,
      collectedAt: form.collectedAt,
      location: form.location.trim() || "Not recorded",
      custodianId: FACILITY_ID,
      note: form.note.trim(),
      assetRegister: [],
      closed: false,
    });
    setForm({ ...form, ref: "", location: "", note: "" });
    setCreating(false);
    toast.success("Batch created. Register items from Intake.");
  }

  return (
    <div>
      <PageHeading
        eyebrow="Collections"
        title="Batches"
        lede="A batch is one institutional collection event. Every figure shown here is summed from the item records inside it."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setCreating((v) => !v)}>
            {creating ? "Cancel" : "Create batch"}
          </button>
        }
      />

      {creating ? (
        <Panel className="mb-6">
          <PanelHeader title="New batch" description="Sample data only — created batches live in this browser." />
          <form onSubmit={submit} className="grid gap-4 px-5 py-5 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Batch reference" htmlFor="b-ref" hint="e.g. HRE-2026-021">
              <input
                id="b-ref"
                className={inputCls}
                value={form.ref}
                onChange={(e) => setForm({ ...form, ref: e.target.value })}
                placeholder="HRE-2026-021"
              />
            </Field>
            <Field label="Originating institution" htmlFor="b-inst">
              <select
                id="b-inst"
                className={selectCls}
                value={form.institutionId}
                onChange={(e) => setForm({ ...form, institutionId: e.target.value })}
              >
                {state.institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Collection date" htmlFor="b-date">
              <input
                id="b-date"
                type="date"
                className={inputCls}
                value={form.collectedAt}
                onChange={(e) => setForm({ ...form, collectedAt: e.target.value })}
              />
            </Field>
            <Field label="Collection location" htmlFor="b-loc">
              <input
                id="b-loc"
                className={inputCls}
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Harare · Msasa depot"
              />
            </Field>
            <Field label="Note" htmlFor="b-note" hint="Scope, contact, handover conditions.">
              <input
                id="b-note"
                className={inputCls}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" className={btnPrimary}>
                Create batch
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader
          title={`${rows.length} batch${rows.length === 1 ? "" : "es"}`}
          description="Search matches batch reference, institution and location."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="b-search">
                Search batches
              </label>
              <input
                id="b-search"
                className={`${inputCls} w-48`}
                placeholder="Search batches"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <label className="sr-only" htmlFor="b-filter">
                Filter by institution
              </label>
              <select
                id="b-filter"
                className={`${selectCls} w-48`}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              >
                <option value="all">All institutions</option>
                {state.institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        {rows.length === 0 ? (
          <EmptyState
            title="No batches match"
            body="Adjust the search text or clear the institution filter."
            action={
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  setQuery("");
                  setInstitution("all");
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <TableScroll>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Batch</Th>
                  <Th>Institution</Th>
                  <Th>Location</Th>
                  <Th align="right">Items</Th>
                  <Th align="right">Measured mass</Th>
                  <Th align="right">Reuse</Th>
                  <Th align="right">Recovery</Th>
                  <Th align="right">Awaiting</Th>
                  <Th align="right">Storage open</Th>
                  <Th>Collected</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ batch, metrics, institution: inst }) => (
                  <tr key={batch.id} className="hover:bg-muted/60">
                    <Td>
                      <Link
                        to="/batches/$batchId"
                        params={{ batchId: batch.id }}
                        className="font-mono text-[0.75rem] font-medium text-forest hover:underline"
                      >
                        {batch.ref}
                      </Link>
                    </Td>
                    <Td className="max-w-[200px] truncate">{inst?.name}</Td>
                    <Td className="max-w-[180px] truncate text-muted-foreground">
                      {batch.location}
                    </Td>
                    <Td align="right">{metrics.itemCount}</Td>
                    <Td align="right">{kg(metrics.measuredMassKg, 1)}</Td>
                    <Td align="right">{metrics.reuseCount}</Td>
                    <Td align="right">{metrics.recoveryCount}</Td>
                    <Td align="right">
                      {metrics.awaitingCount > 0 ? (
                        <Status tone="warn" dot={false}>
                          {metrics.awaitingCount}
                        </Status>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </Td>
                    <Td align="right">
                      {metrics.unresolvedStorageCount > 0 ? (
                        <span className="text-danger">{metrics.unresolvedStorageCount}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </Td>
                    <Td>{shortDate(batch.collectedAt)}</Td>
                    <Td>
                      <Link
                        to="/batches/$batchId"
                        params={{ batchId: batch.id }}
                        className="text-xs font-semibold text-forest hover:underline"
                      >
                        Open
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
      </Panel>
    </div>
  );
}
