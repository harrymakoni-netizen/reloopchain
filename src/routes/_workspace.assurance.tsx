import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Field,
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
import { btnGhost, btnPrimary, inputCls, selectCls } from "@/components/reloop/controls";
import { METHOD_LABEL, shortDate } from "@/lib/reloop/format";
import { useReloop, uid } from "@/lib/reloop/store";
import type { SanitisationMethod, SanitisationResult } from "@/lib/reloop/types";

export const Route = createFileRoute("/_workspace/assurance")({
  head: () => ({
    meta: [
      { title: "Data assurance — ReLoop" },
      {
        name: "description",
        content:
          "Record externally performed storage-media sanitisation and physical destruction evidence against each identified drive.",
      },
      { property: "og:title", content: "Data assurance — ReLoop" },
      {
        property: "og:description",
        content: "Storage-media destruction evidence: method, operator, date, result and witness.",
      },
    ],
  }),
  component: AssurancePage,
});

const METHODS = Object.keys(METHOD_LABEL) as SanitisationMethod[];

function AssurancePage() {
  const { state, setSanitisation } = useReloop();
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [target, setTarget] = useState<{ deviceId: string; storageId: string } | null>(null);
  const [form, setForm] = useState({
    method: "overwrite-purge" as SanitisationMethod,
    operator: "",
    performedAt: state.demoToday,
    result: "verified" as SanitisationResult,
    standardRef: "",
    evidenceNote: "",
    witness: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rows = useMemo(() => {
    const all = state.devices.flatMap((d) =>
      d.storage.map((s) => ({ device: d, storage: s })),
    );
    return filter === "all"
      ? all
      : all.filter((r) => !r.storage.record || r.storage.record.result !== "verified");
  }, [state.devices, filter]);

  const totals = useMemo(() => {
    const all = state.devices.flatMap((d) => d.storage);
    return {
      total: all.length,
      verified: all.filter((s) => s.record?.result === "verified").length,
      failed: all.filter((s) => s.record?.result === "failed").length,
      none: all.filter((s) => !s.record || s.record.result === "pending").length,
    };
  }, [state.devices]);

  function save() {
    if (!target) return;
    const e: Record<string, string> = {};
    if (!form.operator.trim()) e["operator"] = "Record who performed the work.";
    if (!form.evidenceNote.trim()) e["evidenceNote"] = "Describe the evidence held.";
    if (form.method === "physical-destruction" && !form.witness.trim())
      e["witness"] = "Physical destruction requires a named witness.";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Fix the highlighted fields.");
      return;
    }
    setSanitisation(target.deviceId, target.storageId, {
      id: uid("san"),
      method: form.method,
      operator: form.operator.trim(),
      performedAt: form.performedAt,
      result: form.result,
      standardRef: form.standardRef.trim() || null,
      evidenceNote: form.evidenceNote.trim(),
      witness: form.witness.trim() || null,
    });
    setTarget(null);
    setForm({ ...form, operator: "", evidenceNote: "", witness: "", standardRef: "" });
    toast.success("Destruction record saved against the drive.");
  }

  const targetDevice = state.devices.find((d) => d.id === target?.deviceId);
  const targetStorage = targetDevice?.storage.find((s) => s.id === target?.storageId);

  return (
    <div>
      <PageHeading
        eyebrow="Assurance"
        title="Data destruction records"
        lede="ReLoop does not erase drives. It records evidence of sanitisation or physical destruction performed by an operator, tied to a specific storage serial."
      />

      <Panel className="mb-6 grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <Metric label="Identified storage devices" value={totals.total} />
        <Metric label="Verified" value={totals.verified} tone="ok" />
        <Metric label="Failed" value={totals.failed} tone={totals.failed ? "warn" : "default"} />
        <Metric
          label="Pending or unrecorded"
          value={totals.none}
          tone={totals.none ? "warn" : "ok"}
          sub="Blocks certificate specimens"
        />
      </Panel>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title="Storage register"
            description="Every data-bearing device identified at intake."
            actions={
              <div className="flex gap-1">
                {(["open", "all"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-sm px-2.5 py-1 text-xs font-medium ${
                      filter === f
                        ? "bg-ink text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {f === "open" ? "Unresolved" : "All"}
                  </button>
                ))}
              </div>
            }
          />
          {rows.length === 0 ? (
            <EmptyState
              title="No unresolved storage devices"
              body="Every identified drive has a verified destruction record."
            />
          ) : (
            <TableScroll>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>Drive serial</Th>
                    <Th>Type</Th>
                    <Th>Item</Th>
                    <Th>Method</Th>
                    <Th>Operator</Th>
                    <Th>Date</Th>
                    <Th>Witness</Th>
                    <Th>Result</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ device, storage }) => (
                    <tr key={storage.id} className="hover:bg-muted/60">
                      <Td className="font-mono text-[0.75rem]">{storage.serial}</Td>
                      <Td>{storage.type}</Td>
                      <Td>
                        <Link
                          to="/devices/$deviceId"
                          params={{ deviceId: device.id }}
                          className="font-mono text-[0.75rem] text-forest hover:underline"
                        >
                          {device.serial}
                        </Link>
                      </Td>
                      <Td>{storage.record ? METHOD_LABEL[storage.record.method] : "—"}</Td>
                      <Td>{storage.record?.operator ?? "—"}</Td>
                      <Td>{storage.record ? shortDate(storage.record.performedAt) : "—"}</Td>
                      <Td>{storage.record?.witness ?? "—"}</Td>
                      <Td>
                        {!storage.record ? (
                          <Status tone="warn">No record</Status>
                        ) : storage.record.result === "verified" ? (
                          <Status tone="ok">Verified</Status>
                        ) : storage.record.result === "failed" ? (
                          <Status tone="danger">Failed</Status>
                        ) : (
                          <Status tone="warn">Pending</Status>
                        )}
                      </Td>
                      <Td>
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => {
                            setTarget({ deviceId: device.id, storageId: storage.id });
                            setErrors({});
                          }}
                        >
                          Record
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </Panel>

        <Panel className="h-fit">
          <PanelHeader
            title={
              targetStorage
                ? `Record for ${targetStorage.serial}`
                : "Record destruction evidence"
            }
            description={
              targetStorage
                ? `${targetDevice?.serial} · ${targetStorage.type} · ${targetStorage.capacityGb} GB`
                : "Select a drive from the register."
            }
          />
          {!targetStorage ? (
            <EmptyState
              title="No drive selected"
              body="Choose “Record” on a drive to capture the method, operator, date, result and evidence held."
            />
          ) : (
            <div className="space-y-4 px-5 py-5">
              <Field label="Method" htmlFor="a-method">
                <select
                  id="a-method"
                  className={selectCls}
                  value={form.method}
                  onChange={(e) =>
                    setForm({ ...form, method: e.target.value as SanitisationMethod })
                  }
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {METHOD_LABEL[m]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Operator" htmlFor="a-op" error={errors["operator"]}>
                <input
                  id="a-op"
                  className={inputCls}
                  value={form.operator}
                  onChange={(e) => setForm({ ...form, operator: e.target.value })}
                  placeholder="T. Moyo"
                />
              </Field>
              <Field label="Date performed" htmlFor="a-date">
                <input
                  id="a-date"
                  type="date"
                  className={inputCls}
                  value={form.performedAt}
                  onChange={(e) => setForm({ ...form, performedAt: e.target.value })}
                />
              </Field>
              <Field label="Result" htmlFor="a-res">
                <select
                  id="a-res"
                  className={selectCls}
                  value={form.result}
                  onChange={(e) =>
                    setForm({ ...form, result: e.target.value as SanitisationResult })
                  }
                >
                  <option value="verified">Verified</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                </select>
              </Field>
              <Field
                label="Standard reference"
                htmlFor="a-std"
                hint="Only record a standard if one was actually applied and supplied. Leave blank otherwise."
              >
                <input
                  id="a-std"
                  className={inputCls}
                  value={form.standardRef}
                  onChange={(e) => setForm({ ...form, standardRef: e.target.value })}
                  placeholder="Leave blank if not supplied"
                />
              </Field>
              <Field
                label="Evidence held"
                htmlFor="a-ev"
                error={errors["evidenceNote"]}
                hint="Log reference, photograph, tally sheet."
              >
                <input
                  id="a-ev"
                  className={inputCls}
                  value={form.evidenceNote}
                  onChange={(e) => setForm({ ...form, evidenceNote: e.target.value })}
                />
              </Field>
              <Field
                label="Witness"
                htmlFor="a-wit"
                error={errors["witness"]}
                hint="Required for physical destruction."
              >
                <input
                  id="a-wit"
                  className={inputCls}
                  value={form.witness}
                  onChange={(e) => setForm({ ...form, witness: e.target.value })}
                />
              </Field>
              <Note tone="muted">
                ReLoop records that this work was performed externally. It does not erase,
                overwrite or destroy anything itself.
              </Note>
              <div className="flex gap-2">
                <button type="button" className={btnPrimary} onClick={save}>
                  Save record
                </button>
                <button type="button" className={btnGhost} onClick={() => setTarget(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
