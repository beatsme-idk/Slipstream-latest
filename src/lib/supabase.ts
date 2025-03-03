import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createInvoice(data: any) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert([{ data }])
    .select('short_id')
    .single();

  if (error) throw error;
  return invoice;
}

export async function getInvoice(shortId: string) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('short_id', shortId)
    .single();

  if (error) throw error;
  return invoice;
}

export async function updateInvoice(shortId: string, data: any) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .update({ data })
    .eq('short_id', shortId)
    .select()
    .single();

  if (error) throw error;
  return invoice;
}

export async function markInvoiceAsPaid(shortId: string, txHash: string) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .update({
      is_paid: true,
      tx_hash: txHash,
      paid_at: new Date().toISOString(),
    })
    .eq('short_id', shortId)
    .select()
    .single();

  if (error) throw error;
  return invoice;
}