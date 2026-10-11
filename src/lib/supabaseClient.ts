import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase (if provided in deployment)
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey.length > 20
);

// Real client when credentials exist
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// RLS Verification Logger
export function logRlsEnforcement(action: string, entity: string, userId: string, role: string, allowed: boolean, reason?: string) {
  const status = allowed ? 'ALLOWED' : 'DENIED';
  console.log(`[RLS Policy][${status}] Action: ${action} on ${entity} by User: ${userId} (${role}). ${reason || ''}`);
}
