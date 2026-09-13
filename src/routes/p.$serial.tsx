import { Link, createFileRoute } from "@tanstack/react-router";

import { LogoLockup } from "@/components/reloop/logo";
import { Note, Panel, Status } from "@/components/reloop/primitives";
import {
  DISPOSITION_LABEL,
  ageLabel,
  isStale,
  kg,
  lastEvent,
  shortDate,
} from "@/lib/reloop/format";
import { useReloop } from "@/lib/reloop/store";

export const Route = createFileRoute("/p/$serial")({
  head: () => ({
    meta: [
      { title: "Public device passport — ReLoop" },
      {
        name: "description",
        content:
          "Minimal public disposal passport for a single item: category, mass, current status and last verified event.",
      },
      { property: "og:title", content: "Public device passport — ReLoop" },
      {
        property: "og:description",
        content: "A minimal public record of an item's disposal status and last verified event.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PublicPassport,
});

function PublicPassport() {
  const { serial } = Route.useParams();
  const { state, hydrated } = useReloop();
  const device = state.devices.find(
    (d) => d.serial.toLowerCase() === serial.toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-4">
          <LogoLockup width={170} />
          <span className="rounded-sm border border-warn/35 bg-warn/8 px-2 py-0.5 text-[0.6875rem] font-medium text-warn">
            Expo demo · sample data
          </span>
        </div>

        {!hydrated ? (
          <Panel className="px-5 py-8 text-center text-sm text-muted-foreground">
            Loading passport…
          </Panel>
        ) : !device ? (
          <Panel className="px-5 py-8">
            <h1 className="text-lg font-semibold">No passport found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No item with the reference <span className="font-mono">{serial}</span> exists
              in this demonstration workspace. Sample data may have been reset in this
              browser.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block text-xs font-semibold text-forest hover:underline"
            >
              Back to the workspace
            </Link>
          </Panel>
        ) : (
          <>
            <Panel>
              <div className="border-b border-border px-5 py-4">
                <p className="label-caps">Public disposal passport</p>
                <h1 className="mt-1.5 font-mono text-xl font-semibold">{device.serial}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {device.category} · {kg(device.massKg)} measured at intake
                </p>
              </div>
              <dl className="text-sm">
                {[
                  ["Current status", DISPOSITION_LABEL[device.disposition]],
                  [
                    "Functional test at intake",
                    device.functionalTest === "untested"
                      ? "Not yet tested"
                      : device.functionalTest === "pass"
                        ? "Passed"
                        : "Failed",
                  ],
                  [
                    "Data-bearing media identified",
                    device.storage.length > 0 ? "Yes" : "None identified",
                  ],
                  [
                    "Data destruction evidence",
                    device.storage.length === 0
                      ? "Not applicable"
                      : device.storage.every((s) => s.record?.result === "verified")
                        ? "Recorded and verified"
                        : "Not yet resolved",
                  ],
                  [
                    "Hazardous material present",
                    device.hazardFlags.length > 0 ? "Yes — restricted routing" : "None recorded",
                  ],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-6 border-b border-border/70 px-5 py-2.5 last:border-b-0"
                  >
                    <dt className="label-caps">{k}</dt>
                    <dd className="text-right text-[0.8125rem] font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel
              className={`mt-4 px-5 py-4 ${isStale(device) ? "border-warn/45 bg-warn/8" : ""}`}
            >
              <p className="label-caps">Last verified event</p>
              <p className="mt-1 text-lg font-semibold">
                {lastEvent(device) ? shortDate(lastEvent(device)!.at) : "—"}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({lastEvent(device) ? ageLabel(lastEvent(device)!.at) : "—"})
                </span>
              </p>
              <div className="mt-2">
                {isStale(device) ? (
                  <Status tone="warn">
                    Stale — this record has not been updated in over 30 days
                  </Status>
                ) : (
                  <Status tone="ok">Record current</Status>
                )}
              </div>
            </Panel>

            <div className="mt-4 space-y-3">
              <Note tone="muted">
                This public view deliberately omits the originating institution, asset tags,
                storage-media serials, operator names and any material-value figure.
              </Note>
              <Note tone="warn">
                Demonstration specimen — sample data. This passport is not evidence of actual
                disposal and asserts no regulatory approval or certification.
              </Note>
            </div>

            <Link
              to="/"
              className="mt-6 inline-block text-xs font-semibold text-forest hover:underline"
            >
              About ReLoop →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
