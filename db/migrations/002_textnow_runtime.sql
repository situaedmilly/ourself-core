-- OURSELF TEXTNOW runtime admission/actuation boundary.
-- This adds a logical TEXTNOW destination without claiming an external TextNow API.
ALTER TABLE public.matter_outbox DROP CONSTRAINT IF EXISTS matter_outbox_destination_check;
ALTER TABLE public.matter_outbox ADD CONSTRAINT matter_outbox_destination_check
  CHECK (destination IN ('WEBSOCKET','TELEPHONY_SMPP','TELEPHONY_SIP','TEXTNOW','LOCAL_TEST'));
