/**
 * Safety utilities — strike system, lock checks, reporting.
 */
import { supabase } from './supabase';

export type LockStatus =
  | { locked: false }
  | { locked: true; until: Date };

/** Call on HomeScreen/Lobby to see if this user is currently locked out. */
export async function checkLockStatus(userId: string): Promise<LockStatus> {
  try {
    const { data } = await supabase.from('users').select('locked_until', { eq: ['id', userId] });
    const user = data?.[0];
    if (!user?.locked_until) return { locked: false };
    const until = new Date(user.locked_until);
    if (until > new Date()) return { locked: true, until };
  } catch {}
  return { locked: false };
}

export type ReportResult = {
  ok: boolean;
  newStrikes: number;
  nowLocked: boolean;
  lockUntil?: string;
};

/**
 * Report a drawing. Adds a strike to the reported user.
 * Strike 1 & 2 → warning. Strike 3 → 30-minute lock + strike reset.
 */
export async function reportDrawing(opts: {
  reporterUserId: string;
  reportedUserId: string;
  drawingId: string;
  matchId: string;
}): Promise<ReportResult> {
  const { reporterUserId, reportedUserId, drawingId, matchId } = opts;

  try {
    // Insert report — UNIQUE(reporter, drawing) prevents double-reporting
    await supabase.from('reports').insert({
      reporter_user_id: reporterUserId,
      reported_user_id: reportedUserId,
      drawing_id: drawingId,
      match_id: matchId,
    });

    // Read current strikes
    const { data: userData } = await supabase
      .from('users')
      .select('strikes', { eq: ['id', reportedUserId] });
    const currentStrikes: number = userData?.[0]?.strikes ?? 0;
    const newStrikes = currentStrikes + 1;
    const nowLocked = newStrikes >= 3;

    // Build update payload
    const updates: Record<string, any> = { strikes: nowLocked ? 0 : newStrikes };
    let lockUntil: string | undefined;
    if (nowLocked) {
      lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      updates.locked_until = lockUntil;
    }

    await supabase.from('users').update(updates).eq('id', reportedUserId);

    return { ok: true, newStrikes, nowLocked, lockUntil };
  } catch (e) {
    console.warn('Report failed:', e);
    return { ok: false, newStrikes: 0, nowLocked: false };
  }
}
