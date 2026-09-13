import type {
  Batch,
  Device,
  DeviceCategory,
  DeviceEvent,
  Disposition,
  FunctionalTest,
  HazardFlag,
  Handler,
  Institution,
  ReloopState,
  SanitisationRecord,
  StorageDevice,
  StorageType,
} from "./types";

export const DEMO_TODAY = "2026-09-13";
export const STATE_VERSION = 3;

export const FACILITY_ID = "hnd-reloop-central";

const institutions: Institution[] = [
  {
    id: "ins-chiremba",
    name: "Chiremba Polytechnic (fictional)",
    city: "Harare",
    sector: "Tertiary education",
  },
  {
    id: "ins-matopos",
    name: "Matopos Mutual Assurance (fictional)",
    city: "Bulawayo",
    sector: "Financial services",
  },
  {
    id: "ins-kariba",
    name: "Kariba Water Utility Board (fictional)",
    city: "Harare",
    sector: "Municipal utility",
  },
];

const handlers: Handler[] = [
  {
    id: FACILITY_ID,
    name: "ReLoop Central Facility (fictional)",
    tier: "processor",
    city: "Harare",
    verified: true,
    authorisationRef: "DEMO-AUTH-0001",
    authorisationExpiry: "2027-03-31",
    scope: ["IT equipment", "Display devices", "Batteries"],
    hazardScope: true,
    contact: "operations@reloop.example",
  },
  {
    id: "hnd-gwanda",
    name: "Gwanda Metals Recovery (fictional)",
    tier: "refiner",
    city: "Gwanda",
    verified: true,
    authorisationRef: "DEMO-AUTH-0042",
    authorisationExpiry: "2027-01-15",
    scope: ["Printed circuit assemblies", "Ferrous and non-ferrous metals"],
    hazardScope: true,
    contact: "intake@gwandametals.example",
  },
  {
    id: "hnd-zvimba",
    name: "Zvimba Collectors Co-operative (fictional)",
    tier: "collector",
    city: "Chinhoyi",
    verified: true,
    authorisationRef: "DEMO-AUTH-0117",
    authorisationExpiry: "2026-12-31",
    scope: ["Collection and aggregation only"],
    hazardScope: false,
    contact: "coop@zvimba.example",
  },
  {
    id: "hnd-sable",
    name: "Sable Route Logistics (fictional)",
    tier: "collector",
    city: "Bulawayo",
    verified: true,
    authorisationRef: "DEMO-AUTH-0088",
    authorisationExpiry: "2026-06-30",
    scope: ["Transport and aggregation"],
    hazardScope: false,
    contact: "dispatch@sableroute.example",
  },
  {
    id: "hnd-hwange",
    name: "Hwange Asset Handlers (fictional)",
    tier: "processor",
    city: "Hwange",
    verified: false,
    authorisationRef: "— not supplied —",
    authorisationExpiry: "2026-11-30",
    scope: ["Applicant — verification incomplete"],
    hazardScope: false,
    contact: "info@hwangeassets.example",
  },
];

