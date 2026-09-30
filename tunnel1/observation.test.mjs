import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { observeFile, OBSERVER_REF, observationFingerprint } from "./observation.mjs";

const ROOT = path.resolve("tunnel1/observation-test");
const target = path.join(ROOT, "state.txt");

await rm(ROOT, { recursive: true, force: true });
await mkdir(ROOT, { recursive: true });
await writeFile(target, "OBSERVED", "utf8");

const observed = await observeFile({
  target,
  observed_ref: "tunnel1/observation-test/state.txt"
});

if (observed.observer_ref !== OBSERVER_REF) throw new Error("observer identity missing");
if (observed.observer_ref === observed.observed_ref) throw new Error("observer/observed collapsed");
if (observed.exists !== true) throw new Error("existing state not observed");
if (observed.value !== "OBSERVED") throw new Error("observed value mismatch");
if (observed.byte_length !== 8) throw new Error("byte length mismatch");
if (!/^[a-f0-9]{64}$/.test(observed.sha256)) throw new Error("state hash missing");

const fingerprint = observationFingerprint(observed);
if (!/^[a-f0-9]{64}$/.test(fingerprint)) throw new Error("observation fingerprint missing");

const before = { value: observed.value, sha256: observed.sha256, byte_length: observed.byte_length };
const again = await observeFile({
  target,
  observed_ref: "tunnel1/observation-test/state.txt"
});
if (again.value !== before.value || again.sha256 !== before.sha256 || again.byte_length !== before.byte_length) {
  throw new Error("repeat observation did not reproduce state");
}

const missing = await observeFile({
  target: path.join(ROOT, "missing.txt"),
  observed_ref: "tunnel1/observation-test/missing.txt"
});
if (missing.exists !== false || missing.value !== null || missing.byte_length !== 0) {
  throw new Error("absence was not observed as absence");
}

console.log(JSON.stringify({
  meta_code: "OBSERVE",
  observer_ref: observed.observer_ref,
  observed_ref: observed.observed_ref,
  method: observed.method,
  observed_state: {
    exists: observed.exists,
    byte_length: observed.byte_length,
    sha256: observed.sha256,
    value: observed.value
  },
  absence_probe: missing.exists,
  observation_fingerprint: fingerprint
}, null, 2));
