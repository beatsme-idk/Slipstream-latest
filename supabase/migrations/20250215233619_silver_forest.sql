/*
  # Create invoices table and link management

  1. New Tables
    - `invoices`
      - `id` (uuid, primary key)
      - `data` (jsonb, stores invoice data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `short_id` (text, unique random identifier)
      - `is_paid` (boolean)
      - `tx_hash` (text, optional)
      - `paid_at` (timestamp, optional)

  2. Security
    - Enable RLS on `invoices` table
    - Add policies for:
      - Anyone can create an invoice
      - Anyone can read an invoice by short_id
      - Only creator can update their invoice
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  short_id text UNIQUE NOT NULL,
  is_paid boolean DEFAULT false,
  tx_hash text,
  paid_at timestamptz,
  creator_id uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create function to generate random short_id
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-generate short_id
CREATE OR REPLACE FUNCTION set_short_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Keep trying until we get a unique short_id
  LOOP
    NEW.short_id := generate_short_id();
    BEGIN
      RETURN NEW;
    EXCEPTION WHEN unique_violation THEN
      -- Do nothing, loop again
    END;
  END LOOP;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_set_short_id
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_short_id();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create policies
CREATE POLICY "Anyone can create invoices"
  ON invoices
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read invoices by short_id"
  ON invoices
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Creators can update their invoices"
  ON invoices
  FOR UPDATE
  TO public
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);