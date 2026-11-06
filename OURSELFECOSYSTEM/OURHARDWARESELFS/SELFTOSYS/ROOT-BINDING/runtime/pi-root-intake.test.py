import json, threading, unittest
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from http.server import ThreadingHTTPServer
import server
class IntakeTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.http=ThreadingHTTPServer(("127.0.0.1",0),server.Handler)
  cls.thread=threading.Thread(target=cls.http.serve_forever,daemon=True); cls.thread.start()
  cls.base=f"http://127.0.0.1:{cls.http.server_port}"
 @classmethod
 def tearDownClass(cls):
  cls.http.shutdown(); cls.http.server_close(); cls.thread.join()
 def test_health_status_only(self):
  with urlopen(self.base+"/health") as r: d=json.load(r)
  self.assertEqual(d["health"],"OK"); self.assertEqual(d["authority"],"NONE"); self.assertEqual(d["signing"],"DISABLED")
 def test_binding_unbound(self):
  with urlopen(self.base+"/v1/binding/state") as r: d=json.load(r)
  self.assertEqual(d["bindingState"],"UNBOUND"); self.assertEqual(d["admission"],"BLOCKED")
 def test_challenge_fail_closed(self):
  req=Request(self.base+"/v1/challenges",data=b'{"purpose":"root-proof"}',headers={"Content-Type":"application/json"},method="POST")
  with self.assertRaises(HTTPError) as e: urlopen(req)
  self.assertEqual(e.exception.code,423); d=json.load(e.exception)
  self.assertFalse(d["challengeIssued"]); self.assertFalse(d["signatureProduced"])
 def test_unknown_route(self):
  with self.assertRaises(HTTPError) as e: urlopen(self.base+"/admin")
  self.assertEqual(e.exception.code,404)
if __name__=="__main__": unittest.main()
