import { createHash } from "node:crypto";

export type EndpointTransport = "SSH" | "HTTP";
export type EndpointObservationStatus = 200 | 404;
export type EndpointAuthority = "OBSERVATION_ONLY";

export interface EndpointPointer {
  endpoint_id: string;
  host: string;
  address: string;
  transport: EndpointTransport;
  port: number;
}

export interface EndpointRouteObservation {
  port: number;
  path: string;
  status: EndpointObservationStatus;
  content_type: string | null;
  body_sha256?: string | null;
  body_bytes?: number | null;
}

export interface EndpointServiceObservation {
  port: number;
  service: string;
  protocol: "SSH" | "HTTP";
  status: "REACHABLE" | "RESPONDING";
  routes: EndpointRouteObservation[];
}

export interface EndpointReality {
  reality_type: "ENDPOINTSELFREALITY";
  version: "0.1";
  reality_id: string;
  pointer: EndpointPointer;
  services: EndpointServiceObservation[];
  witness: {
    observer: "THIRDEYE";
    observed_at: string;
    authority: EndpointAuthority;
  };
}

export interface MasterByteReality {
  encoding: "UTF-8";
  byte_length: number;
  sha256: string;
  canonical_bytes_b64: string;
}

export interface EndpointRealitySelfThought {
  message_type: "SELFTHOUGHT";
  version: "0.1";
  thought_id: string;
  thought_kind: "ENDPOINTREALITY_REFERENCE";
  source: "THIRDEYE";
  authority: EndpointAuthority;
  reality_id: string;
  master_byte_reality: MasterByteReality;
}

export interface EndpointRealityReference {
  reference_type: "ENDPOINTREALITY_REFERENCE";
  version: "0.1";
  reality_id: string;
  sha256: string;
  byte_length: number;
}

export interface OurselfShiftGlitch {
  glitch_type: "OURSELFSHIFT_GLITCH";
  version: "0.1";
  shift_id: string;
  endpoint_id: string;
  previous_sha256: string;
  next_sha256: string;
  detected_at: string;
  status: "DETECTED";
  reason: "REALITY_BYTES_CHANGED";
}

export interface ActimanirunReceipt {
  runtime: "ACTIMANIRUN";
  action: "MINT_ENDPOINTREALITY_SELFTHOUGHT";
  status: "RECORDED";
  execution_id: string;
  thought_id: string;
  reality_id: string;
  reality_sha256: string;
  reality_bytes: number;
  shift_id: string | null;
  authority: EndpointAuthority;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  const object = value as Record<string, unknown>;
  return "{" + Object.keys(object).sort().map((key) => JSON.stringify(key) + ":" + canonicalize(object[key])).join(",") + "}";
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function masterByteReality(reality: EndpointReality): MasterByteReality {
  const canonicalBytes = new TextEncoder().encode(canonicalize(reality));
  return {
    encoding: "UTF-8",
    byte_length: canonicalBytes.byteLength,
    sha256: sha256(canonicalBytes),
    canonical_bytes_b64: Buffer.from(canonicalBytes).toString("base64"),
  };
}

export function makeEndpointRealityReference(reality: EndpointReality): EndpointRealityReference {
  const master = masterByteReality(reality);
  return {
    reference_type: "ENDPOINTREALITY_REFERENCE",
    version: "0.1",
    reality_id: reality.reality_id,
    sha256: master.sha256,
    byte_length: master.byte_length,
  };
}

export function verifyEndpointRealityBytes(reality: EndpointReality, master: MasterByteReality): boolean {
  const bytes = Buffer.from(master.canonical_bytes_b64, "base64");
  return master.encoding === "UTF-8"
    && master.byte_length === bytes.byteLength
    && master.sha256 === sha256(bytes)
    && master.sha256 === masterByteReality(reality).sha256
    && canonicalize(reality) === new TextDecoder().decode(bytes);
}

export function makeEndpointRealitySelfThought(reality: EndpointReality, thoughtId: string): EndpointRealitySelfThought {
  return {
    message_type: "SELFTHOUGHT",
    version: "0.1",
    thought_id: thoughtId,
    thought_kind: "ENDPOINTREALITY_REFERENCE",
    source: "THIRDEYE",
    authority: "OBSERVATION_ONLY",
    reality_id: reality.reality_id,
    master_byte_reality: masterByteReality(reality),
  };
}

export function detectOurselfShiftGlitch(previous: EndpointReality, next: EndpointReality, shiftId: string, detectedAt: string): OurselfShiftGlitch | null {
  if (previous.reality_id !== next.reality_id) throw new Error("ENDPOINT_REALITY_ID_MISMATCH");
  const previousHash = masterByteReality(previous).sha256;
  const nextHash = masterByteReality(next).sha256;
  if (previousHash === nextHash) return null;
  return {
    glitch_type: "OURSELFSHIFT_GLITCH",
    version: "0.1",
    shift_id: shiftId,
    endpoint_id: next.pointer.endpoint_id,
    previous_sha256: previousHash,
    next_sha256: nextHash,
    detected_at: detectedAt,
    status: "DETECTED",
    reason: "REALITY_BYTES_CHANGED",
  };
}

export function actimanirunEndpointReality(reality: EndpointReality, executionId: string, thoughtId: string, shift: OurselfShiftGlitch | null = null): {
  thought: EndpointRealitySelfThought;
  receipt: ActimanirunReceipt;
} {
  const thought = makeEndpointRealitySelfThought(reality, thoughtId);
  const master = thought.master_byte_reality;
  return {
    thought,
    receipt: {
      runtime: "ACTIMANIRUN",
      action: "MINT_ENDPOINTREALITY_SELFTHOUGHT",
      status: "RECORDED",
      execution_id: executionId,
      thought_id: thought.thought_id,
      reality_id: thought.reality_id,
      reality_sha256: master.sha256,
      reality_bytes: master.byte_length,
      shift_id: shift?.shift_id ?? null,
      authority: "OBSERVATION_ONLY",
    },
  };
}