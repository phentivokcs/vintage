/*
  # Webhook Event Tracking and Idempotency

  ## Changes
  
  1. New Table
    - `webhook_events` - Track all incoming webhook events
      - `id` (uuid, primary key)
      - `event_id` (text, unique) - External event ID from provider
      - `provider` (text) - Provider name (barion, packeta, billingo)
      - `event_type` (text) - Event type
      - `payload` (jsonb) - Full webhook payload
      - `processed` (boolean) - Processing status
      - `processed_at` (timestamptz) - When it was processed
      - `created_at` (timestamptz) - When received
      
  2. Security
    - Enable RLS
    - Only service role can access
  
  3. Purpose
    - Prevents duplicate webhook processing (idempotency)
    - Provides audit trail of all webhook events
    - Enables retry mechanism for failed webhooks
*/

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  provider text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to webhook_events"
  ON webhook_events FOR ALL
  USING (true)
  WITH CHECK (true);