import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ukhomzhkppnagttadzkv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3Epw86dpE1iXWP78-xQONw_7nfgNzVP';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/** Sign in anonymously (idempotent — reuses existing session). Returns auth user id. */
export async function ensureAnonSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user.id;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.warn('Anon sign-in failed:', error.message);
    return null;
  }
  return data.user?.id ?? null;
}

/** Generate a random 6-character room code (uppercase alphanumeric, no ambiguous chars). */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
