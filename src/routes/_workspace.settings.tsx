import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  Note,
  PageHeading,
  Panel,
  PanelHeader,
  Status,
} from "@/components/reloop/primitives";
import { btnGhost, btnPrimary } from "@/components/reloop/controls";
import { useReloop } from "@/lib/reloop/store";

export const Route = createFileRoute("/_workspace/settings")({
  head: () => ({
    meta: [
      { title: "Settings & help — ReLoop" },
      {
        name: "description",
        content:
          "Guided expo walkthrough, sample-data reset, and an honest statement of what this demonstration does and does not do.",
      },
      { property: "og:title", content: "Settings & help — ReLoop" },
      {
        property: "og:description",
        content: "Guided walkthrough, demo scope and sample-data reset.",
      },
    ],
  }),
  component: SettingsPage,
});

const WALKTHROUGH: { step: string; body: string; to?: string; label?: string }[] = [
  {
    step: "1. Register a 2.14 kg laptop",
    body: "Intake → step through identity and measured mass (2.14 kg), record the functional test, add the storage drive serial, attach an evidence photograph, then register. A scannable label is produced.",
    to: "/intake",
    label: "Open intake",
  },
  {
    step: "2. Open its passport",
    body: "The internal passport shows origin, storage media, hazard flags, custodian and — prominently — the last verified event and its age. The QR resolves to a minimal public passport with no institutional or personal identifiers.",
    to: "/devices",
    label: "Open devices",
  },
  {
    step: "3. Read the illustrative estimate",
    body: "Recovery shows a mass-based range from demonstration assumptions, with the full basis: fraction ranges, recovery efficiency, sample price date and table version. Unsupported categories say so.",
    to: "/recovery",
    label: "Open recovery",
  },
  {
    step: "4. Transfer custody — valid, then blocked",
    body: "Custody → send a non-hazardous item to Gwanda Metals Recovery (verified, current) and accept it. Then try Sable Route Logistics (expired authorisation) or send a hazard-flagged item to a collector — both are blocked with the reason stated.",
    to: "/custody",
    label: "Open custody",
  },
  {
    step: "5. Record data destruction evidence",
    body: "Data assurance → record method, operator, date, result and the evidence held for a drive. Physical destruction requires a named witness. A standard reference is only recorded if one was actually supplied.",
    to: "/assurance",
    label: "Open data assurance",
  },
  {
    step: "6. Produce a certificate specimen",
    body: "Reports → the specimen is blocked while any identified drive is unresolved or a physical destruction has no witness. Every specimen is stamped as a demonstration specimen.",
    to: "/reports",
    label: "Open reports",
  },
  {
    step: "7. Show a stale record",
    body: "Devices → filter by “stale record”. Batch BYO-2026-007 holds items whose last event is months old; the passport and public view both flag this rather than implying current tracking.",
    to: "/devices",
    label: "Open devices",
  },
];

function SettingsPage() {
  const { state, reset } = useReloop();

  return (
    <div>
      <PageHeading
        eyebrow="Workspace"
        title="Settings and help"
        lede="A guided route through the demonstration, plus a plain statement of what this build does and does not do."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel>
          <PanelHeader
            title="Guided expo walkthrough"
            description="Roughly six minutes end to end."
          />
          <ol className="divide-y divide-border">
            {WALKTHROUGH.map((w) => (
              <li key={w.step} className="px-5 py-4">
                <p className="text-[0.8125rem] font-semibold">{w.step}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{w.body}</p>
                {w.to ? (
                  <Link
                    to={w.to}
                    className="mt-2 inline-block text-xs font-semibold text-forest hover:underline"
                  >
                    {w.label} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Sample data" description="All demonstration data lives in this browser." />
            <div className="space-y-3 px-5 py-4 text-xs text-muted-foreground">
              <p>
                {state.devices.length} items across {state.batches.length} batches,{" "}
                {state.handlers.length} handler profiles and {state.transfers.length}{" "}
                transfers. Institutions and handlers are fictional; the demonstration date
                is fixed at {state.demoToday} so record ages stay consistent.
              </p>
              <Note tone="warn">
                Resetting discards every item you registered, every destruction record you
                captured and every transfer you made in this browser.
              </Note>
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  reset();
                  toast.success("Sample data reset to the seeded demonstration set.");
                }}
              >
                Reset sample data
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  const blob = JSON.stringify(state, null, 2);
                  const url = URL.createObjectURL(
                    new Blob([blob], { type: "application/json" }),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "reloop-demo-state.json";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Workspace state downloaded.");
                }}
              >
                Download workspace state (JSON)
              </button>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="What this build does not do" />
            <ul className="space-y-2 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
              <li>
                <Status tone="muted">No backend</Status> — there is no server, no account
                system and no cross-device sync. The demo role selector in the header is a
                display label, not authentication.
              </li>
              <li>
                <Status tone="muted">No secure audit trail</Status> — events are appended in
                order inside this browser. That is not a tamper-evident or immutable log and
                is not presented as one.
              </li>
              <li>
                <Status tone="muted">No data erasure</Status> — ReLoop records evidence of
                sanitisation or destruction performed externally by an operator. It never
                touches a drive.
              </li>
              <li>
                <Status tone="muted">No validated composition data</Status> — recovery
                figures are illustrative demonstration assumptions with stated ranges, not
                assays, quotations or published research.
              </li>
              <li>
                <Status tone="muted">No regulatory claims</Status> — no approval,
                certification, accreditation, endorsement or partnership with any authority
                is claimed, including in relation to the POTRAZ Innovation Expo.
              </li>
              <li>
                <Status tone="ok">Works offline</Status> — once the page has loaded, the
                core workflows run without a network connection.
              </li>
            </ul>
          </Panel>

          <Panel>
            <PanelHeader title="How the service is intended to work" />
            <div className="space-y-3 px-5 py-4 text-xs leading-relaxed text-muted-foreground">
              <p>
                ReLoop is positioned as a service fee charged to the institution for
                evidenced disposal — collection, item-level registration, data destruction
                evidence, custody routing and reporting — rather than a consumer rewards
                scheme. No pricing is quoted here because none has been set.
              </p>
              <p>
                The intended contribution is circular-economy: keeping functional equipment
                in reuse, routing the rest into controlled recovery, and giving institutions
                a digital trust record they can show. Collector-tier participation is
                deliberately included so small aggregators can take part in collection and
                transport within a verified network.
              </p>
              <p className="text-foreground">
                Prepared for the POTRAZ Innovation Expo, 29 September – 2 October 2026, ZIEC
                Bulawayo.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
