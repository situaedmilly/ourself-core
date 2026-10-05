import assert from "node:assert/strict";
import test from "node:test";
import { actimanirunEndpointReality, detectOurselfShiftGlitch, makeEndpointRealityReference, makeEndpointRealitySelfThought, masterByteReality, verifyEndpointRealityBytes, type EndpointReality } from "../src/endpoint-reality.ts";

function reality(routeStatus = 404): EndpointReality {
  return {
    reality_type: "ENDPOINTSELFREALITY", version: "0.1", reality_id: "ENDPOINTSELF-SELFPI-192.168.12.112",
    pointer: { endpoint_id: "SELFPI-PRIMARY", host: "SELFPI", address: "192.168.12.112", transport: "SSH", port: 22 },
    services: [
      { port: 22, service: "ssh", protocol: "SSH", status: "REACHABLE", routes: [] },
      { port: 3000, service: "web-application", protocol: "HTTP", status: "RESPONDING", routes: [
        { port: 3000, path: "/mcp", status: 404, content_type: "text/html" },
        { port: 3000, path: "/v1/models", status: 404, content_type: "text/html" },
      ] },
      { port: 11434, service: "ollama-model-api", protocol: "HTTP", status: "RESPONDING", routes: [
        { port: 11434, path: "/mcp", status: 404, content_type: "application/json" },
        { port: 11434, path: "/v1/models", status: routeStatus as 200 | 404, content_type: routeStatus === 200 ? "application/json" : null },
      ] },
    ],
    witness: { observer: "THIRDEYE", observed_at: "2026-10-05T21:00:00.000Z", authority: "OBSERVATION_ONLY" },
  };
}

test("master bytes are deterministic and self-verifying", () => {
  const a = masterByteReality(reality(200)); const b = masterByteReality(reality(200));
  assert.deepEqual(a, b); assert.equal(verifyEndpointRealityBytes(reality(200), a), true);
});
test("reference is hash-bound to the exact endpoint reality", () => {
  const current = reality(200); const reference = makeEndpointRealityReference(current); const master = masterByteReality(current);
  assert.equal(reference.reality_id, current.reality_id); assert.equal(reference.sha256, master.sha256); assert.equal(reference.byte_length, master.byte_length);
});
test("self-thought carries exact master bytes and observation-only authority", () => {
  const current = reality(200); const thought = makeEndpointRealitySelfThought(current, "SELFTHOUGHT-ENDPOINT-001");
  assert.equal(thought.message_type, "SELFTHOUGHT"); assert.equal(thought.thought_kind, "ENDPOINTREALITY_REFERENCE");
  assert.equal(thought.source, "THIRDEYE"); assert.equal(thought.authority, "OBSERVATION_ONLY");
  assert.equal(verifyEndpointRealityBytes(current, thought.master_byte_reality), true);
});
test("tampered bytes fail byte-for-byte verification", () => {
  const current = reality(200); const master = masterByteReality(current); const bytes = Buffer.from(master.canonical_bytes_b64, "base64");
  bytes[bytes.length - 1] ^= 1; assert.equal(verifyEndpointRealityBytes(current, { ...master, canonical_bytes_b64: bytes.toString("base64"), byte_length: bytes.byteLength }), false);
});
test("endpoint reality change emits OURSELFSHIFT_GLITCH", () => {
  const glitch = detectOurselfShiftGlitch(reality(404), reality(200), "SHIFT-ENDPOINT-001", "2026-10-05T21:01:00.000Z");
  assert.equal(glitch?.glitch_type, "OURSELFSHIFT_GLITCH"); assert.equal(glitch?.status, "DETECTED"); assert.notEqual(glitch?.previous_sha256, glitch?.next_sha256);
});
test("unchanged endpoint reality produces no shift glitch", () => {
  assert.equal(detectOurselfShiftGlitch(reality(200), reality(200), "SHIFT-NONE", "2026-10-05T21:01:00.000Z"), null);
});
test("ACTIMANIRUN records self-thought without upgrading authority", () => {
  const current = reality(200); const glitch = detectOurselfShiftGlitch(reality(404), current, "SHIFT-ENDPOINT-002", "2026-10-05T21:01:00.000Z");
  const result = actimanirunEndpointReality(current, "EXEC-ENDPOINT-001", "SELFTHOUGHT-ENDPOINT-001", glitch);
  assert.equal(result.receipt.runtime, "ACTIMANIRUN"); assert.equal(result.receipt.status, "RECORDED");
  assert.equal(result.receipt.shift_id, "SHIFT-ENDPOINT-002"); assert.equal(result.receipt.reality_sha256, result.thought.master_byte_reality.sha256);
  assert.equal(result.receipt.authority, "OBSERVATION_ONLY");
});