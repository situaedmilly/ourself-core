#!/usr/bin/env python3
"""SELFTOSYS intake. Loopback-only front door; upstream root calls require strict mTLS."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json, os, time, uuid, secrets
from root_transport import authenticated_root_request, RootTransportBlocked
HOST=os.environ.get("SELFTOSYS_BIND_HOST","127.0.0.1")
PORT=int(os.environ.get("SELFTOSYS_BIND_PORT","49372"))
class Handler(BaseHTTPRequestHandler):
    server_version="SELFTOSYS-Intake/0.2"
    def _send(self,status,payload):
        body=json.dumps(payload,sort_keys=True).encode()
        self.send_response(status); self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(body))); self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff"); self.send_header("Content-Security-Policy","default-src 'none'")
        self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        if self.path=="/health":
            return self._send(200,{"service":"selftosys-root-intake","version":"0.2","health":"OK","authority":"NONE","binding":"UNBOUND","signing":"DISABLED","upstreamTransport":"CONFIGURATION_REQUIRED"})
        if self.path=="/v1/binding/state":
            return self._send(200,{"reality":"SELFTOSYS","bindingState":"UNBOUND","rootHardware":"UNBOUND","independentCustody":"UNBOUND","authenticatedTransport":"NOT_ESTABLISHED","liveChallenge":"NOT_VERIFIED","productionRoot":"NOT_GENERATED","admission":"BLOCKED"})
        return self._send(404,{"error":"NOT_FOUND"})
    def do_POST(self):
        if self.path!="/v1/challenges": return self._send(404,{"error":"NOT_FOUND"})
        try:
            n=int(self.headers.get("Content-Length","0"))
            if n<1 or n>8192: return self._send(400,{"error":"INVALID_CONTENT_LENGTH"})
            payload=json.loads(self.rfile.read(n))
            if not isinstance(payload,dict): return self._send(400,{"error":"JSON_OBJECT_REQUIRED"})
        except (ValueError,json.JSONDecodeError): return self._send(400,{"error":"INVALID_JSON"})
        challenge={"challengeId":str(uuid.uuid4()),"nonce":secrets.token_urlsafe(32),"purpose":"OURSELF_ROOT_IDENTITY_PROOF","audience":"SELFTOSYS_PI_INTAKE","issuedAt":int(time.time()),"expiresAt":int(time.time())+60,"requestContext":payload}
        try: result=authenticated_root_request(challenge)
        except RootTransportBlocked as exc:
            return self._send(423,{"error":"ROOT_TRANSPORT_BLOCKED","decision":"BLOCKED","reason":str(exc),"challengeIssued":False,"signatureProduced":False})
        return self._send(202,{"decision":"ROOT_RESPONSE_RECEIVED_UNVERIFIED","transport":result["transport"],"peerCertificateSha256":result["peerCertificateSha256"],"rootResponse":result["response"],"cryptographicRootProof":"NOT_VERIFIED","admission":"BLOCKED"})
    def log_message(self,fmt,*args): print("%s - %s"%(self.log_date_time_string(),fmt%args),flush=True)
if __name__=="__main__":
    if HOST not in ("127.0.0.1","::1","localhost"): raise SystemExit("Refusing non-loopback bind before root admission.")
    print(f"SELFTOSYS intake v0.2 listening on {HOST}:{PORT}; signing disabled",flush=True)
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
