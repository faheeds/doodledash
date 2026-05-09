import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

type Props = {
  seconds: number;
  totalSeconds: number;
  onTimeUp: () => void;
};

export default function CountdownTimer({ seconds, totalSeconds, onTimeUp }: Props) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pct = seconds / totalSeconds;
  const isUrgent = seconds <= 10;

  useEffect(() => {
    if (seconds === 0) { onTimeUp(); return; }
    if (isUrgent) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [seconds]);

  const barColor = pct > 0.5 ? '#22C55E' : pct > 0.25 ? '#FACC15' : '#EF4444';

  return (
    <View style={styles.container}>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
      </View>
      <Animated.Text
        style={[
          styles.timeText,
          isUrgent && styles.timeTextUrgent,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        {seconds}s
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  barBg: { flex: 1, height: 8, backgroundColor: '#E5E5E5', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  timeText: { fontSize: 18, fontWeight: '800', color: '#1C1917', minWidth: 36, textAlign: 'right' },
  timeTextUrgent: { color: '#EF4444' },
});
