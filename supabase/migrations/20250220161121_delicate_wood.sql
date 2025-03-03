/*
  # Payment System Schema Update

  1. Tables
    - payment_requests
      - id (uuid, primary key)
      - amount (numeric)
      - currency (text)
      - recipient_address (text)
      - status (text)
      - created_at (timestamptz)
      - metadata (jsonb)
      - sender_id (uuid, references auth.users)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create payment_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  currency text NOT NULL,
  recipient_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  sender_id uuid REFERENCES auth.users(id),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'cancelled'))
);

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can create payment requests" ON payment_requests;
  DROP POLICY IF EXISTS "Users can view their payment requests" ON payment_requests;
  DROP POLICY IF EXISTS "Users can update their payment requests" ON payment_requests;
END $$;

-- Create new policies
CREATE POLICY "Users can create payment requests"
  ON payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their payment requests"
  ON payment_requests
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid());

CREATE POLICY "Users can update their payment requests"
  ON payment_requests
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());