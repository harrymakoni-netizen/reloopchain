import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { LogoLockup } from "@/components/reloop/logo";
import {
  Field,
  Note,
  PageHeading,
  Panel,
  PanelHeader,
  Status,
} from "@/components/reloop/primitives";
import { QrCode } from "@/components/reloop/qr";
import { btnGhost, btnPrimary, inputCls, selectCls } from "@/components/reloop/controls";
import { HAZARD_LABEL, kg } from "@/lib/reloop/format";
import { FACILITY_ID, useReloop, uid } from "@/lib/reloop/store";
import type {
  DeviceCategory,
  FunctionalTest,
  HazardFlag,
  StorageType,
} from "@/lib/reloop/types";

export const Route = createFileRoute("/_workspace/intake")({
  head: () => ({
    meta: [
      { title: "Intake — ReLoop" },
      {
        name: "description",
        content:
          "Register an item at intake: measured mass, functional test, storage media, hazard flags and evidence, then print a scannable label.",
      },
      { property: "og:title", content: "Intake — ReLoop" },
      {
        property: "og:description",
        content: "Multi-step institutional intake registration with a scannable passport label.",
      },
    ],
  }),
  component: IntakePage,
});

const CATEGORIES: DeviceCategory[] = [
  "Laptop",
  "Desktop",
  "Server",
  "LCD monitor",
  "CRT monitor",
  "Printer",
  "Network switch",
  "UPS battery unit",
  "Mobile handset",
];

const STORAGE_TYPES: StorageType[] = ["HDD", "SSD", "NVMe", "eMMC", "Flash card"];
const HAZARDS = Object.keys(HAZARD_LABEL) as HazardFlag[];
const PHOTO_SLOTS = [
  "Asset label / serial plate",
  "Whole-unit condition",
  "Storage device bay",
  "Hazard or damage detail",
];

interface StorageRow {
  key: string;
  serial: string;
  type: StorageType;
  capacityGb: string;
}

