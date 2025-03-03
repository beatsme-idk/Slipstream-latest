/*
  # Create Invoice Tables

  1. New Tables
    - `invoices`
      - Core invoice information including sender, recipient, amounts, and preferences
      - Tracks payment status and wallet details
    - `invoice_items`
      - Individual line items for each invoice
      - Links to parent invoice via foreign key

  2. Security
    - Enable RLS on both tables
    - Policies for viewing and creating invoices
    - Policies for viewing and creating invoice items
    - Automatic updated_at timestamp management

  3. Changes
    - Initial table creation
    - RLS policy setup
    - Trigger for updated_at
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.invoice_items;
DROP TABLE IF EXISTS public.invoices;

-- Create invoices table
CREATE TABLE public.invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  creator_id uuid REFERENCES auth.users(id) NOT NULL,
  recipient_address text NOT NULL,
  company_info text NOT NULL,
  recipient_info text NOT NULL,
  currency text NOT NULL,
  network text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  wallet_address text NOT NULL,
  selected_tokens text[] NOT NULL,
  selected_chains text[] NOT NULL,
  total_amount numeric NOT NULL,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'cancelled'))
);

-- Create invoice items table
CREATE TABLE public.invoice_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON public.invoices
  FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Create policies for invoice items
CREATE POLICY "Users can view their invoice items"
  ON public.invoice_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invoice items"
  ON public.invoice_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND invoices.creator_id = auth.uid()
    )
  );

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();