import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Animated, ScrollView,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Storage } from '../utils/storage';
import { haptics } from '../utils/haptics';
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
  return Math.round(10 + (score / 100) * 50);
}

function scoreLabel(score: number): string {
  if (score >= 90) return '🔥 Incredible!';
  if (score >= 75) return '⭐ Great job!';
  if (score >= 60) return '👍 Nice one!';
  if (score >= 40) return '😊 Not bad!';
  return '🎨 Keep doodling!';
}

// Confetti particle colors
const CONFETTI_COLORS = ['#F97316', '#8B5CF6', '#22C55E', '#FACC15', '#EC4899', '#3B82F6', '#EF4444', '#14B8A6'];

function Confetti({ score }: { score: number }) {
  const particles = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      anim: new Animated.Value(0),
      angle: (i / 8) * Math.PI * 2,
      color: CONFETTI_COLORS[i],
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map(p =>
      Animated.spring(p.anim, { toValue: 1, useNativeDriver: true, friction: 4, tension: 40 })
    );
    Animated.stagger(40, animations).start();
  }, []);

  const radius = score >= 80 ? 90 : score >= 60 ? 70 : 50;

  return (
    <View style={confettiStyles.container} pointerEvents="none">
      {particles.map((p, i) => {
        const tx = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * radius] });
        const ty = p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * radius] });
        const scale = p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.3, 1] });
        const opacity = p.anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.7] });
        return (
          <Animated.View
            key={i}
            style={[
              confettiStyles.dot,
              { backgroundColor: p.color },
              { opacity, transform: [{ translateX: tx }, { translateY: ty }, { scale }] },
            ]}
          />
        );
      })}
    </View>
  );
}
const confettiStyles = StyleSheet.create({
  container: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: '50%', left: '50%' },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
});

