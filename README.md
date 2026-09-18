# ReLoop

**Every device. Accounted for.**

ReLoop is a chain-of-custody platform for institutional e-waste in Zimbabwe. It gives every retired device — a laptop, a server, a monitor — a digital identity the moment it's registered, and tracks that identity through data destruction, custody transfer, and final disposition, so an institution can actually prove what happened to equipment that used to just disappear.

Built by HJM Technologies for the 2026 POTRAZ Innovation Expo and Conference (29 September – 2 October, ZIEC Bulawayo).

**Live demo:** [reloopchain.lovable.app](https://reloopchain.lovable.app)

---

## The problem

Most institutional e-waste in Zimbabwe leaves the building with little more than a handwritten gate pass, if that. Hard drives go unlogged, so nobody can prove the data on them was destroyed. Hazardous components get mixed with general waste. Functional equipment gets crushed instead of reused. And at the end of it, no institution can show a board, an auditor, or a regulator what actually happened to a specific device.

ReLoop replaces that gap with an item-level, evidence-based record — not a bulk disposal log, a chain of custody for each device.

## What it does

- **Intake** — register a device with its measured mass, functional test result, storage-media serials, hazard flags, and photographic evidence. Generates a scannable QR label on the spot.
- **Passport** — every device has an internal record for staff and a minimal public passport, reached by scanning its QR code, that shows status and last verified event only — no institution name, no serials, no operator identity.
- **Custody transfer** — a device can only move to a verified handler with current authorisation and the correct hazard scope. Transfers to expired, unverified, or wrongly-scoped handlers are blocked automatically, with the reason shown.
- **Data assurance** — sanitisation and physical-destruction records capture method, operator, date, and result. Physical destruction requires a named witness. A certificate specimen won't generate until every storage device on an item is resolved.
- **Recovery estimates** — mass-based composition ranges with a stated recovery efficiency, price date, and assumptions-table version, clearly marked as illustrative. Precious-metal figures appear only in aggregated, authenticated views — never on an individual public passport.
- **Handler network** — verification tiers, licence scope, expiry, and incoming work for each registered handler.
- **Reports** — batch disposition summaries, CSV export, and a print-ready report.

## Honest limitations

This is a working expo demonstration, not a production system, and it doesn't pretend otherwise:

- All data lives in browser local storage. There is no backend, no authentication, and no cross-device sync.
- The event history is append-only within the demo session — it is not a tamper-evident or cryptographically secured audit log.
- Recovery estimates are illustrative planning assumptions, not laboratory assays or price quotations.
- Every certificate is watermarked **"DEMONSTRATION SPECIMEN — not evidence of actual destruction."**
- Sample institutions, handlers, and batches are explicitly fictional. No real licence, partnership, or regulatory endorsement is claimed or implied anywhere in the app.

## Try it

The guided walkthrough in the app covers the full flow: register a 2.14 kg laptop → view its passport → check its illustrative recovery estimate → attempt a valid transfer and a blocked one → record destruction evidence → generate a specimen certificate → export a report → see how a stale, unconfirmed record is surfaced honestly rather than hidden.

Seeded demo data (~24 devices across 3 batches, fictional Harare and Bulawayo institutions) can be reset at any time from Settings.

## Tech stack

React, TypeScript, Tailwind CSS, and shadcn/ui — built and deployed with [Lovable](https://lovable.dev).

## Development

Continue developing in the [Lovable editor](https://lovable.dev/projects/8f648bb4-94a2-4ab1-866e-c708a9fbf84e), or work locally:

```sh
git clone <repo-url>
cd reloopchain
npm install
npm run dev
```

Requires Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating) if you don't have them.

Changes made in the Lovable editor sync automatically to this repository, and pushes to `main` sync back into Lovable.

---

*Submitted to the 2026 POTRAZ Innovation Expo and Conference — Tertiary Level, E-Waste Management sector.*