const batches: Batch[] = [
  {
    id: "bat-hre-014",
    ref: "HRE-2026-014",
    institutionId: "ins-chiremba",
    openedAt: "2026-08-26",
    collectedAt: "2026-08-28",
    location: "Harare · Belvedere campus store",
    custodianId: FACILITY_ID,
    note: "Computer lab refresh. Asset register supplied by ICT directorate.",
    assetRegister: [
      { assetTag: "CPT-1041", description: "Laptop, teaching staff" },
      { assetTag: "CPT-1042", description: "Laptop, teaching staff" },
      { assetTag: "CPT-1043", description: "Laptop, teaching staff" },
      { assetTag: "CPT-2210", description: "Desktop, lab 2" },
      { assetTag: "CPT-2211", description: "Desktop, lab 2" },
      { assetTag: "CPT-2212", description: "Desktop, lab 2" },
      { assetTag: "CPT-3301", description: "LCD monitor, lab 2" },
      { assetTag: "CPT-3302", description: "LCD monitor, lab 2" },
      { assetTag: "CPT-3303", description: "LCD monitor, lab 2" },
      { assetTag: "CPT-4400", description: "Network switch, comms room" },
      { assetTag: "CPT-9001", description: "Laptop, bursary office" },
    ],
    closed: false,
  },
  {
    id: "bat-byo-007",
    ref: "BYO-2026-007",
    institutionId: "ins-matopos",
    openedAt: "2026-06-29",
    collectedAt: "2026-07-02",
    location: "Bulawayo · Fife Street branch",
    custodianId: FACILITY_ID,
    note: "Branch decommissioning. Two units still awaiting disposition confirmation.",
    assetRegister: [
      { assetTag: "MMA-0071", description: "Desktop, teller station" },
      { assetTag: "MMA-0072", description: "Desktop, teller station" },
      { assetTag: "MMA-0080", description: "Server, branch room" },
      { assetTag: "MMA-0091", description: "CRT monitor, archive" },
      { assetTag: "MMA-0092", description: "CRT monitor, archive" },
      { assetTag: "MMA-0100", description: "UPS battery unit" },
      { assetTag: "MMA-0110", description: "Printer, back office" },
      { assetTag: "MMA-0125", description: "Laptop, branch manager" },
    ],
    closed: false,
  },
  {
    id: "bat-hre-018",
    ref: "HRE-2026-018",
    institutionId: "ins-kariba",
    openedAt: "2026-09-08",
    collectedAt: "2026-09-09",
    location: "Harare · Msasa depot",
    custodianId: FACILITY_ID,
    note: "Field metering hardware refresh. Intake in progress.",
    assetRegister: [
      { assetTag: "KWB-5501", description: "Laptop, field engineering" },
      { assetTag: "KWB-5502", description: "Laptop, field engineering" },
      { assetTag: "KWB-5503", description: "Laptop, field engineering" },
      { assetTag: "KWB-6600", description: "Server, SCADA spare" },
      { assetTag: "KWB-7701", description: "Mobile handset, meter reader" },
      { assetTag: "KWB-7702", description: "Mobile handset, meter reader" },
      { assetTag: "KWB-8800", description: "Network switch, depot" },
    ],
    closed: false,
  },
];

let seq = 0;
function ev(
  at: string,
  type: DeviceEvent["type"],
  actor: string,
  note: string,
  extra: Partial<DeviceEvent> = {},
): DeviceEvent {
  seq += 1;
  return { id: `evt-seed-${seq}`, at, type, actor, note, ...extra };
}

interface Spec {
  serial: string;
  category: DeviceCategory;
  make: string;
  model: string;
  massKg: number;
  test: FunctionalTest;
  batchId: string;
  assetTag: string | null;
  hazards?: HazardFlag[];
  storage?: [StorageType, string, number, SanitisationRecord | null][];
  disposition: Disposition;
  condition: string;
  lastEventAt: string;
  recovered?: { material: string; massKg: number }[];
}

function san(
  id: string,
  method: SanitisationRecord["method"],
  operator: string,
  performedAt: string,
  result: SanitisationRecord["result"],
  standardRef: string | null,
  evidenceNote: string,
  witness: string | null = null,
): SanitisationRecord {
  return { id, method, operator, performedAt, result, standardRef, evidenceNote, witness };
}

