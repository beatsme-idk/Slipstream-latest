/*
  # Dashboard Tables Setup

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `wallet_address` (text, unique)
      - `ens_name` (text, nullable)
      - `created_at` (timestamptz)
      - `last_login` (timestamptz)
    
    - `payment_requests`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references user_profiles)
      - `recipient_address` (text)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `paid_at` (timestamptz)
      - `tx_hash` (text)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  ens_name text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

-- Create payment_requests table
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES user_profiles(id),
  recipient_address text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz,
  tx_hash text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'cancelled'))
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (wallet_address = current_user);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (wallet_address = current_user)
  WITH CHECK (wallet_address = current_user);

-- Create policies for payment_requests
CREATE POLICY "Users can read their sent or received payment requests"
  ON payment_requests
  FOR SELECT
  TO authenticated
  USING (
    sender_id IN (SELECT id FROM user_profiles WHERE wallet_address = current_user)
    OR recipient_address = current_user
  );

CREATE POLICY "Users can create payment requests"
  ON payment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id IN (SELECT id FROM user_profiles WHERE wallet_address = current_user)
  );

CREATE POLICY "Users can update their sent payment requests"
  ON payment_requests
  FOR UPDATE
  TO authenticated
  USING (
    sender_id IN (SELECT id FROM user_profiles WHERE wallet_address = current_user)
  );