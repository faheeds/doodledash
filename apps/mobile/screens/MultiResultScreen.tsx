import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase, subscribeToMatch } from '../utils/supabase';
import { COLORS } from '../constants/colors';
import { PROMPTS } from '../constants/prompts';

type Props = NativeStackScreenProps<RootStackParamList, 'MultiResult'>;
type VoteDrawing = { id: string; display_name: string; svg_data: string };
type VoteTally = { drawing_id: string; display_name: string; svg_data: string; most_creative: number; funniest: number; best_match: number; total: number };

export default function MultiResultScreen({ navigation, route }: Props) {
  const { matchId, roomCode, userId, username, prompt, round, totalRounds, drawings, votes, isHost } = route.params;
  const [tallies, setTallies] = useState<VoteTally[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextMatchState, setNextMatchState] = useState<any>(null);
  const isLastRound = round >= totalRounds;

  useEffect(() => {
    const load = async () => {
      const { data: voteRows } = await supabase.from('votes').select('drawing_id,category', { eq: ['match_id', matchId] });

      const map: Record<string, VoteTally> = {};
      for (const d of drawings) {
        map[d.id] = { drawing_id: d.id, display_name: d.display_name, svg_data: d.svg_data, most_creative: 0, funniest: 0, best_match: 0, total: 0 };
      }
      for (const v of (voteRows || [])) {
        if (map[v.drawing_id]) {
          (map[v.drawing_id] as any)[v.category]++;
          map[v.drawing_id].total++;
        }
      }
      setTallies(Object.values(map).sort((a, b) => b.total - a.total));
      setLoading(false);
    };
    load();

    const unsub = subscribeToMatch(matchId, (payload) => {
      setNextMatchState(payload.new);
    });
    return unsub;
  }, []);

  const handleNext = () => {
    if (isLastRound || nextMatchState?.status === 'finished') {
      navigation.navigate('Home');
    } else if (nextMatchState?.status === 'drawing') {
      navigation.replace('MultiDraw', {
        matchId, roomCode, userId, username,
        prompt: nextMatchState.current_prompt,
        round: nextMatchState.current_round,
        totalRounds, isHost: isHost ?? false,
      });
    } else {
      navigation.navigate('Home');
    }
  };

  const winner = tallies[0];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Counting votes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Round {round} Results</Text>
        <Text style={styles.prompt}>"{prompt}"</Text>

        {winner && (
          <View style={styles.winnerCard}>
            <Text style={styles.winnerLabel}>🥇 Round Winner</Text>
            <View style={styles.winnerPreview}>
              {winner.svg_data ? <SvgXml xml={winner.svg_data} width="100%" height="100%" /> : <Text style={{ fontSize: 48 }}>🎨</Text>}
            </View>
            <Text style={styles.winnerName}>{winner.display_name}</Text>
            <View style={styles.winnerVotes}>
              {winner.most_creative > 0 && <Text style={styles.votePill}>✨ ×{winner.most_creative}</Text>}
              {winner.funniest > 0 && <Text style={styles.votePill}>😂 ×{winner.funniest}</Text>}
              {winner.best_match > 0 && <Text style={styles.votePill}>🎯 ×{winner.best_match}</Text>}
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>ALL RESULTS</Text>
        {tallies.map((t, i) => (
          <View key={t.drawing_id} style={[styles.resultRow, t.display_name === username && styles.myRow]}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <View style={styles.resultThumb}>
              {t.svg_data ? <SvgXml xml={t.svg_data} width="100%" height="100%" /> : <Text>🎨</Text>}
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName}>{t.display_name}</Text>
              <Text style={styles.resultVotes}>✨{t.most_creative} 😂{t.funniest} 🎯{t.best_match}</Text>
            </View>
            <Text style={styles.totalVotes}>{t.total}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{isLastRound ? '🏠 Back to Home' : `Round ${round + 1} →`}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: COLORS.textLight },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  prompt: { fontSize: 15, color: COLORS.textLight, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
  winnerCard: { backgroundColor: '#FEF3C7', borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#FBBF24' },
  winnerLabel: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 8 },
  winnerPreview: { width: 160, height: 160, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  winnerName: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 10 },
  winnerVotes: { flexDirection: 'row', gap: 8, marginTop: 8 },
  votePill: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, fontSize: 14, fontWeight: '700', color: COLORS.text, borderWidth: 1, borderColor: '#FBBF24' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1, marginBottom: 8 },
  resultRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 10, marginBottom: 8, elevation: 1, gap: 10 },
  myRow: { borderWidth: 2, borderColor: COLORS.primary },
  rank: { fontSize: 20, fontWeight: '900', color: COLORS.textLight, width: 30 },
  resultThumb: { width: 56, height: 56, backgroundColor: '#FAFAFA', borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  resultVotes: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  totalVotes: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  nextBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  nextBtnText: { fontSize: 18, fontWeight: '900', color: '#fff' },
});