const specs: Spec[] = [
  // ---- HRE-2026-014 · Chiremba Polytechnic
  {
    serial: "RLP-HRE14-001", category: "Laptop", make: "Lenovo", model: "ThinkPad T470",
    massKg: 1.63, test: "pass", batchId: "bat-hre-014", assetTag: "CPT-1041",
    storage: [["SSD", "S-WD-88213A", 256, san("san-1", "cryptographic-erase", "T. Moyo", "2026-08-29", "verified", null, "Controller crypto-erase; verification read sampled 64 LBA ranges.")]],
    disposition: "reuse-redeployed", condition: "Battery health 71%. Cosmetic wear on lid.",
    lastEventAt: "2026-09-02",
  },
  {
    serial: "RLP-HRE14-002", category: "Laptop", make: "Lenovo", model: "ThinkPad T470",
    massKg: 1.66, test: "fail", batchId: "bat-hre-014", assetTag: "CPT-1042",
    storage: [["SSD", "S-WD-88219C", 256, san("san-2", "physical-destruction", "T. Moyo", "2026-08-30", "verified", null, "Shredded to <6mm particle; fragments photographed in tray 4.", "P. Nyathi")]],
    disposition: "controlled-recovery", condition: "No power; board fault confirmed at bench.",
    lastEventAt: "2026-09-04",
    recovered: [
      { material: "Aluminium", massKg: 0.29 },
      { material: "Printed circuit assembly", massKg: 0.18 },
      { material: "Mixed plastics", massKg: 0.34 },
    ],
  },
  {
    serial: "RLP-HRE14-003", category: "Laptop", make: "HP", model: "ProBook 450 G5",
    massKg: 2.05, test: "pass", batchId: "bat-hre-014", assetTag: "CPT-1043",
    storage: [["HDD", "H-SG-4471KQ", 500, san("san-3", "overwrite-purge", "R. Chigumba", "2026-08-31", "verified", null, "Single-pass overwrite with full verification pass; log exported to PDF.")]],
    disposition: "reuse-redeployed", condition: "Fully functional. Keyboard replaced.",
    lastEventAt: "2026-09-02",
  },
  {
    serial: "RLP-HRE14-004", category: "Desktop", make: "Dell", model: "OptiPlex 3050",
    massKg: 6.4, test: "fail", batchId: "bat-hre-014", assetTag: "CPT-2210",
    storage: [["HDD", "H-SG-9910BB", 1000, san("san-4", "degauss", "R. Chigumba", "2026-09-01", "verified", null, "Degaussed; platter no longer addressable. Unit retained for metal recovery.")]],
    disposition: "controlled-recovery", condition: "PSU failure, chassis corrosion.",
    lastEventAt: "2026-09-05",
    recovered: [
      { material: "Steel", massKg: 3.1 },
      { material: "Copper", massKg: 0.31 },
      { material: "Printed circuit assembly", massKg: 0.42 },
    ],
  },
  {
    serial: "RLP-HRE14-005", category: "Desktop", make: "Dell", model: "OptiPlex 3050",
    massKg: 6.52, test: "fail", batchId: "bat-hre-014", assetTag: "CPT-2211",
    storage: [["HDD", "H-SG-9912BB", 1000, san("san-5", "overwrite-purge", "R. Chigumba", "2026-09-01", "failed", null, "Overwrite aborted at 62% — drive reported reallocated sector failures. Escalated for physical destruction.")]],
    disposition: "awaiting", condition: "Boots to firmware only.",
    lastEventAt: "2026-09-05",
  },
  {
    serial: "RLP-HRE14-006", category: "Desktop", make: "HP", model: "EliteDesk 800 G3",
    massKg: 7.1, test: "pass", batchId: "bat-hre-014", assetTag: "CPT-2212",
    storage: [["SSD", "S-SS-33102X", 512, san("san-6", "cryptographic-erase", "T. Moyo", "2026-08-31", "verified", null, "Crypto-erase confirmed; key rotation logged by controller.")]],
    disposition: "reuse-redeployed", condition: "Redeployed to campus library.",
    lastEventAt: "2026-09-03",
  },
  {
    serial: "RLP-HRE14-007", category: "LCD monitor", make: "Dell", model: "P2217H",
    massKg: 3.42, test: "pass", batchId: "bat-hre-014", assetTag: "CPT-3301",
    disposition: "reuse-redeployed", condition: "Minor backlight bleed.", lastEventAt: "2026-09-02",
  },
  {
    serial: "RLP-HRE14-008", category: "LCD monitor", make: "Dell", model: "P2217H",
    massKg: 3.39, test: "fail", batchId: "bat-hre-014", assetTag: "CPT-3302",
    disposition: "controlled-recovery", condition: "Panel cracked in transit.",
    lastEventAt: "2026-09-06",
    recovered: [
      { material: "Mixed plastics", massKg: 1.4 },
      { material: "Steel", massKg: 0.52 },
      { material: "Glass panel", massKg: 0.78 },
    ],
  },
  {
    serial: "RLP-HRE14-009", category: "LCD monitor", make: "Samsung", model: "S22E450",
    massKg: 3.11, test: "untested", batchId: "bat-hre-014", assetTag: "CPT-3303",
    disposition: "awaiting", condition: "Awaiting bench slot.", lastEventAt: "2026-08-28",
  },
  {
    serial: "RLP-HRE14-010", category: "Network switch", make: "Cisco", model: "Catalyst 2960",
    massKg: 4.28, test: "pass", batchId: "bat-hre-014", assetTag: "CPT-4400",
    disposition: "reuse-redeployed", condition: "Config wiped, returned to campus comms room.",
    lastEventAt: "2026-09-03",
  },
  {
    serial: "RLP-HRE14-011", category: "Laptop", make: "Acer", model: "TravelMate P259",
    massKg: 2.21, test: "fail", batchId: "bat-hre-014", assetTag: null,
    hazards: ["lithium-cell"],
    storage: [["HDD", "H-TS-5521RR", 500, null]],
    disposition: "awaiting", condition: "Swollen battery cell — isolated in vented store. Not on supplied register.",
    lastEventAt: "2026-09-07",
  },

  // ---- BYO-2026-007 · Matopos Mutual Assurance (older batch; stale records)
  {
    serial: "RLP-BYO07-001", category: "Desktop", make: "Lenovo", model: "ThinkCentre M710",
    massKg: 6.85, test: "fail", batchId: "bat-byo-007", assetTag: "MMA-0071",
    storage: [["SSD", "S-KN-71204D", 256, san("san-7", "physical-destruction", "S. Dube", "2026-07-08", "verified", null, "Disintegrated on site; witness signed tally sheet 12.", "L. Ncube")]],
    disposition: "controlled-recovery", condition: "Motherboard failure.",
    lastEventAt: "2026-07-15",
    recovered: [
      { material: "Steel", massKg: 3.4 },
      { material: "Copper", massKg: 0.35 },
      { material: "Printed circuit assembly", massKg: 0.4 },
    ],
  },
  {
    serial: "RLP-BYO07-002", category: "Desktop", make: "Lenovo", model: "ThinkCentre M710",
    massKg: 6.79, test: "fail", batchId: "bat-byo-007", assetTag: "MMA-0072",
    storage: [["SSD", "S-KN-71209D", 256, san("san-8", "physical-destruction", "S. Dube", "2026-07-08", "verified", null, "Disintegrated on site; witness signed tally sheet 12.", "L. Ncube")]],
    disposition: "awaiting", condition: "Stripped, awaiting disposition confirmation from processor.",
    lastEventAt: "2026-07-16",
  },
  {
    serial: "RLP-BYO07-003", category: "Server", make: "Dell", model: "PowerEdge R430",
    massKg: 18.6, test: "pass", batchId: "bat-byo-007", assetTag: "MMA-0080",
    storage: [
      ["HDD", "H-SG-BR1201", 1000, san("san-9", "overwrite-purge", "S. Dube", "2026-07-10", "verified", null, "Three drives purged in bay order; verification logs archived.")],
      ["HDD", "H-SG-BR1202", 1000, san("san-10", "overwrite-purge", "S. Dube", "2026-07-10", "verified", null, "Verification pass complete.")],
      ["HDD", "H-SG-BR1203", 1000, san("san-11", "overwrite-purge", "S. Dube", "2026-07-10", "pending", null, "Drive removed from chassis; purge not yet started.")],
    ],
    disposition: "awaiting", condition: "Functional. Held pending storage resolution.",
    lastEventAt: "2026-07-18",
  },
  {
    serial: "RLP-BYO07-004", category: "CRT monitor", make: "Philips", model: "107S",
    massKg: 14.2, test: "fail", batchId: "bat-byo-007", assetTag: "MMA-0091",
    hazards: ["lead-glass"],
    disposition: "controlled-recovery", condition: "Leaded funnel glass; routed to hazard-scoped handler.",
    lastEventAt: "2026-07-20",
    recovered: [
      { material: "Glass panel", massKg: 8.9 },
      { material: "Steel", massKg: 2.4 },
    ],
  },
  {
    serial: "RLP-BYO07-005", category: "CRT monitor", make: "Philips", model: "107S",
    massKg: 14.05, test: "fail", batchId: "bat-byo-007", assetTag: "MMA-0092",
    hazards: ["lead-glass"],
    disposition: "awaiting", condition: "Leaded glass. Held — no hazard-scoped capacity booked.",
    lastEventAt: "2026-07-04",
  },
  {
    serial: "RLP-BYO07-006", category: "UPS battery unit", make: "APC", model: "Smart-UPS 1500",
    massKg: 22.4, test: "fail", batchId: "bat-byo-007", assetTag: "MMA-0100",
    hazards: ["sealed-lead-acid"],
    disposition: "awaiting", condition: "Two sealed lead-acid strings, one leaking. Stored in bund tray.",
    lastEventAt: "2026-07-05",
  },
  {
    serial: "RLP-BYO07-007", category: "Printer", make: "HP", model: "LaserJet M402",
    massKg: 8.6, test: "pass", batchId: "bat-byo-007", assetTag: "MMA-0110",
    hazards: ["toner-residue"],
    disposition: "reuse-redeployed", condition: "Serviced and redeployed to head office.",
    lastEventAt: "2026-07-12",
  },
  {
    serial: "RLP-BYO07-008", category: "Laptop", make: "HP", model: "EliteBook 840 G5",
    massKg: 1.54, test: "pass", batchId: "bat-byo-007", assetTag: "MMA-0125",
    storage: [["NVMe", "N-SK-4410ZZ", 512, san("san-12", "cryptographic-erase", "S. Dube", "2026-07-09", "verified", null, "Crypto-erase; verification sampling logged.")]],
    disposition: "reuse-redeployed", condition: "Redeployed to branch supervisor.",
    lastEventAt: "2026-07-11",
  },
  {
    serial: "RLP-BYO07-009", category: "Laptop", make: "Dell", model: "Latitude 5490",
    massKg: 1.72, test: "untested", batchId: "bat-byo-007", assetTag: null,
    storage: [["SSD", "S-MC-99120F", 256, null]],
    disposition: "awaiting", condition: "Found in branch safe after register was issued. Unmatched.",
    lastEventAt: "2026-07-03",
  },

  // ---- HRE-2026-018 · Kariba Water Utility Board (recent)
  {
    serial: "RLP-HRE18-001", category: "Laptop", make: "Dell", model: "Latitude 5410",
    massKg: 1.83, test: "pass", batchId: "bat-hre-018", assetTag: "KWB-5501",
    storage: [["NVMe", "N-WD-7712QA", 512, san("san-13", "cryptographic-erase", "T. Moyo", "2026-09-10", "verified", null, "Crypto-erase confirmed at bench 2.")]],
    disposition: "awaiting", condition: "Functional; pending institutional reuse decision.",
    lastEventAt: "2026-09-10",
  },
  {
    serial: "RLP-HRE18-002", category: "Laptop", make: "Dell", model: "Latitude 5410",
    massKg: 1.79, test: "pass", batchId: "bat-hre-018", assetTag: "KWB-5502",
    storage: [["NVMe", "N-WD-7718QA", 512, null]],
    disposition: "awaiting", condition: "Functional; storage device not yet processed.",
    lastEventAt: "2026-09-10",
  },
  {
    serial: "RLP-HRE18-003", category: "Laptop", make: "Dell", model: "Latitude 5410",
    massKg: 1.88, test: "fail", batchId: "bat-hre-018", assetTag: "KWB-5503",
    hazards: ["lithium-cell"],
    storage: [["NVMe", "N-WD-7720QA", 512, san("san-14", "physical-destruction", "T. Moyo", "2026-09-11", "verified", null, "Punched and shredded; fragments in sealed bag 09-11-B.", "R. Chigumba")]],
    disposition: "awaiting", condition: "Liquid damage. Battery vented — hazard flagged.",
    lastEventAt: "2026-09-11",
  },
  {
    serial: "RLP-HRE18-004", category: "Server", make: "HPE", model: "ProLiant DL360 Gen9",
    massKg: 16.9, test: "pass", batchId: "bat-hre-018", assetTag: "KWB-6600",
    storage: [
      ["SSD", "S-HP-KB3301", 480, san("san-15", "overwrite-purge", "R. Chigumba", "2026-09-11", "verified", null, "Purge complete, verification log exported.")],
      ["SSD", "S-HP-KB3302", 480, san("san-16", "overwrite-purge", "R. Chigumba", "2026-09-11", "verified", null, "Purge complete, verification log exported.")],
    ],
    disposition: "awaiting", condition: "SCADA spare; institution reviewing retention.",
    lastEventAt: "2026-09-11",
  },
  {
    serial: "RLP-HRE18-005", category: "Mobile handset", make: "Samsung", model: "Galaxy A12",
    massKg: 0.21, test: "pass", batchId: "bat-hre-018", assetTag: "KWB-7701",
    hazards: ["lithium-cell"],
    storage: [["eMMC", "E-SM-A12-8841", 64, san("san-17", "cryptographic-erase", "T. Moyo", "2026-09-12", "verified", null, "Factory crypto-erase; FRP cleared and logged.")]],
    disposition: "awaiting", condition: "Screen intact, battery retained.",
    lastEventAt: "2026-09-12",
  },
  {
    serial: "RLP-HRE18-006", category: "Mobile handset", make: "Samsung", model: "Galaxy A12",
    massKg: 0.2, test: "fail", batchId: "bat-hre-018", assetTag: "KWB-7702",
    hazards: ["lithium-cell"],
    storage: [["eMMC", "E-SM-A12-8849", 64, null]],
    disposition: "awaiting", condition: "Water ingress; will not charge.",
    lastEventAt: "2026-09-12",
  },
  {
    serial: "RLP-HRE18-007", category: "Network switch", make: "HPE", model: "OfficeConnect 1920",
    massKg: 3.05, test: "pass", batchId: "bat-hre-018", assetTag: "KWB-8800",
    disposition: "awaiting", condition: "Functional. Depot spare.",
    lastEventAt: "2026-09-10",
  },
];

