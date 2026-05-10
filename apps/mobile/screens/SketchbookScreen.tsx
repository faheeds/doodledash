import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { SKETCHBOOKS } from '../constants/prompts';
import { Storage } from '../utils/storage';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Sketchbook'>;
type Progress = Record<string, { completed: boolean; bestScore: number }>;

export default function SketchbookScreen({ navigation }: Props) {
  const [sparks, setSparks] = useState(0);
  const [progress, setProgress] = useState<Progress>({});

  const load = useCallback(async () => {
    const [sp, lp] = await Promise.all([Storage.getSparks(), Storage.getLevelProgress()]);
    setSparks(sp);
    setProgress(lp);
  }, []);

  // Reload every time we come back (e.g. after finishing a level)
  useFocusEffect(load);

  const levelsCompleted = (sbId: number) =>
    [1, 2, 3].filter(l => progress[`${sbId}_${l}`]?.completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📓 Sketchbooks</Text>
        <View style={styles.sparksChip}>
          <Text style={styles.sparksText}>⚡ {sparks}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Pick a sketchbook and work through its levels to earn ⚡ Sparks!</Text>

        {SKETCHBOOKS.map((sb) => {
          const locked = sparks < sb.unlocksAtSparks;
          const done = levelsCompleted(sb.id);
          const allDone = done === 3;

          return (
            <TouchableOpacity
              key={sb.id}
              activeOpacity={locked ? 1 : 0.85}
              style={[styles.card, locked && styles.cardLocked, { borderColor: locked ? '#E2E8F0' : sb.color }]}
              onPress={() => {
                if (!locked) navigation.navigate('LevelSelect', { sketchbookId: sb.id });
              }}
            >
              {/* Left accent stripe + emoji */}
              <View style={[styles.accent, { backgroundColor: locked ? '#CBD5E1' : sb.color }]}>
                <Text style={styles.accentEmoji}>{locked ? '🔒' : sb.emoji}</Text>
              </View>

              {/* Main content */}
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={[styles.sbTitle, locked && styles.lockedText]}>{sb.title}</Text>
                  {allDone && !locked && (
                    <View style={[styles.doneBadge, { backgroundColor: sb.color }]}>
                      <Text style={styles.doneBadgeText}>✓ Done</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.sbDesc, locked && styles.lockedDesc]} numberOfLines={2}>
                  {locked ? `Unlock at ⚡ ${sb.unlocksAtSparks} sparks` : sb.description}
                </Text>

                {/* Level dots */}
                {!locked && (
                  <View style={styles.dotsRow}>
                    {[1, 2, 3].map(l => (
                      <View
                        key={l}
                        style={[
                          styles.dot,
                          progress[`${sb.id}_${l}`]?.completed
                            ? { backgroundColor: sb.color }
                            : { backgroundColor: '#E2E8F0' },
                        ]}
                      />
                    ))}
                    <Text style={styles.dotsLabel}>{done}/3 levels complete</Text>
                  </View>
                )}

                {/* Sparks to unlock bar */}
                {locked && (
                  <View style={styles.lockRow}>
                    <View style={styles.lockBarBg}>
                      <View
                        style={[
                          styles.lockBarFill,
                          { width: `${Math.min((sparks / sb.unlocksAtSparks) * 100, 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.lockBarLabel}>{sparks}/{sb.unlocksAtSparks}</Text>
                  </View>
                )}
              </View>

              {!locked && <Text style={styles.chevron}>›</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Tip card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <Text style={styles.tipText}>
            Each level has 10 drawing prompts. Finish a level to earn bonus ⚡ Sparks and unlock the next one!
          </Text>
        </View>
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
  intro: { fontSize: 14, color: COLORS.textLight, marginBottom: 4, lineHeight: 20 },

  card: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: 20, borderWidth: 2,
    overflow: 'hidden', elevation: 2,
    minHeight: 110,
  },
  cardLocked: { opacity: 0.75 },

  accent: {
    width: 70, alignItems: 'center', justifyContent: 'center',
  },
  accentEmoji: { fontSize: 34 },

  cardContent: { flex: 1, padding: 14, justifyContent: 'center', gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sbTitle: { fontSize: 17, fontWeight: '900', color: COLORS.text, flex: 1 },
  lockedText: { color: '#94A3B8' },
  doneBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  doneBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  sbDesc: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 },
  lockedDesc: { color: '#94A3B8' },

  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotsLabel: { fontSize: 12, color: COLORS.textLight, marginLeft: 2 },

  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  lockBarBg: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  lockBarFill: { height: '100%', backgroundColor: '#94A3B8', borderRadius: 3 },
  lockBarLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', minWidth: 50 },

  chevron: { fontSize: 28, color: '#CBD5E1', alignSelf: 'center', paddingRight: 14 },

  tipCard: {
    backgroundColor: '#EFF6FF', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4,
  },
  tipEmoji: { fontSize: 20 },
  tipText: { flex: 1, fontSize: 13, color: '#3B82F6', lineHeight: 20, fontWeight: '500' },
});