function IntakePage() {
  const { state, addDevice } = useReloop();
  const [step, setStep] = useState(1);
  const [savedSerial, setSavedSerial] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [batchId, setBatchId] = useState(state.batches[0]?.id ?? "");
  const [serial, setSerial] = useState("");
  const [category, setCategory] = useState<DeviceCategory>("Laptop");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [mass, setMass] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [test, setTest] = useState<FunctionalTest>("untested");
  const [condition, setCondition] = useState("");
  const [storage, setStorage] = useState<StorageRow[]>([]);
  const [hazards, setHazards] = useState<HazardFlag[]>([]);
  const [photos, setPhotos] = useState<string[]>([PHOTO_SLOTS[0]!, PHOTO_SLOTS[1]!]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const massValue = Number.parseFloat(mass);

  function validateStep(target: number) {
    const e: Record<string, string> = {};
    if (target > 1) {
      if (!batchId) e["batchId"] = "Select the batch this item arrived in.";
      if (!serial.trim()) e["serial"] = "A unique item serial is required.";
      else if (
        state.devices.some(
          (d) => d.serial.toLowerCase() === serial.trim().toLowerCase(),
        )
      )
        e["serial"] = "That serial is already registered.";
      if (!make.trim()) e["make"] = "Manufacturer is required.";
      if (!Number.isFinite(massValue) || massValue <= 0)
        e["mass"] = "Measured mass must be greater than zero.";
      else if (massValue > 500) e["mass"] = "Mass looks implausible — check the scale reading.";
    }
    if (target > 2) {
      storage.forEach((row) => {
        if (!row.serial.trim()) e[`sto-${row.key}`] = "Storage serial is required.";
      });
      if (test === "untested") e["test"] = "Record the functional test outcome before continuing.";
    }
    if (target > 3) {
      if (photos.length === 0) e["photos"] = "At least one evidence photo entry is required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function go(target: number) {
    if (target > step && !validateStep(target)) {
      toast.error("Fix the highlighted fields before continuing.");
      return;
    }
    setStep(target);
  }

  function save() {
    if (!validateStep(4)) {
      toast.error("Fix the highlighted fields before saving.");
      return;
    }
    const id = uid("dev");
    const now = state.demoToday;
    addDevice({
      id,
      serial: serial.trim().toUpperCase(),
      category,
      make: make.trim(),
      model: model.trim() || "Unspecified",
      massKg: Number(massValue.toFixed(2)),
      functionalTest: test,
      conditionNote:
        condition.trim() ||
        (test === "pass" ? "Functional at intake." : "Non-functional at intake."),
      batchId,
      assetTag: assetTag.trim() ? assetTag.trim().toUpperCase() : null,
      storage: storage.map((row) => ({
        id: uid("sto"),
        serial: row.serial.trim().toUpperCase(),
        type: row.type,
        capacityGb: Number.parseInt(row.capacityGb || "0", 10) || 0,
        record: null,
      })),
      hazardFlags: hazards,
      photos: photos.map((label) => ({ id: uid("pho"), label, capturedAt: now })),
      custodianId: FACILITY_ID,
      disposition: "awaiting",
      recoveredFractions: [],
      events: [
        {
          id: uid("evt"),
          at: now,
          type: "intake-registered",
          actor: "Demo operator · Intake",
          note: `Registered at intake with measured mass ${massValue.toFixed(2)} kg.`,
        },
        {
          id: uid("evt"),
          at: now,
          type: "functional-test",
          actor: "Demo operator · Intake",
          note: test === "pass" ? "Functional test passed." : "Functional test failed.",
        },
      ],
    });
    setSavedSerial(serial.trim().toUpperCase());
    setSavedId(id);
    toast.success("Item registered. Label ready to print.");
  }

  function resetForm() {
    setSavedSerial(null);
    setSavedId(null);
    setStep(1);
    setSerial("");
    setMake("");
    setModel("");
    setMass("");
    setAssetTag("");
    setTest("untested");
    setCondition("");
    setStorage([]);
    setHazards([]);
    setPhotos([PHOTO_SLOTS[0]!, PHOTO_SLOTS[1]!]);
    setErrors({});
  }

  const passportUrl =
    typeof window === "undefined"
      ? `/p/${savedSerial}`
      : `${window.location.origin}/p/${savedSerial}`;

  if (savedSerial && savedId) {
    return (
      <div>
        <PageHeading
          eyebrow="Intake"
          title="Item registered"
          lede="The item now has a passport, an event history and a scannable label. Nothing about its disposition is assumed — it is recorded as awaiting disposition."
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel>
            <PanelHeader title="Passport label" description="Print and affix to the item." />
            <div className="px-5 py-5">
              <div className="flex w-full max-w-md gap-4 border border-border p-4">
                <QrCode value={passportUrl} size={132} />
                <div className="min-w-0">
                  <LogoLockup width={150} />
                  <p className="mt-2 font-mono text-sm font-semibold">{savedSerial}</p>
                  <p className="text-xs text-muted-foreground">
                    {category} · {kg(Number(massValue.toFixed(2)))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Batch {state.batches.find((b) => b.id === batchId)?.ref}
                  </p>
                  <p className="mt-2 text-[0.625rem] leading-snug text-muted-foreground">
                    Scan for the public passport. Demonstration specimen — sample data.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/devices/$deviceId"
                  params={{ deviceId: savedId }}
                  className={btnPrimary}
                >
                  Open internal passport
                </Link>
                <Link to="/p/$serial" params={{ serial: savedSerial }} className={btnGhost}>
                  View public passport
                </Link>
                <button type="button" className={btnGhost} onClick={resetForm}>
                  Register another item
                </button>
              </div>
            </div>
          </Panel>
          <Panel>
            <PanelHeader title="What happens next" />
            <ol className="space-y-3 px-5 py-5 text-sm text-muted-foreground">
              <li>
                1. Record data destruction evidence for any identified storage media under
                Data assurance.
              </li>
              <li>
                2. Transfer custody to a verified handler with current authorisation and
                appropriate hazard scope.
              </li>
              <li>
                3. The receiving party accepts custody; the item stays “awaiting
                disposition” until a disposition is confirmed.
              </li>
            </ol>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        eyebrow="Intake"
        title="Register an item"
        lede="Four steps: identity and measured mass, storage and hazards, evidence, then review. Each item is registered individually — batch figures are derived, never typed."
      />

      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Intake steps">
        {["Identity & mass", "Storage & hazards", "Evidence", "Review"].map((label, i) => {
          const n = i + 1;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => go(n)}
                aria-current={step === n ? "step" : undefined}
                className={`rounded-sm border px-3 py-1.5 text-xs font-medium transition-colors ${
                  step === n
                    ? "border-ink bg-ink text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:bg-secondary"
                }`}
              >
                {n}. {label}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel>
          {step === 1 ? (
            <>
              <PanelHeader title="Identity and measured mass" />
              <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                <Field label="Batch" htmlFor="i-batch" error={errors["batchId"]}>
                  <select
                    id="i-batch"
                    className={selectCls}
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                  >
                    {state.batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.ref} —{" "}
                        {state.institutions.find((i) => i.id === b.institutionId)?.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Item serial"
                  htmlFor="i-serial"
                  hint="Manufacturer serial or facility-assigned identifier."
                  error={errors["serial"]}
                >
                  <input
                    id="i-serial"
                    className={inputCls}
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    placeholder="RLP-HRE18-008"
                  />
                </Field>
                <Field label="Category" htmlFor="i-cat">
                  <select
                    id="i-cat"
                    className={selectCls}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Manufacturer" htmlFor="i-make" error={errors["make"]}>
                  <input
                    id="i-make"
                    className={inputCls}
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Lenovo"
                  />
                </Field>
                <Field label="Model" htmlFor="i-model">
                  <input
                    id="i-model"
                    className={inputCls}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="ThinkPad T470"
                  />
                </Field>
                <Field
                  label="Measured mass (kg)"
                  htmlFor="i-mass"
                  hint="Weighed at intake. Must be greater than zero."
                  error={errors["mass"]}
                >
                  <input
                    id="i-mass"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    className={inputCls}
                    value={mass}
                    onChange={(e) => setMass(e.target.value)}
                    placeholder="2.14"
                  />
                </Field>
                <Field
                  label="Institutional asset tag"
                  htmlFor="i-tag"
                  hint="Leave blank if the item is not on the supplied register."
                >
                  <input
                    id="i-tag"
                    className={inputCls}
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    placeholder="KWB-5504"
                  />
                </Field>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <PanelHeader
                title="Storage media, condition and hazards"
                description="Condition is derived from the functional test outcome you record here."
              />
              <div className="space-y-5 px-5 py-5">
                <Field label="Functional test outcome" error={errors["test"]}>
                  <div className="flex flex-wrap gap-2">
                    {(["pass", "fail"] as FunctionalTest[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTest(t)}
                        aria-pressed={test === t}
                        className={`rounded-sm border px-3 py-1.5 text-xs font-medium ${
                          test === t
                            ? "border-forest bg-forest text-primary-foreground"
                            : "border-border bg-surface hover:bg-secondary"
                        }`}
                      >
                        {t === "pass" ? "Passed — functional" : "Failed — non-functional"}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Condition note" htmlFor="i-cond" hint="Observed damage, battery state, missing parts.">
                  <input
                    id="i-cond"
                    className={inputCls}
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="Battery health 71%, lid scuffed"
                  />
                </Field>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold">Storage media</p>
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() =>
                        setStorage((rows) => [
                          ...rows,
                          {
                            key: uid("row"),
                            serial: "",
                            type: "SSD",
                            capacityGb: "256",
                          },
                        ])
                      }
                    >
                      Add storage device
                    </button>
                  </div>
                  {storage.length === 0 ? (
                    <Note tone="muted">
                      No data-bearing device identified. If a drive is found later, add it
                      from Data assurance — the item cannot appear on a certificate
                      specimen while storage is unresolved.
                    </Note>
                  ) : (
                    <ul className="space-y-3">
                      {storage.map((row, index) => (
                        <li
                          key={row.key}
                          className="grid gap-3 rounded-sm border border-border p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
                        >
                          <Field
                            label={`Serial ${index + 1}`}
                            htmlFor={`sto-serial-${row.key}`}
                            error={errors[`sto-${row.key}`]}
                          >
                            <input
                              id={`sto-serial-${row.key}`}
                              className={inputCls}
                              value={row.serial}
                              onChange={(e) =>
                                setStorage((rows) =>
                                  rows.map((r) =>
                                    r.key === row.key ? { ...r, serial: e.target.value } : r,
                                  ),
                                )
                              }
                            />
                          </Field>
                          <Field label="Type" htmlFor={`sto-type-${row.key}`}>
                            <select
                              id={`sto-type-${row.key}`}
                              className={selectCls}
                              value={row.type}
                              onChange={(e) =>
                                setStorage((rows) =>
                                  rows.map((r) =>
                                    r.key === row.key
                                      ? { ...r, type: e.target.value as StorageType }
                                      : r,
                                  ),
                                )
                              }
                            >
                              {STORAGE_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field label="Capacity (GB)" htmlFor={`sto-cap-${row.key}`}>
                            <input
                              id={`sto-cap-${row.key}`}
                              type="number"
                              min="0"
                              className={inputCls}
                              value={row.capacityGb}
                              onChange={(e) =>
                                setStorage((rows) =>
                                  rows.map((r) =>
                                    r.key === row.key
                                      ? { ...r, capacityGb: e.target.value }
                                      : r,
                                  ),
                                )
                              }
                            />
                          </Field>
                          <div className="flex items-end">
                            <button
                              type="button"
                              className={btnGhost}
                              onClick={() =>
                                setStorage((rows) => rows.filter((r) => r.key !== row.key))
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Field label="Hazard flags">
                  <div className="flex flex-wrap gap-2">
                    {HAZARDS.map((h) => {
                      const on = hazards.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setHazards((prev) =>
                              on ? prev.filter((x) => x !== h) : [...prev, h],
                            )
                          }
                          className={`rounded-sm border px-3 py-1.5 text-xs font-medium ${
                            on
                              ? "border-warn bg-warn/12 text-warn"
                              : "border-border bg-surface hover:bg-secondary"
                          }`}
                        >
                          {HAZARD_LABEL[h]}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <PanelHeader
                title="Evidence"
                description="Photographs are recorded as evidence entries only; no image file is stored in this demonstration."
              />
              <div className="space-y-4 px-5 py-5">
                <Field label="Evidence captured" error={errors["photos"]}>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {PHOTO_SLOTS.map((slot) => {
                      const on = photos.includes(slot);
                      return (
                        <li key={slot}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-sm border border-border px-3 py-2.5 text-xs hover:bg-secondary">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() =>
                                setPhotos((prev) =>
                                  on ? prev.filter((p) => p !== slot) : [...prev, slot],
                                )
                              }
                            />
                            {slot}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </Field>
                <Note tone="muted">
                  Evidence entries support the disposal record. They are not proof of data
                  destruction — that is recorded separately under Data assurance.
                </Note>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <PanelHeader title="Review and register" />
              <dl className="px-5 py-5 text-sm">
                {[
                  ["Batch", state.batches.find((b) => b.id === batchId)?.ref ?? "—"],
                  ["Serial", serial.trim().toUpperCase()],
                  ["Category", category],
                  ["Make / model", `${make} ${model}`.trim()],
                  [
                    "Measured mass",
                    Number.isFinite(massValue) ? kg(massValue) : "—",
                  ],
                  ["Asset tag", assetTag.trim().toUpperCase() || "Not on register"],
                  ["Functional test", test],
                  [
                    "Storage media",
                    storage.length === 0
                      ? "None identified"
                      : storage.map((s) => `${s.serial} (${s.type})`).join(", "),
                  ],
                  [
                    "Hazard flags",
                    hazards.length === 0
                      ? "None"
                      : hazards.map((h) => HAZARD_LABEL[h]).join(", "),
                  ],
                  ["Evidence", photos.join(", ") || "None"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-6 border-b border-border/70 py-2 last:border-b-0"
                  >
                    <dt className="label-caps">{k}</dt>
                    <dd className="text-right text-[0.8125rem] font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
                <button type="button" className={btnPrimary} onClick={save}>
                  Register item and generate label
                </button>
                <Status tone="warn">Disposition will be recorded as awaiting</Status>
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <button
              type="button"
              className={btnGhost}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </button>
            <button
              type="button"
              className={btnGhost}
              onClick={() => go(Math.min(4, step + 1))}
              disabled={step === 4}
            >
              Continue
            </button>
          </div>
        </Panel>

        <Panel className="h-fit">
          <PanelHeader title="Why this is recorded" />
          <div className="space-y-3 px-5 py-5 text-xs leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">Measured mass</strong> is the only mass
              figure ReLoop treats as fact. Recovery figures elsewhere are clearly marked as
              illustrative.
            </p>
            <p>
              <strong className="text-foreground">Storage serials</strong> are held so that
              a destruction record can be tied to a specific drive, not just to a device.
            </p>
            <p>
              <strong className="text-foreground">Hazard flags</strong> restrict which
              parties may receive custody. Collector-tier parties may not receive hazardous
              items.
            </p>
            <p>
              <strong className="text-foreground">Nothing is assumed.</strong> Until a
              receiving party confirms it, every item reads “awaiting disposition”.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
