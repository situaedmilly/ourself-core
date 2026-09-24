import fs from "node:fs";

export const EVENT_LEDGER_SCHEMA_VERSION = "1";

export function parseLedger(text) {
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    const event = JSON.parse(line);
    if (!/^SELF-EVENT-[A-Z0-9]{26}$/.test(event.event_id)) {
      throw new Error(`invalid event_id at line ${index + 1}`);
    }
    if (event.sequence !== index + 1) {
      throw new Error(`sequence discontinuity at line ${index + 1}`);
    }
    if (!Array.isArray(event.evidence_refs) || event.evidence_refs.length === 0) {
      throw new Error(`missing evidence_refs at line ${index + 1}`);
    }
    if (event.authority_ref === event.event_id) {
      throw new Error(`event cannot self-authorize at line ${index + 1}`);
    }
    return event;
  });
}

export function validateLedgerFile(path) {
  return parseLedger(fs.readFileSync(path, "utf8"));
}
