import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Reveal'>;

type Drawing = {
  id: string;
  player_id: string | null;
  display_name: string;
  svg_data: string;
  is_bot: boolean;
};

export default function RevealScreen({ navigation, route }: Props) {
  const { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost } = route.params;
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const load = async () => {
      // Load drawings for this round
      const { data: drawingRows } = await supabase.from('drawings').select('id, player_id, svg_data', {
        eqs: [['match_id', matchId], ['round_number', round]],
      });

      // Load player names
      const { data: players } = await supabase.from('match_players').select('user_id, display_name, is_bot', {
        eq: ['match_id', matchId],
      });

      const playerMap: Record<string, { name: string; isBot: boolean }> = {};
      for (const p of (players || [])) {
        if (p.user_id) playerMap[p.user_id] = { name: p.display_name || 'Player', isBot: p.is_bot };
      }

      const merged: Drawing[] = (drawingRows || []).map((d, i) => ({
        id: d.id,
        player_id: d.player_id,
        display_name: d.player_id ? (playerMap[d.player_id]?.name || 'Player') : `Bot ${i + 1}`,
        svg_data: d.svg_data || '',
        is_bot: d.player_id ? (playerMap[d.player_id]?.isBot ?? false) : true,
      }));

      // Shuffle order for fun reveal
      const shuffled = [...merged].sort(() => Math.random() - 0.5);
      setDrawings(shuffled);
      setLoading(false);
    };
    load();
  }, []);

  const goToVote = () => {
    navigation.replace('Vote', {
      matchId, roomCode, userId, username, prompt, round, totalRounds, isHost,
      drawings: drawings.map(d => ({ id: d.id, display_name: d.display_name, svg_data: d.svg_data })),
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Collecting drawings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const current = drawings[currentIdx];
  const isLast = currentIdx === drawings.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.header}>🎨 Reveal Parade</Text>
        <Text style={styles.round}>Round {round}/{totalRounds} · "{prompt}"</Text>
        <Text style={styles.counter}>{currentIdx + 1} of {drawings.length}</Text>

        {/* Drawing card */}
        <View style={styles.card}>
          <View style={styles.preview}>
            {current?.svg_data ? (
              <SvgXml xml={current.svg_data} width="100%" height="100%" />
            ) : (
              <Text style={{ fontSize: 48 }}>🎨</Text>
            )}
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.playerEmoji}>{current?.is_bot ? '🤖' : '🎨'}</Text>
            <Text style={styles.playerName}>{current?.display_name}</Text>
            {current?.player_id === userId && <Text style={styles.youBadge}>you!</Text>}
          </View>
        </View>

        {/* Navigation dots */}
        <View style={styles.dots}>
          {drawings.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIdx && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.navRow}>
          {currentIdx > 0 && (
            <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentIdx(i => i - 1)}>
              <Text style={styles.navBtnText}>← Prev</Text>
            </TouchableOpacity>
          )}
          {!isLast ? (
            <TouchableOpacity style={[styles.navBtn, styles.navBtnPrimary]} onPress={() => setCurrentIdx(i => i + 1)}>
              <Text style={[styles.navBtnText, { color: '#fff' }]}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.navBtn, styles.voteBtn]} onPress={goToVote}>
              <Text style={[styles.navBtnText, { color: '#fff' }]}>Vote! 🗳️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 16, alignItems: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: COLORS.textLight },
  header: { fontSize: 26, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  round: { fontSize: 14, color: COLORS.textLight, marginBottom: 2 },
  counter: { fontSize: 13, color: COLORS.textLight, marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 12, width: '100%',
    elevation: 3, marginBottom: 16,
  },
  preview: {
    width: '100%', aspectRatio: 1, backgroundColor: '#FAFAFA',
    borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingHorizontal: 4 },
  playerEmoji: { fontSize: 22 },
  playerName: { fontSize: 18, fontWeight: '800', color: COLORS.text, flex: 1 },
  youBadge: {
    backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
    color: '#fff', fontSize: 12, fontWeight: '700',
  },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: COLORS.primary, width: 20 },
  navRow: { flexDirection: 'row', gap: 12, width: '100%' },
  navBtn: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  navBtnPrimary: { backgroundColor: COLORS.primary },
  voteBtn: { backgroundColor: '#7C3AED' },
  navBtnText: { fontSize: 17, fontWeight: '800', color: COLORS.text },
});