function buildDevice(spec: Spec, index: number): Device {
  const batch = batches.find((b) => b.id === spec.batchId)!;
  const storage: StorageDevice[] = (spec.storage ?? []).map(
    ([type, serial, capacityGb, record], i) => ({
      id: `sto-${spec.serial}-${i}`,
      serial,
      type,
      capacityGb,
      record,
    }),
  );

  const events: DeviceEvent[] = [
    ev(batch.collectedAt, "intake-registered", "T. Moyo · Intake officer",
      `Registered at intake with measured mass ${spec.massKg.toFixed(2)} kg.`),
  ];
  if (spec.test !== "untested") {
    events.push(
      ev(batch.collectedAt, "functional-test", "R. Chigumba · Technician",
        spec.test === "pass" ? "Functional test passed." : "Functional test failed."),
    );
  }
  for (const s of storage) {
    if (s.record) {
      events.push(
        ev(s.record.performedAt, "sanitisation-recorded", `${s.record.operator} · Operator`,
          `Data destruction record captured for ${s.serial} (${s.record.result}).`),
      );
    }
  }
  if (spec.disposition !== "awaiting") {
    events.push(
      ev(spec.lastEventAt, "disposition-confirmed", "P. Nyathi · Compliance lead",
        spec.disposition === "reuse-redeployed"
          ? "Reuse confirmed; unit redeployed to the originating institution."
          : "Controlled recovery confirmed by receiving processor."),
    );
  } else {
    events.push(ev(spec.lastEventAt, "note", "P. Nyathi · Compliance lead",
      "Held — disposition not yet confirmed."));
  }
  events.sort((a, b) => a.at.localeCompare(b.at));

  return {
    id: `dev-${index + 1}`,
    serial: spec.serial,
    category: spec.category,
    make: spec.make,
    model: spec.model,
    massKg: spec.massKg,
    functionalTest: spec.test,
    conditionNote: spec.condition,
    batchId: spec.batchId,
    assetTag: spec.assetTag,
    storage,
    hazardFlags: spec.hazards ?? [],
    photos: [
      { id: `pho-${index}-1`, label: "Asset label / serial plate", capturedAt: batch.collectedAt },
      { id: `pho-${index}-2`, label: "Whole-unit condition", capturedAt: batch.collectedAt },
    ],
    custodianId: FACILITY_ID,
    disposition: spec.disposition,
    recoveredFractions: spec.recovered ?? [],
    events,
  };
}

export function createSeedState(): ReloopState {
  seq = 0;
  return {
    version: STATE_VERSION,
    institutions,
    handlers,
    batches,
    devices: specs.map(buildDevice),
    transfers: [
      {
        id: "trf-seed-1",
        deviceIds: ["dev-13"],
        fromParty: FACILITY_ID,
        toParty: "hnd-gwanda",
        initiatedAt: "2026-07-14",
        acceptedAt: "2026-07-15",
        status: "accepted",
        reason: "Metal recovery of stripped chassis.",
      },
    ],
    role: "intake-officer",
    demoToday: DEMO_TODAY,
  };
}
