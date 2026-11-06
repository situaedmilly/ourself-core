import os,tempfile,unittest
from unittest.mock import patch
from root_transport import build_context,RootTransportBlocked
class RootTransportTests(unittest.TestCase):
 def test_missing_configuration_blocks(self):
  with patch.dict(os.environ,{},clear=True):
   with self.assertRaises(RootTransportBlocked): build_context()
 def test_plain_http_blocks(self):
  env={"SELFTOSYS_ROOT_ENDPOINT":"http://root.invalid","SELFTOSYS_ROOT_CA_BUNDLE":"/x","SELFTOSYS_CLIENT_CERT":"/y","SELFTOSYS_CLIENT_KEY":"/z","SELFTOSYS_ROOT_CERT_SHA256":"a"*64}
  with patch.dict(os.environ,env,clear=True):
   with self.assertRaisesRegex(RootTransportBlocked,"must_be_https"): build_context()
 def test_bad_pin_blocks(self):
  with tempfile.TemporaryDirectory() as d:
   paths=[os.path.join(d,n) for n in ("ca.pem","client.pem","client.key")]
   for p in paths: open(p,"w").close()
   env=dict(zip(("SELFTOSYS_ROOT_CA_BUNDLE","SELFTOSYS_CLIENT_CERT","SELFTOSYS_CLIENT_KEY"),paths))
   env.update({"SELFTOSYS_ROOT_ENDPOINT":"https://root.invalid","SELFTOSYS_ROOT_CERT_SHA256":"bad"})
   with patch.dict(os.environ,env,clear=True):
    with self.assertRaisesRegex(RootTransportBlocked,"invalid_root_certificate"): build_context()
if __name__=="__main__": unittest.main()
