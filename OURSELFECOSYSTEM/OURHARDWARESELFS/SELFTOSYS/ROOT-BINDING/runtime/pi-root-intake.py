#!/usr/bin/env python3
"""SELFTOSYS root-side intake shell. Status-only; no key custody or signing."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json, os, time
HOST=os.environ.get("SELFTOSYS_BIND_HOST","127.0.0.1")
PORT=int(os.environ.get("SELFTOSYS_BIND_PORT","49372"))
class Handler(BaseHTTPRequestHandler):
    server_version="SELFTOSYS-Intake/0.1"
    def _send(self,status,payload):
        body=json.dumps(payload,sort_keys=True).encode()
        self.send_response(status); self.send_header("Content-Type","application/json")
        self.send_header("Content-Length",str(len(body))); self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff"); self.send_header("Content-Security-Policy","default-src 'none'")
        self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        if self.path=="/health":
            return self._send(200,{"service":"selftosys-root-intake","version":"0.1","health":"OK","authority":"NONE","binding":"UNBOUND","signing":"DISABLED"})
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
        return self._send(423,{"error":"ROOT_NOT_ADMITTED","decision":"BLOCKED","reason":"No admitted hardware root, independent custody, root trust anchor, or authenticated root transport exists.","challengeIssued":False,"signatureProduced":False,"timestamp":int(time.time())})
    def log_message(self,fmt,*args): print("%s - %s"%(self.log_date_time_string(),fmt%args),flush=True)
if __name__=="__main__":
    if HOST not in ("127.0.0.1","::1","localhost"): raise SystemExit("Refusing non-loopback bind before root admission.")
    print(f"SELFTOSYS intake listening on {HOST}:{PORT}; status-only; signing disabled",flush=True)
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
