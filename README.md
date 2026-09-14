# ReLoop Chain

Build ReLoop by HJM Technologies: a premium, substantial Zimbabwean institutional e-waste recovery and chain-of-custody platform for a POTRAZ 2026 Innovation Expo demonstration. Build the working app now, not a plan or generic landing page. User supplied logo is attached: preserve its artwork, render it crisply with CSS container clipping/object positioning to handle huge white margins without stretching. Brand deep ink #142D32, forest #086653, restrained fresh green, warm off-white #F6F7F3, fine borders. Bespoke enterprise product feel: excellent typography, tight operational tables, spacious composition, subtle status colours, restrained radii, almost no gradients or gratuitous icons. Avoid AI-template hero sections, excessive cards, emoji, fake testimonials. Desktop sidebar, slim workspace header, responsive mobile navigation. First screen a beautifully art-directed real operations overview with a strong headline "Every device. Accounted for.", compact overview metrics, broad batch table, attention queue and a restrained material-flow visualization. Consistent rich screens.

Source proposal interpreted as product requirements:
Core is institutional disposal evidence, NOT consumer recycling rewards. Each item has serial ID, category, measured kg, functional test outcome, origin institution/batch/asset tag, storage-media serials/types, hazard flags, evidence photos, current custodian, events. Batch metrics derive from items.
Implement routes/screens: Overview; Batches (create, details, search/filter, import asset register CSV, reconciliation matched/unmatched/missing); Devices (search/filter and detailed passport); Intake (polished multi-step validated form, photos evidence only, mass >0, storage rows, condition from functional test; save and generate actual scannable QR/print label); Recovery (composition ranges and price/recovery efficiency assumptions, version/date, hazard overview); Custody (initiate and accept transfer, item-linked event timelines); Data assurance (storage-device sanitisation or physical destruction records: serial, method, operator, date, result, standard reference if actually supplied, evidence and physical-destruction witness); Handler network (profiles, verification tiers, licence scope/expiry, incoming work); Reports (batch disposition, CSV download, print-ready report and certificate specimen); Settings/help with guided demo and reset sample data.
QR must resolve a minimal public passport route with no institutional private identifiers, storage serials, personal operator data, or device-level precious-metal figures. Internal passport detailed with status AND prominent last verified event date/age. Unconfirmed disposition always awaiting disposition; stale events obvious. No pretend tracking beyond verified network.
Custody may go only to verified parties with current authorisation and appropriate hazard scope. Block expired and unverified handlers and explain why. Collector tiers may not process or receive hazardous items. Accepted events append-only within demo; never imply client-side demo history is secure immutable audit. Demo role switch labelled clearly, not fake authentication.
Data destruction records record work performed externally; app does not erase drives. Block certificate specimen generation if any identified storage device unresolved or verification failed, require witness for physical destruction. All certificates visibly "DEMONSTRATION SPECIMEN — not evidence of actual destruction". Avoid asserting regulatory approval, certification, partnerships or legal compliance.
Recovery estimates: proposal contains framework only, no validated composition data. Do not invent scholarly sources or current prices. Provide clearly marked illustrative demo assumptions with low/high fractions, efficiency, sample price date, table version, mass-based calculation. "Illustrative estimate — not an assay or quotation"; detailed basis drawer. Unsupported categories show reference unavailable. Precious-metal estimation only batch-level authenticated-style demo view, never individual public passports. Separate measured intake mass, confirmed controlled-recovery mass, actual recorded recovered fractions and estimated mass. Show confirmed dispositions / total transparently; no fabricated CO2 equivalences.
Use coherent seeded fictional institutional batches in Harare/Bulawayo with about 24 devices across 3 batches, clearly scoped "Expo demo · sample data" in workspace header and export watermarks. Include functioning, failed, awaiting, confirmed and stale examples, an expired handler and hazardous routing rejection demonstration. Sample institutions and handlers explicitly fictional, not real agencies/partners. No real licence assertions. Accurate rollups and internally consistent dates. Demo data persists in local storage with reset, core workflows functional offline after page load; state honestly that cross-device auth/backend is not enabled if not built. Prefer a reliable complete demo over pretend production security.
Include a concise guided expo walkthrough showing register 2.14kg laptop -> passport -> illustrative estimate -> valid/blocked transfer -> destruction evidence -> specimen -> report -> stale record. Accessible keyboard interactions, labelled controls, focus rings, table horizontal scroll mobile, empty/error states, no dead buttons. Search actually works. Export actually downloads. Help briefly describes institutional service-fee model without invented pricing and alignment to circular economy, digital trust and inclusive collector participation; no claim selected/endorsed by POTRAZ. Event context from supplied brief: 29 September–2 October 2026, ZIEC Bulawayo; use sparingly.
Please implement fully, check build/type correctness and exercise main flows. The premium feel is a priority alongside honest functionality.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://reloopchain.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8f648bb4-94a2-4ab1-866e-c708a9fbf84e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
