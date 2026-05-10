import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Lock'>;

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function LockScreen({ navigation, route }: Props) {
  const { lockedUntil } = route.params;
  const until = new Date(lockedUntil).getTime();
  const [remaining, setRemaining] = useState(until - Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const left = until - Date.now();
      setRemaining(left);
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        navigation.replace('Home');
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [until]);

  const mins = Math.floor(Math.max(remaining, 0) / 60000);
  const secs = Math.floor((Math.max(remaining, 0) % 60000) / 1000);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.icon}>🔒</Text>
        <Text style={styles.title}>Taking a Break</Text>
        <Text style={styles.subtitle}>
          Your account has been flagged for inappropriate content.{'\n'}
          You can play again in:
        </Text>

        <View style={styles.timerCard}>
          <Text style={styles.timer}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </Text>
          <Text style={styles.timerLabel}>minutes remaining</Text>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>While you wait...</Text>
          <Text style={styles.tip}>✏️ Practice your drawing skills on paper</Text>
          <Text style={styles.tip}>🎨 Think of creative ideas for next time</Text>
          <Text style={styles.tip}>🌟 Come back with your best doodles!</Text>
        </View>

        <Text style={styles.reminder}>
          Keep drawings fun and friendly for everyone. 🤝
        </Text>

        {remaining <= 0 && (
          <TouchableOpacity style={styles.goBtn} onPress={() => navigation.replace('Home')}>
            <Text style={styles.goBtnText}>Back to Doodle Dash →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FEF2F2' },
  container: {
    flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 20,
  },
  icon: { fontSize: 72 },
  title: { fontSize: 28, fontWeight: '900', color: '#DC2626', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },

  timerCard: {
    backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 48, paddingVertical: 24,
    alignItems: 'center', elevation: 3,
    borderWidth: 2, borderColor: '#FCA5A5',
  },
  timer: { fontSize: 64, fontWeight: '900', color: '#DC2626', letterSpacing: 4 },
  timerLabel: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },

  tips: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 10, width: '100%', elevation: 1,
  },
  tipsTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  tip: { fontSize: 14, color: COLORS.textLight },

  reminder: {
    fontSize: 14, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic',
  },

  goBtn: {
    backgroundColor: COLORS.primary, borderRadius: 24,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  goBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
