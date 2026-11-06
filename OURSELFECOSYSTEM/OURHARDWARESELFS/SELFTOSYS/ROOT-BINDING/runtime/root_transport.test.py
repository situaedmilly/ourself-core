import os, tempfile, unittest
from unittest.mock import patch
from root_transport import build_context, RootTransportBlocked
class RootTransportTests(unittest.TestCase):
 def test_missing_configuration_blocks(self):
  with patch.dict(os.environ,{},clear=True):
   with self.assertRaises(RootTransportBlocked): build_context()
 def test_plain_http_endpoint_blocks(self):
  with patch.dict(os.environ,{"SELFTOSYS_ROOT_ENDPOINT":"http://root.invalid","SELFTOSYS_ROOT_CA_BUNDLE":"/x","SELFTOSYS_CLIENT_CERT":"/y","SELFTOSYS_CLIENT_KEY":"/z","SELFTOSYS_ROOT_CERT_SHA256":"a"*64},clear=True):
   with self.assertRaisesRegex(RootTransportBlocked,"must_be_https"): build_context()
 def test_bad_pin_blocks_before_network(self):
  with tempfile.TemporaryDirectory() as d:
   ca=os.path.join(d,"ca.pem"); cert=os.path.join(d,"client.pem"); key=os.path.join(d,"client.key")
   for p in (ca,cert,key): open(p,"w").close()
   env={"SELFTOSYS_ROOT_ENDPOINT":"https://root.invalid","SELFTOSYS_ROOT_CA_BUNDLE":ca,"SELFTOSYS_CLIENT_CERT":cert,"SELFTOSYS_CLIENT_KEY":key,"SELFTOSYS_ROOT_CERT_SHA256":"bad"}
   with patch.dict(os.environ,env,clear=True):
    with self.assertRaisesRegex(RootTransportBlocked,"invalid_root_certificate"): build_context()
if __name__=="__main__": unittest.main()
