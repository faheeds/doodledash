/**
 * Sentry crash reporting — lightweight wrapper.
 * Install: npx expo install @sentry/react-native
 * Then add DSN to app.json extras or .env
 *
 * Usage: import './utils/sentry' at the top of App.tsx (after init).
 */
let Sentry: any = null;
try {
  Sentry = require('@sentry/react-native');
} catch {
  // Not installed yet — safe to continue
}

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

export function initSentry() {
  if (!Sentry || !DSN) return;
  try {
    Sentry.init({
      dsn: DSN,
      debug: __DEV__,
      tracesSampleRate: __DEV__ ? 0 : 0.2,
      enableNativeFramesTracking: true,
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,
    });
  } catch (e) {
    console.warn('Sentry init failed:', e);
  }
}

export function captureError(error: unknown, context?: Record<string, any>) {
  if (!Sentry || !DSN) {
    if (__DEV__) console.error('[Sentry]', error, context);
    return;
  }
  try {
    if (context) Sentry.setContext('extra', context);
    Sentry.captureException(error);
  } catch {}
}

export function setUser(userId: string, username: string) {
  if (!Sentry || !DSN) return;
  try { Sentry.setUser({ id: userId, username }); } catch {}
}
