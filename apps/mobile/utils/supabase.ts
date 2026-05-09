/**
 * Lightweight Supabase client using only fetch + WebSocket.
 * No npm package — works in Expo Go with zero bundling issues.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://ukhomzhkppnagttadzkv.supabase.co';
const ANON_KEY = 'sb_publishable_3Epw86dpE1iXWP78-xQONw_7nfgNzVP';
const REST = `${SUPABASE_URL}/rest/v1`;
const AUTH = `${SUPABASE_URL}/auth/v1`;

const SESSION_KEY = '@doodle_dash_session';

// ─── Auth ────────────────────────────────────────────────────────────────────

let _accessToken: string | null = null;
let _userId: string | null = null;

export async function ensureAnonSession(): Promise<string | null> {
  // Check memory first
  if (_userId && _accessToken) return _userId;

  // Check persisted session
  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (stored) {
      const { access_token, user_id, expires_at } = JSON.parse(stored);
      if (Date.now() < expires_at) {
        _accessToken = access_token;
        _userId = user_id;
        return _userId;
      }
    }
  } catch {}

  // Sign in anonymously
  try {
    const res = await fetch(`${AUTH}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON_KEY },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (data?.access_token && data?.user?.id) {
      _accessToken = data.access_token;
      _userId = data.user.id;
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({
        access_token: _accessToken,
        user_id: _userId,
        expires_at: Date.now() + 3600 * 1000,
      }));
      return _userId;
    }
  } catch (e) {
    console.warn('Anon sign-in failed:', e);
  }
  return null;
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: ANON_KEY,
    Authorization: `Bearer ${_accessToken || ANON_KEY}`,
    Prefer: 'return=representation',
  };
}

// ─── REST helpers ────────────────────────────────────────────────────────────

type Row = Record<string, any>;

async function restFetch(path: string, init: RequestInit): Promise<any> {
  const res = await fetch(`${REST}${path}`, { ...init, headers: { ...authHeaders(), ...(init.headers as any) } });
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return text; }
}

/** Minimal query builder */
function from(table: string) {
  return {
    async select(
      cols = '*',
      opts: {
        eq?: [string, any];
        eqs?: [string, any][];  // multiple equality filters
        limit?: number;
        count?: boolean;
      } = {}
    ) {
      let path = `/${table}?select=${cols}`;
      if (opts.eq) path += `&${opts.eq[0]}=eq.${opts.eq[1]}`;
      if (opts.eqs) {
        for (const [k, v] of opts.eqs) {
          path += `&${k}=eq.${v}`;
        }
      }
      if (opts.limit) path += `&limit=${opts.limit}`;
      const headers: any = {};
      if (opts.count) headers['Prefer'] = 'count=exact';
      const data = await restFetch(path, { method: 'GET', headers });
      return { data: Array.isArray(data) ? data : [], error: null };
    },
    async insert(row: Row | Row[]) {
      const data = await restFetch(`/${table}`, { method: 'POST', body: JSON.stringify(row) });
      const result = Array.isArray(data) ? data[0] : data;
      return { data: result, error: result?.code ? result : null };
    },
    async upsert(row: Row | Row[], opts: { onConflict?: string } = {}) {
      const headers: any = { Prefer: `resolution=merge-duplicates,return=representation` };
      const data = await restFetch(`/${table}`, { method: 'POST', body: JSON.stringify(row), headers });
      const result = Array.isArray(data) ? data[0] : data;
      return { data: result, error: result?.code ? result : null };
    },
    update(fields: Row) {
      return {
        async eq(col: string, val: any) {
          const data = await restFetch(`/${table}?${col}=eq.${val}`, { method: 'PATCH', body: JSON.stringify(fields) });
          return { data, error: null };
        },
        async match(filters: Row) {
          const qs = Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join('&');
          const data = await restFetch(`/${table}?${qs}`, { method: 'PATCH', body: JSON.stringify(fields) });
          return { data, error: null };
        },
      };
    },
    single() { return this; },
  };
}

export const supabase = { from };

export function getAccessToken(): string | null { return _accessToken; }

// ─── Realtime (polling-based) ─────────────────────────────────────────────────

type ChangeCallback = (payload: { new: Row }) => void;

export function subscribeToMatch(matchId: string, onUpdate: ChangeCallback): () => void {
  let lastStatus = '';
  let active = true;

  const poll = async () => {
    while (active) {
      try {
        const { data } = await supabase.from('matches').select('*', { eq: ['id', matchId] });
        const match = data?.[0];
        if (match && match.status !== lastStatus) {
          lastStatus = match.status;
          onUpdate({ new: match });
        }
      } catch {}
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  poll();
  return () => { active = false; };
}

export function subscribeToPlayers(matchId: string, onUpdate: () => void): () => void {
  let lastCount = 0;
  let active = true;

  const poll = async () => {
    while (active) {
      try {
        const { data } = await supabase.from('match_players').select('*', { eq: ['match_id', matchId] });
        if (data.length !== lastCount) {
          lastCount = data.length;
          onUpdate();
        }
      } catch {}
      await new Promise(r => setTimeout(r, 2000));
    }
  };

  poll();
  return () => { active = false; };
}

// ─── Room code ───────────────────────────────────────────────────────────────

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