export default function ResultScreen({ navigation, route }: Props) {
  const { prompt, entryId, sketchbookId, level, isDailyDoodle } = route.params;

  const [judging, setJudging] = useState(true);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [svgData, setSvgData] = useState('');
  const [username, setUsername] = useState('');
  const [sparksEarned, setSparksEarned] = useState(0);
  const [levelJustCompleted, setLevelJustCompleted] = useState(false);
  const [isNewBest, setIsNewBest] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animated count-up score display
  const [displayScore, setDisplayScore] = useState(0);
  const countIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation refs
  const sparksScale = useRef(new Animated.Value(0)).current;
  const levelBannerOpacity = useRef(new Animated.Value(0)).current;
  const scoreShake = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  const sb = sketchbookId ? SKETCHBOOKS.find(s => s.id === sketchbookId) : null;

  // Fade in the whole screen
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  const revealScore = (finalScore: number) => {
    // Count up from 0 to score over ~1.2s
    const duration = 1200;
    const steps = 40;
    const interval = duration / steps;
    let current = 0;

    countIntervalRef.current = setInterval(() => {
      current += finalScore / steps;
      const rounded = Math.min(Math.round(current), finalScore);
      setDisplayScore(rounded);

      // Tick haptic every 10 points
      if (Math.round(current) % 10 === 0 && Math.round(current) > 0) {
        haptics.selection();
      }

      if (rounded >= finalScore) {
        if (countIntervalRef.current) clearInterval(countIntervalRef.current);
        // Final reveal haptic
        if (finalScore >= 80) haptics.success();
        else if (finalScore >= 60) haptics.medium();
        else haptics.light();

        // Show confetti for good scores
        if (finalScore >= 60) setShowConfetti(true);

        // Shake the score for high scores
        if (finalScore >= 85) {
          Animated.sequence([
            Animated.timing(scoreShake, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(scoreShake, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(scoreShake, { toValue: 5, duration: 60, useNativeDriver: true }),
            Animated.timing(scoreShake, { toValue: -5, duration: 60, useNativeDriver: true }),
            Animated.timing(scoreShake, { toValue: 0, duration: 60, useNativeDriver: true }),
          ]).start();
        }
      }
    }, interval);
  };

  useEffect(() => {
    return () => { if (countIntervalRef.current) clearInterval(countIntervalRef.current); };
  }, []);

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
          const j = await res.json();
          judgeResult = j;
          if (entryId) await Storage.updateGalleryEntry(entryId, { aiScore: j.score, aiFeedback: j.feedback });
        }
      } catch {}

      setResult(judgeResult);

      const earned = sparksForScore(judgeResult.score);
      setSparksEarned(earned);
      await Storage.addSparks(earned);

      if (sketchbookId && level) {
        const key = `${sketchbookId}_${level}`;
        const prevBest = existingProgress[key]?.bestScore || 0;
        const wasCompleted = existingProgress[key]?.completed || false;
        await Storage.setLevelComplete(sketchbookId, level, judgeResult.score);
        setIsNewBest(judgeResult.score > prevBest);
        if (!wasCompleted) {
          setLevelJustCompleted(true);
          haptics.heavy();
        }
      }

      if (isDailyDoodle) {
        const todayStr = new Date().toISOString().slice(0, 10);
        await Storage.setDailyDoodleDate(todayStr);
        try {
          const userId = await ensureAnonSession();
          if (userId) {
            await supabase.from('daily_doodles').insert({
              user_id: userId, display_name: name || 'Anonymous',
              prompt, svg_data: entry?.svgData || '',
              sparks_earned: earned, doodle_date: todayStr,
            });
          }
        } catch {}
      }

      setJudging(false);

      // Start score count-up and sparks pop
      revealScore(judgeResult.score);
      Animated.spring(sparksScale, { toValue: 1, useNativeDriver: true, friction: 4, delay: 1400 }).start();
    };
    run();
  }, []);

  useEffect(() => {
    if (!judging && levelJustCompleted) {
      Animated.timing(levelBannerOpacity, { toValue: 1, duration: 500, useNativeDriver: true, delay: 200 }).start();
    }
  }, [judging, levelJustCompleted]);

  const scoreColor = result
    ? result.score >= 80 ? '#22C55E' : result.score >= 60 ? '#FACC15' : COLORS.primary
    : COLORS.primary;

  const handlePlayAgain = () => {
    if (isDailyDoodle) navigation.navigate('DailyDoodle');
    else if (sketchbookId && level) navigation.navigate('LevelSelect', { sketchbookId });
    else navigation.navigate('Play');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeIn }}
      >
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
              <Text style={styles.levelBannerSub}>{sb.title} — keep going!</Text>
            </View>
          </Animated.View>
        )}

        {/* New best */}
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
              {/* Animated score */}
              <View style={styles.scoreContainer}>
                <Animated.Text
                  style={[styles.score, { color: scoreColor, transform: [{ translateX: scoreShake }] }]}
                >
                  {displayScore}
                </Animated.Text>
                <Text style={[styles.scoreOutOf, { color: scoreColor }]}>/100</Text>
                {showConfetti && <Confetti score={result.score} />}
              </View>
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
                <Text style={styles.sparksSub}>{sb?.title} · Level {level}</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => { haptics.light(); navigation.navigate('Home'); }}
          >
            <Text style={styles.btnText}>🏠 Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => { haptics.light(); handlePlayAgain(); }}
          >
            <Text style={[styles.btnText, { color: COLORS.primary }]}>
              {isDailyDoodle ? '📅 Daily' : sketchbookId ? '📓 Levels' : 'Again ✏️'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function BreakdownBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: (value / max) * 100, duration: 800, useNativeDriver: false, delay: 200 }).start();
  }, [value]);
  const width = widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={bStyles.row}>
      <Text style={bStyles.label}>{label}</Text>
      <View style={bStyles.barBg}>
        <Animated.View style={[bStyles.barFill, { width, backgroundColor: color }]} />
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

  scoreContainer: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
    marginBottom: 2, position: 'relative', minHeight: 70,
  },
  score: { fontSize: 64, fontWeight: '900', lineHeight: 70 },
  scoreOutOf: { fontSize: 22, fontWeight: '700', marginBottom: 8, marginLeft: 2 },

  scoreLabel: { fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginTop: 2 },
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
