import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { SKETCHBOOKS, getPromptsForLevel } from '../constants/prompts';
import { Storage } from '../utils/storage';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'LevelSelect'>;
type Progress = Record<string, { completed: boolean; bestScore: number }>;

const LEVEL_NAMES = ['Warm-Up', 'Getting There', 'Master'];
const LEVEL_EMOJIS = ['🌱', '🔥', '⭐'];

export default function LevelSelectScreen({ navigation, route }: Props) {
  const { sketchbookId } = route.params;
  const sb = SKETCHBOOKS.find(s => s.id === sketchbookId)!;

  const [sparks, setSparks] = useState(0);
  const [progress, setProgress] = useState<Progress>({});

  const load = useCallback(async () => {
    const [sp, lp] = await Promise.all([Storage.getSparks(), Storage.getLevelProgress()]);
    setSparks(sp);
    setProgress(lp);
  }, []);

  useFocusEffect(load);

  const startLevel = (level: number) => {
    const levelPrompts = getPromptsForLevel(sketchbookId, level);
    if (levelPrompts.length === 0) return;
    const prompt = levelPrompts[Math.floor(Math.random() * levelPrompts.length)];
    navigation.navigate('Draw', { prompt, sketchbookId, level });
  };

  // A level is playable if previous level is done (or it's level 1)
  const isPlayable = (level: number): boolean => {
    if (level === 1) return true;
    return !!(progress[`${sketchbookId}_${level - 1}`]?.completed);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: sb.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{sb.emoji}</Text>
          <Text style={styles.headerTitle}>{sb.title}</Text>
          <Text style={styles.headerDesc}>{sb.description}</Text>
        </View>
        <View style={styles.sparksChip}>
          <Text style={styles.sparksText}>⚡ {sparks}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>CHOOSE A LEVEL</Text>

        {[1, 2, 3].map((level) => {
          const key = `${sketchbookId}_${level}`;
          const levelProgress = progress[key];
          const done = levelProgress?.completed ?? false;
          const bestScore = levelProgress?.bestScore ?? 0;
          const playable = isPlayable(level);
          const levelPrompts = getPromptsForLevel(sketchbookId, level);

          return (
            <TouchableOpacity
              key={level}
              activeOpacity={playable ? 0.85 : 1}
              style={[
                styles.levelCard,
                done && { borderColor: sb.color },
                !playable && styles.levelLocked,
              ]}
              onPress={() => playable && startLevel(level)}
            >
              <View style={[styles.levelBadge, { backgroundColor: playable ? sb.color : '#CBD5E1' }]}>
                <Text style={styles.levelBadgeText}>
                  {!playable ? '🔒' : done ? '✓' : LEVEL_EMOJIS[level - 1]}
                </Text>
              </View>

              <View style={styles.levelInfo}>
                <View style={styles.levelTop}>
                  <Text style={[styles.levelNum, !playable && styles.lockedText]}>Level {level}</Text>
                  <Text style={[styles.levelName, !playable && styles.lockedText]}>{LEVEL_NAMES[level - 1]}</Text>
                </View>
                <Text style={[styles.levelMeta, !playable && styles.lockedText]}>
                  {levelPrompts.length} drawing prompts
                </Text>
                {done && (
                  <View style={styles.doneRow}>
                    <View style={[styles.doneBadge, { backgroundColor: sb.color + '22', borderColor: sb.color }]}>
                      <Text style={[styles.doneText, { color: sb.color }]}>✓ Completed</Text>
                    </View>
                    {bestScore > 0 && (
                      <Text style={styles.bestScore}>Best: {bestScore} pts</Text>
                    )}
                  </View>
                )}
                {!playable && (
                  <Text style={styles.lockHint}>Complete Level {level - 1} first</Text>
                )}
              </View>

              {playable && (
                <TouchableOpacity
                  style={[styles.playBtn, { backgroundColor: sb.color }]}
                  onPress={() => startLevel(level)}
                >
                  <Text style={styles.playBtnText}>{done ? '↺ Play\nAgain' : '▶ Start'}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        {/* How scoring works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            Each level gives you a random prompt from a pool of 10. Draw it in 60 seconds, earn ⚡ Sparks based on your score, and unlock the next level!
          </Text>
          <View style={styles.rewardRow}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>⚡</Text>
              <Text style={styles.rewardLabel}>Sparks</Text>
              <Text style={styles.rewardVal}>10–50</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>🎯</Text>
              <Text style={styles.rewardLabel}>Score</Text>
              <Text style={styles.rewardVal}>0–100</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>🏆</Text>
              <Text style={styles.rewardLabel}>Best</Text>
              <Text style={styles.rewardVal}>Saved</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 20, color: '#fff', fontWeight: '900' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEmoji: { fontSize: 36, marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2, textAlign: 'center' },
  sparksChip: { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  sparksText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  scroll: { padding: 20, gap: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1, marginBottom: 4 },

  levelCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 18, borderWidth: 2, borderColor: '#E2E8F0',
    padding: 14, gap: 14, elevation: 1,
  },
  levelLocked: { opacity: 0.6 },

  levelBadge: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  levelBadgeText: { fontSize: 24 },

  levelInfo: { flex: 1, gap: 4 },
  levelTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelNum: { fontSize: 17, fontWeight: '900', color: COLORS.text },
  levelName: { fontSize: 13, color: COLORS.textLight, fontWeight: '600' },
  lockedText: { color: '#94A3B8' },
  levelMeta: { fontSize: 12, color: COLORS.textLight },

  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  doneBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1 },
  doneText: { fontSize: 11, fontWeight: '800' },
  bestScore: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },

  lockHint: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

  playBtn: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', minWidth: 68,
  },
  playBtnText: { fontSize: 14, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 18 },

  infoCard: {
    backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4, gap: 10,
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  infoText: { fontSize: 13, color: COLORS.textLight, lineHeight: 20 },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  rewardItem: { alignItems: 'center', gap: 2 },
  rewardEmoji: { fontSize: 22 },
  rewardLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
  rewardVal: { fontSize: 14, fontWeight: '900', color: COLORS.text },
});
