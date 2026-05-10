import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Storage } from '../utils/storage';
import { SKETCHBOOKS } from '../constants/prompts';
import { supabase, ensureAnonSession } from '../utils/supabase';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;
type JudgeResult = {
  score: number;
  feedback: string;
  breakdown: { creativity: number; personality: number; promptMatch: number };
};

const JUDGE_URL = 'https://doodle-dash-pi.vercel.app/api/judge';

function sparksForScore(score: number): number {
  // 10 sparks minimum, up to 60 for a perfect score
  return Math.round(10 + (score / 100) * 50);
}

function scoreLabel(score: number): string {
  if (score >= 90) return '🔥 Incredible!';
  if (score >= 75) return '⭐ Great job!';
  if (score >= 60) return '👍 Nice one!';
  if (score >= 40) return '😊 Not bad!';
  return '🎨 Keep doodling!';
}

export default function ResultScreen({ navigation, route }: Props) {
  const { prompt, entryId, sketchbookId, level, isDailyDoodle } = route.params;

  const [judging, setJudging] = useState(true);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [svgData, setSvgData] = useState('');
  const [username, setUsername] = useState('');
  const [sparksEarned, setSparksEarned] = useState(0);
  const [levelJustCompleted, setLevelJustCompleted] = useState(false);
  const [prevBest, setPrevBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // Animation for sparks pop
  const sparksScale = useRef(new Animated.Value(0)).current;
  const levelBannerOpacity = useRef(new Animated.Value(0)).current;

  const sb = sketchbookId ? SKETCHBOOKS.find(s => s.id === sketchbookId) : null;

  useEffect(() => {
    const run = async () => {
      const [name, gallery, existingProgress] = await Promise.all([
        Storage.getUsername(),
        Storage.getGallery(),
        Storage.getLevelProgress(),
      ]);
      setUsername(name || 'Player');
      const entry = gallery.find(e => e.id === entryId);
      if (entry) setSvgData(entry.svgData);

      // Capture previous best for comparison later
      if (sketchbookId && level) {
        const key = `${sketchbookId}_${level}`;
        setPrevBest(existingProgress[key]?.bestScore || 0);
      }

      let judgeScore = 70; // fallback
      let judgeResult: JudgeResult = {
        score: 70,
        feedback: 'Great creative energy!',
        breakdown: { creativity: 28, personality: 28, promptMatch: 14 },
      };

      try {
        const res = await fetch(JUDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, svgData: entry?.svgData || '', playerUsername: name }),
        });
        if (res.ok) {
          judgeResult = await res.json();
          judgeScore = judgeResult.score;
          if (entryId) await Storage.updateGalleryEntry(entryId, { aiScore: judgeScore, aiFeedback: judgeResult.feedback });
        }
      } catch {
        // use fallback
      }

      setResult(judgeResult);

      // Award sparks
      const earned = sparksForScore(judgeScore);
      setSparksEarned(earned);
      await Storage.addSparks(earned);

      // Save level progress if in sketchbook mode
      if (sketchbookId && level) {
        const key = `${sketchbookId}_${level}`;
        const existingBest = existingProgress[key]?.bestScore || 0;
        const wasCompleted = existingProgress[key]?.completed || false;
        await Storage.setLevelComplete(sketchbookId, level, judgeScore);
        setIsNewBest(judgeScore > existingBest);
        if (!wasCompleted) setLevelJustCompleted(true);
      }

      // Save Daily Doodle to Supabase and mark today locally
      if (isDailyDoodle) {
        const todayStr = new Date().toISOString().slice(0, 10);
        await Storage.setDailyDoodleDate(todayStr);
        try {
          const userId = await ensureAnonSession();
          if (userId) {
            await supabase.from('daily_doodles').insert({
              user_id: userId,
              display_name: name || 'Anonymous',
              prompt,
              svg_data: entry?.svgData || '',
              sparks_earned: earned,
              doodle_date: todayStr,
            });
          }
        } catch {
          // Not critical — local mark is enough
        }
      }

      setJudging(false);

      // Animate sparks
      Animated.spring(sparksScale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
      if (!judging) {
        Animated.timing(levelBannerOpacity, { toValue: 1, duration: 400, useNativeDriver: true, delay: 300 }).start();
      }
    };
    run();
  }, []);

  // Trigger banner animation after judging completes
  useEffect(() => {
    if (!judging && levelJustCompleted) {
      Animated.timing(levelBannerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  }, [judging, levelJustCompleted]);

  const scoreColor = result
    ? result.score >= 80 ? '#22C55E' : result.score >= 60 ? '#FACC15' : COLORS.primary
    : COLORS.primary;

  const handlePlayAgain = () => {
    if (isDailyDoodle) {
      navigation.navigate('DailyDoodle');
    } else if (sketchbookId && level) {
      navigation.navigate('LevelSelect', { sketchbookId });
    } else {
      navigation.navigate('Play');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Drawing preview */}
        <View style={styles.preview}>
          {svgData
            ? <SvgXml xml={svgData} width="100%" height="100%" />
            : <Text style={{ fontSize: 48 }}>🎨</Text>}
        </View>

        <Text style={styles.promptLabel}>"{prompt}"</Text>

        {/* Level complete banner */}
        {levelJustCompleted && sb && !judging && (
          <Animated.View style={[styles.levelBanner, { backgroundColor: sb.color, opacity: levelBannerOpacity }]}>
            <Text style={styles.levelBannerEmoji}>{sb.emoji}</Text>
            <View>
              <Text style={styles.levelBannerTitle}>Level {level} Complete!</Text>
              <Text style={styles.levelBannerSub}>{sb.title} — Level {level} unlocked the next one</Text>
            </View>
          </Animated.View>
        )}

        {/* New best score */}
        {isNewBest && !levelJustCompleted && !judging && (
          <View style={styles.newBestBanner}>
            <Text style={styles.newBestText}>🏆 New best score for this level!</Text>
          </View>
        )}

        {/* AI Judge card */}
        <View style={[styles.judgeCard, { borderColor: judging ? '#E2E8F0' : scoreColor }]}>
          {judging ? (
            <View style={styles.judging}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.judgingText}>🤖 AI Judge is scoring your doodle...</Text>
            </View>
          ) : result ? (
            <>
              <Text style={[styles.score, { color: scoreColor }]}>{result.score}/100</Text>
              <Text style={styles.scoreLabel}>{scoreLabel(result.score)}</Text>
              <Text style={styles.feedback}>"{result.feedback}"</Text>
              <View style={styles.breakdown}>
                <BreakdownBar label="Creativity" value={result.breakdown.creativity} max={40} color="#8B5CF6" />
                <BreakdownBar label="Personality" value={result.breakdown.personality} max={40} color="#F97316" />
                <BreakdownBar label="Prompt Match" value={result.breakdown.promptMatch} max={20} color="#22C55E" />
              </View>
            </>
          ) : null}
        </View>

        {/* Sparks earned */}
        {!judging && (
          <Animated.View style={[styles.sparksCard, { transform: [{ scale: sparksScale }] }]}>
            <Text style={styles.sparksEmoji}>⚡</Text>
            <View>
              <Text style={styles.sparksMain}>+{sparksEarned} Sparks earned!</Text>
              {sketchbookId && level && (
                <Text style={styles.sparksSub}>from {sb?.title} · Level {level}</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnText}>🏠 Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handlePlayAgain}>
            <Text style={[styles.btnText, { color: COLORS.primary }]}>
              {isDailyDoodle ? '📅 Daily' : sketchbookId ? '📓 Levels' : 'Again ✏️'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <View style={bStyles.row}>
      <Text style={bStyles.label}>{label}</Text>
      <View style={bStyles.barBg}>
        <View style={[bStyles.barFill, { width: `${(value / max) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={bStyles.val}>{value}/{max}</Text>
    </View>
  );
}
const bStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  label: { fontSize: 11, color: COLORS.textLight, width: 80 },
  barBg: { flex: 1, height: 6, backgroundColor: '#F0EDE8', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  val: { fontSize: 11, color: COLORS.text, fontWeight: '700', width: 30, textAlign: 'right' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 16, gap: 12 },

  preview: {
    width: '100%', aspectRatio: 1.5, backgroundColor: '#fff',
    borderRadius: 16, overflow: 'hidden', elevation: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  promptLabel: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', fontStyle: 'italic' },

  levelBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14,
  },
  levelBannerEmoji: { fontSize: 32 },
  levelBannerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  levelBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  newBestBanner: {
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#FACC15',
  },
  newBestText: { fontSize: 14, fontWeight: '800', color: '#92400E' },

  judgeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 2, elevation: 1,
  },
  judging: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  judgingText: { fontSize: 14, color: COLORS.textLight, fontWeight: '600', flex: 1 },
  score: { fontSize: 52, fontWeight: '900', textAlign: 'center' },
  scoreLabel: { fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginTop: -4 },
  feedback: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', fontStyle: 'italic', marginVertical: 8 },
  breakdown: { marginTop: 4 },

  sparksCard: {
    backgroundColor: '#FEF3C7', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 2, borderColor: '#FACC15',
  },
  sparksEmoji: { fontSize: 28 },
  sparksMain: { fontSize: 18, fontWeight: '900', color: '#92400E' },
  sparksSub: { fontSize: 12, color: '#A16207', marginTop: 2 },

  actions: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 16 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.primary },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
