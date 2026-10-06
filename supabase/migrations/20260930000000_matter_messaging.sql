-- OURSELF Matter: governed messaging persistence (PostgreSQL)
-- Canonical Supabase migration. Additive only; no carrier or transport credentials.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.matter_intents (
  intent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reality_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  intent_type TEXT NOT NULL CHECK (intent_type IN ('MESSAGE_SEND','VOICE_SESSION','MEDIA_SEND')),
  recipient_ref TEXT NOT NULL,
  payload JSONB NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  policy_version TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DECLARED','ADMITTED','REJECTED','QUEUED','ACTUATING','COMPLETED','FAILED','UNKNOWN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS matter_intents_state_created_idx ON public.matter_intents (state, created_at);
CREATE INDEX IF NOT EXISTS matter_intents_recipient_created_idx ON public.matter_intents (recipient_ref, created_at DESC);

CREATE TABLE IF NOT EXISTS public.matter_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.matter_intents(intent_id),
  reality_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  parent_event_ids UUID[] NOT NULL DEFAULT '{}',
  proof_ref TEXT,
  evidence_digest TEXT,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS matter_events_intent_time_idx ON public.matter_events (intent_id, recorded_at, event_id);

CREATE TABLE IF NOT EXISTS public.matter_outbox (
  outbox_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.matter_intents(intent_id),
  destination TEXT NOT NULL CHECK (destination IN ('WEBSOCKET','TELEPHONY_SMPP','TELEPHONY_SIP','LOCAL_TEST')),
  event_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','CLAIMED','PUBLISHED','RETRY','DEAD')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (intent_id, destination)
);
CREATE INDEX IF NOT EXISTS matter_outbox_dispatch_idx ON public.matter_outbox (status, available_at, created_at);

CREATE TABLE IF NOT EXISTS public.matter_delivery_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.matter_intents(intent_id),
  destination TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  status TEXT NOT NULL CHECK (status IN ('STARTED','ACCEPTED','SUBMITTED','DELIVERED','FAILED','UNKNOWN')),
  provider_reference TEXT,
  error_code TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (intent_id, destination, attempt_number),
  UNIQUE (destination, idempotency_key, attempt_number)
);
CREATE INDEX IF NOT EXISTS matter_attempts_intent_idx ON public.matter_delivery_attempts (intent_id, started_at DESC);

CREATE TABLE IF NOT EXISTS public.matter_receipts (
  receipt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id UUID NOT NULL REFERENCES public.matter_intents(intent_id),
  attempt_id UUID REFERENCES public.matter_delivery_attempts(attempt_id),
  receipt_type TEXT NOT NULL CHECK (receipt_type IN ('ADMISSION','CROP_PROOF','TRANSPORT_ACK','PROVIDER_SUBMIT','DELIVERY_REPORT','OBSERVATION','RECONCILIATION')),
  issuer TEXT NOT NULL,
  issuer_reference TEXT,
  evidence_digest TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  receipt_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS matter_receipts_intent_time_idx ON public.matter_receipts (intent_id, received_at DESC);

-- These tables are governed persistence surfaces. Browser/API access stays denied until explicit policies exist.
ALTER TABLE public.matter_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matter_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matter_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matter_delivery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matter_receipts ENABLE ROW LEVEL SECURITY;
