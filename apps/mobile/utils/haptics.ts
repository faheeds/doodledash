/**
 * Haptic feedback wrappers — safe to call anywhere.
 * Falls back silently if expo-haptics isn't available or the device doesn't support it.
 */
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch {}

export const haptics = {
  /** Soft tap — button presses, small interactions */
  light() {
    try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Light); } catch {}
  },

  /** Medium tap — drawing stroke start, card selection */
  medium() {
    try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium); } catch {}
  },

  /** Heavy punch — level complete, big score reveal */
  heavy() {
    try { Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
  },

  /** Success notification — correct action, unlock */
  success() {
    try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Success); } catch {}
  },

  /** Warning — strike issued, can't afford frame */
  warning() {
    try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Warning); } catch {}
  },

  /** Error — invalid code, failed action */
  error() {
    try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType.Error); } catch {}
  },

  /** Selection tick — scrolling through items */
  selection() {
    try { Haptics?.selectionAsync?.(); } catch {}
  },
};
