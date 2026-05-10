import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { getDailyPrompt } from '../constants/prompts';
import { Storage } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'DailyDoodle'>;
type LeaderEntry = { display_name: string; sparks_earned: number; svg_data: string };

const todayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export default function DailyDoodleScreen({ navigation }: Props) {
  const prompt = getDailyPrompt();
  const today = todayStr();

  const [alreadyDone, setAlreadyDone] = useState(false);
  const [sparks, setSparks] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [loadingLeader, setLoadingLeader] = useState(true);

  const load = useCallback(async () => {
    const [doneDate, sp] = await Promise.all([Storage.getDailyDoodleDate(), Storage.getSparks()]);
    setAlreadyDone(doneDate === today);
    setSparks(sp);

    // Fetch leaderboard from Supabase
    try {
      const { data } = await supabase
        .from('daily_doodles')
        .select('sparks_earned,svg_data,display_name', { eq: ['doodle_date', today] });
      if (data && data.length > 0) {
        const sorted = [...data].sort((a: any, b: any) => b.sparks_earned - a.sparks_earned).slice(0, 10);
        setLeaderboard(sorted as LeaderEntry[]);
      }
    } catch {
      // Supabase unavailable — show empty leaderboard gracefully
    }
    setLoadingLeader(false);
  }, [today]);

  useFocusEffect(load);

  const handleDraw = () => {
    navigation.navigate('Draw', { prompt, isDailyDoodle: true });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📅 Daily Doodle</Text>
        <View style={styles.sparksChip}>
          <Text style={styles.sparksText}>⚡ {sparks}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Prompt card */}
        <View style={styles.promptCard}>
          <Text style={styles.promptBadge}>TODAY'S PROMPT</Text>
          <Text style={styles.promptText}>{prompt}</Text>
          <Text style={styles.promptReset}>🔄 Resets at midnight</Text>
        </View>

        {/* CTA or done state */}
        {alreadyDone ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>✅</Text>
            <View>
              <Text style={styles.doneTitle}>You doodled today!</Text>
              <Text style={styles.doneSub}>Come back tomorrow for a new prompt.</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.drawBtn} onPress={handleDraw} activeOpacity={0.85}>
            <Text style={styles.drawBtnText}>✏️ Draw Today's Prompt</Text>
            <Text style={styles.drawBtnSub}>Earn up to ⚡ 60 Sparks</Text>
          </TouchableOpacity>
        )}

        {/* Leaderboard */}
        <Text style={styles.leaderTitle}>🏆 Today's Top Doodles</Text>

        {loadingLeader ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : leaderboard.length === 0 ? (
          <View style={styles.emptyLeader}>
            <Text style={styles.emptyLeaderEmoji}>🎨</Text>
            <Text style={styles.emptyLeaderText}>
              No submissions yet — be the first to draw today's prompt!
            </Text>
          </View>
        ) : (
          leaderboard.map((entry, i) => (
            <View key={i} style={[styles.leaderRow, i === 0 && styles.leaderRowFirst]}>
              <Text style={styles.leaderRank}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </Text>
              <View style={styles.leaderThumb}>
                {entry.svg_data
                  ? <SvgXml xml={entry.svg_data} width="100%" height="100%" />
                  : <Text>🎨</Text>}
              </View>
              <View style={styles.leaderInfo}>
                <Text style={styles.leaderName}>{entry.display_name || 'Anonymous'}</Text>
                <Text style={styles.leaderSparks}>⚡ {entry.sparks_earned}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  backBtn: { paddingVertical: 4 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  sparksChip: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  sparksText: { fontSize: 14, fontWeight: '800', color: '#92400E' },

  scroll: { padding: 20, paddingTop: 8, gap: 14 },

  promptCard: {
    backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: 'center', gap: 8,
  },
  promptBadge: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 1.5 },
  promptText: { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 34 },
  promptReset: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  drawBtn: {
    backgroundColor: '#22C55E', borderRadius: 20, padding: 20, alignItems: 'center', gap: 4,
  },
  drawBtnText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  drawBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  doneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#F0FDF4', borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: '#86EFAC',
  },
  doneEmoji: { fontSize: 32 },
  doneTitle: { fontSize: 17, fontWeight: '900', color: '#166534' },
  doneSub: { fontSize: 13, color: '#16A34A', marginTop: 2 },

  leaderTitle: { fontSize: 16, fontWeight: '900', color: COLORS.text },

  emptyLeader: {
    alignItems: 'center', gap: 8, paddingVertical: 24,
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0',
  },
  emptyLeaderEmoji: { fontSize: 36 },
  emptyLeaderText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },

  leaderRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 12, gap: 12, elevation: 1,
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  leaderRowFirst: { borderColor: '#FBBF24', borderWidth: 2, backgroundColor: '#FFFBEB' },
  leaderRank: { fontSize: 20, fontWeight: '900', color: COLORS.textLight, width: 32, textAlign: 'center' },
  leaderThumb: {
    width: 52, height: 52, backgroundColor: '#F8FAFC',
    borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  leaderSparks: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
});
