"""Authenticated upstream root transport for SELFTOSYS. No trust bootstrap or plaintext fallback."""
import hashlib,json,os,ssl,urllib.request,urllib.error
from urllib.parse import urlparse
class RootTransportBlocked(RuntimeError): pass
def _required(name):
 value=os.environ.get(name,"").strip()
 if not value: raise RootTransportBlocked("missing_environment:"+name)
 return value
def build_context():
 endpoint=_required("SELFTOSYS_ROOT_ENDPOINT"); parsed=urlparse(endpoint)
 if parsed.scheme!="https" or not parsed.hostname: raise RootTransportBlocked("root_endpoint_must_be_https")
 ca=_required("SELFTOSYS_ROOT_CA_BUNDLE"); cert=_required("SELFTOSYS_CLIENT_CERT"); key=_required("SELFTOSYS_CLIENT_KEY")
 pin=_required("SELFTOSYS_ROOT_CERT_SHA256").replace(":","").lower()
 if len(pin)!=64 or any(c not in "0123456789abcdef" for c in pin): raise RootTransportBlocked("invalid_root_certificate_sha256_pin")
 for path in (ca,cert,key):
  if not os.path.isfile(path): raise RootTransportBlocked("credential_file_missing:"+path)
 ctx=ssl.create_default_context(ssl.Purpose.SERVER_AUTH,cafile=ca); ctx.minimum_version=ssl.TLSVersion.TLSv1_2
 ctx.check_hostname=True; ctx.verify_mode=ssl.CERT_REQUIRED; ctx.load_cert_chain(certfile=cert,keyfile=key)
 return ctx,endpoint,pin
def authenticated_root_request(payload,timeout=5.0):
 if not isinstance(payload,dict): raise TypeError("payload must be an object")
 ctx,endpoint,pin=build_context(); body=json.dumps(payload,separators=(",",":"),sort_keys=True).encode()
 req=urllib.request.Request(endpoint.rstrip("/")+"/v1/challenges",data=body,headers={"Content-Type":"application/json","Accept":"application/json","Cache-Control":"no-store"},method="POST")
 try:
  with urllib.request.urlopen(req,context=ctx,timeout=timeout) as response:
   cert=response.fp.raw._sock.getpeercert(binary_form=True); actual=hashlib.sha256(cert).hexdigest()
   if actual!=pin: raise RootTransportBlocked("root_peer_certificate_pin_mismatch")
   if response.status!=200: raise RootTransportBlocked("root_endpoint_non_200")
   data=json.loads(response.read(65536))
   if not isinstance(data,dict): raise RootTransportBlocked("root_response_not_object")
   return {"transport":"MTLS_PEER_VERIFIED","peerCertificateSha256":actual,"httpStatus":response.status,"response":data,"cryptographicRootProof":"NOT_VERIFIED"}
 except (urllib.error.URLError,TimeoutError,ssl.SSLError,OSError) as exc:
  raise RootTransportBlocked("authenticated_root_transport_failed:"+type(exc).__name__) from exc
