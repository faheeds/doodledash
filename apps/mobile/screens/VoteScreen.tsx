import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Vote'>;

type VoteDrawing = { id: string; display_name: string; svg_data: string };
const CATEGORIES = [
  { key: 'most_creative', label: '✨ Most Creative', color: '#8B5CF6' },
  { key: 'funniest', label: '😂 Funniest', color: '#F59E0B' },
  { key: 'best_match', label: '🎯 Best Match', color: '#22C55E' },
] as const;

type CategoryKey = typeof CATEGORIES[number]['key'];

export default function VoteScreen({ navigation, route }: Props) {
  const { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost, drawings } = route.params;
  const [votes, setVotes] = useState<Record<CategoryKey, string | null>>({
    most_creative: null, funniest: null, best_match: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('most_creative');

  const myDrawingId = drawings.find(d => d.display_name === username)?.id ?? null;

  const vote = (drawingId: string) => {
    if (drawingId === myDrawingId) return; // can't vote for yourself
    setVotes(v => ({ ...v, [activeCategory]: drawingId }));
  };

  const allVotesCast = CATEGORIES.every(c => votes[c.key] !== null);

  const submitVotes = async () => {
    setSubmitting(true);

    // Submit human player's votes
    for (const cat of CATEGORIES) {
      if (votes[cat.key]) {
        try {
          await supabase.from('votes').upsert({
            match_id: matchId,
            voter_id: userId,
            drawing_id: votes[cat.key],
            round_number: round,
            category: cat.key,
          }, { onConflict: 'match_id,voter_id,category,round_number' });
        } catch {}
      }
    }

    if (isHost) {
      // Bot votes are synthesised deterministically in MultiResultScreen
      // (votes.voter_id FKs to users(id) — bots have no users row, so we skip DB insert)

      // Advance round or finish match
      try {
        await supabase.from('matches').update({
          status: round < totalRounds ? 'drawing' : 'finished',
          current_round: round < totalRounds ? round + 1 : round,
          current_prompt: round < totalRounds ? pickNextPrompt() : null,
        }).eq('id', matchId);
      } catch {}
    }

    navigation.replace('MultiResult', {
      matchId, roomCode, userId, username, prompt, round, totalRounds,
      drawings, votes,
    });
  };

  function pickNextPrompt(): string {
    const { PROMPTS } = require('../constants/prompts');
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  }

  const activeCatInfo = CATEGORIES.find(c => c.key === activeCategory)!;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🗳️ Vote!</Text>
        <Text style={styles.subtitle}>Round {round}/{totalRounds} · "{prompt}"</Text>
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.tab, activeCategory === cat.key && { backgroundColor: cat.color }]}
            onPress={() => setActiveCategory(cat.key)}>
            <Text style={[styles.tabText, activeCategory === cat.key && { color: '#fff' }]}>
              {cat.label}
            </Text>
            {votes[cat.key] && <View style={[styles.tabDot, { backgroundColor: cat.color }]} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.instruction}>
        Pick the <Text style={{ color: activeCatInfo.color, fontWeight: '900' }}>{activeCatInfo.label}</Text>
      </Text>

      <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent}>
        {drawings.map(d => {
          const isOwn = d.display_name === username;
          const isSelected = votes[activeCategory] === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              style={[
                styles.drawingCard,
                isSelected && { borderColor: activeCatInfo.color, borderWidth: 4 },
                isOwn && styles.ownCard,
              ]}
              onPress={() => vote(d.id)}
              disabled={isOwn}>
              <View style={styles.thumb}>
                {d.svg_data ? (
                  <SvgXml xml={d.svg_data} width="100%" height="100%" />
                ) : <Text style={{ fontSize: 32 }}>🎨</Text>}
              </View>
              <Text style={styles.drawingName} numberOfLines={1}>{d.display_name}</Text>
              {isOwn && <Text style={styles.ownLabel}>(yours)</Text>}
              {isSelected && (
                <View style={[styles.selectedBadge, { backgroundColor: activeCatInfo.color }]}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.voteStatus}>
          {CATEGORIES.filter(c => votes[c.key]).length}/{CATEGORIES.length} votes cast
        </Text>
        <TouchableOpacity
          style={[styles.submitBtn, !allVotesCast && styles.submitBtnDisabled]}
          onPress={submitVotes}
          disabled={!allVotesCast || submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>{allVotesCast ? 'Submit Votes ✅' : 'Pick all 3 categories'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 16, paddingBottom: 4 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textLight },
  tabs: { paddingLeft: 12, marginBottom: 4 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 8,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  tabDot: { width: 8, height: 8, borderRadius: 4 },
  instruction: { fontSize: 16, color: COLORS.textLight, paddingHorizontal: 16, marginBottom: 8 },
  grid: { flex: 1 },
  gridContent: { flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  drawingCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 8,
    borderWidth: 2, borderColor: 'transparent', elevation: 2,
  },
  ownCard: { opacity: 0.5 },
  thumb: {
    width: '100%', aspectRatio: 1, backgroundColor: '#FAFAFA',
    borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  drawingName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 6, textAlign: 'center' },
  ownLabel: { fontSize: 11, color: COLORS.textLight, textAlign: 'center' },
  selectedBadge: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  selectedText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  footer: { padding: 12, gap: 8 },
  voteStatus: { textAlign: 'center', fontSize: 13, color: COLORS.textLight },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#D1D5DB' },
  submitText: { fontSize: 17, fontWeight: '800', color: '#fff' },
});
