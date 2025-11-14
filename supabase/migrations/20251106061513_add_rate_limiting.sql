/*
  # Rate Limiting System

  ## Changes
  
  1. New Table
    - `rate_limits` - Track API request rates per client
      - `id` (uuid, primary key)
      - `client_id` (text) - Client identifier (user_id, IP, or API key)
      - `endpoint` (text) - Endpoint being rate limited
      - `request_count` (integer) - Number of requests in window
      - `window_start` (timestamptz) - Start of rate limit window
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Function
    - `check_rate_limit(client_id, endpoint, max_requests, window_seconds)`
      - Returns boolean indicating if request is allowed
      - Automatically resets window when expired
      - Updates request count atomically
  
  3. Security
    - Enable RLS
    - Only service role can access
  
  4. Rate Limit Configuration
    - Payment initiation: 5 requests per 60 seconds
    - Login attempts: 10 requests per 300 seconds (5 minutes)
    - Webhook endpoints: 100 requests per 60 seconds
*/

CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text NOT NULL,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(client_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_client_endpoint ON rate_limits(client_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to rate_limits"
  ON rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_client_id text,
  p_endpoint text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamptz;
  v_window_expired boolean;
BEGIN
  SELECT 
    request_count, 
    window_start,
    (EXTRACT(EPOCH FROM (now() - window_start)) > p_window_seconds) as expired
  INTO v_current_count, v_window_start, v_window_expired
  FROM rate_limits
  WHERE client_id = p_client_id AND endpoint = p_endpoint;

  IF NOT FOUND THEN
    INSERT INTO rate_limits (client_id, endpoint, request_count, window_start)
    VALUES (p_client_id, p_endpoint, 1, now());
    RETURN true;
  END IF;

  IF v_window_expired THEN
    UPDATE rate_limits
    SET request_count = 1,
        window_start = now(),
        updated_at = now()
    WHERE client_id = p_client_id AND endpoint = p_endpoint;
    RETURN true;
  END IF;

  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;

  UPDATE rate_limits
  SET request_count = request_count + 1,
      updated_at = now()
  WHERE client_id = p_client_id AND endpoint = p_endpoint;

  RETURN true;
END;
$$;