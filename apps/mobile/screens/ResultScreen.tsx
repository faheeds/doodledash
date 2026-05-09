import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { Storage } from '../utils/storage';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

const JUDGE_URL = 'https://doodle-dash-9sxr77wip-doodle-dash-s-projects.vercel.app/api/judge';

type JudgeResult = { score: number; feedback: string; breakdown: { creativity: number; personality: number; promptMatch: number } };

export default function ResultScreen({ navigation, route }: Props) {
  const { prompt, entryId } = route.params;
  const [judging, setJudging] = useState(true);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [username, setUsername] = useState('');
  const [svgData, setSvgData] = useState('');

  useEffect(() => {
    const run = async () => {
      const [name, gallery] = await Promise.all([Storage.getUsername(), Storage.getGallery()]);
      setUsername(name || 'Player');
      const entry = gallery.find(e => e.id === entryId);
      if (entry) setSvgData(entry.svgData);

      try {
        const res = await fetch(JUDGE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, svgData: entry?.svgData || '', playerUsername: name }),
        });
        if (res.ok) {
          const data: JudgeResult = await res.json();
          setResult(data);
          if (entryId) await Storage.updateGalleryEntry(entryId, { aiScore: data.score, aiFeedback: data.feedback });
        }
      } catch (e) {
        console.warn('Judge unavailable', e);
        setResult({ score: 75, feedback: 'Great creative energy!', breakdown: { creativity: 30, personality: 30, promptMatch: 15 } });
      }
      setJudging(false);
    };
    run();
  }, []);

  const scoreColor = result ? (result.score >= 80 ? '#22C55E' : result.score >= 60 ? '#FACC15' : COLORS.primary) : COLORS.primary;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Drawing preview */}
        {svgData ? (
          <View style={styles.preview}>
            <SvgXml xml={svgData} width="100%" height="100%" />
          </View>
        ) : <View style={styles.preview}><Text style={{ fontSize: 48 }}>🎨</Text></View>}

        <Text style={styles.promptLabel}>"{prompt}"</Text>

        {/* AI Judge section */}
        <View style={[styles.judgeCard, { borderColor: scoreColor }]}>
          {judging ? (
            <View style={styles.judging}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.judgingText}>🤖 AI Judge is scoring...</Text>
            </View>
          ) : result ? (
            <>
              <Text style={[styles.score, { color: scoreColor }]}>{result.score}/100</Text>
              <Text style={styles.feedback}>"{result.feedback}"</Text>
              <View style={styles.breakdown}>
                <BreakdownBar label="Creativity" value={result.breakdown.creativity} max={40} color="#8B5CF6" />
                <BreakdownBar label="Personality" value={result.breakdown.personality} max={40} color="#F97316" />
                <BreakdownBar label="Prompt Match" value={result.breakdown.promptMatch} max={20} color="#22C55E" />
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.sparksCard}>
          <Text style={styles.sparksEmoji}>⚡</Text>
          <Text style={styles.sparksText}>+50 Sparks earned!</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnText}>🏠 Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => navigation.navigate('Play')}>
            <Text style={[styles.btnText, { color: COLORS.primary }]}>Again ✏️</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  container: { flex: 1, padding: 16 },
  preview: { width: '100%', aspectRatio: 1.5, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, elevation: 2, alignItems: 'center', justifyContent: 'center' },
  promptLabel: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },
  judgeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, elevation: 1 },
  judging: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  judgingText: { fontSize: 15, color: COLORS.textLight, fontWeight: '600' },
  score: { fontSize: 48, fontWeight: '900', textAlign: 'center' },
  feedback: { fontSize: 15, color: COLORS.text, textAlign: 'center', fontStyle: 'italic', marginVertical: 8 },
  breakdown: { marginTop: 8 },
  sparksCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderWidth: 2, borderColor: '#FACC15' },
  sparksEmoji: { fontSize: 24 },
  sparksText: { fontSize: 16, fontWeight: '800', color: '#92400E' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
  btnPrimary: { backgroundColor: COLORS.primary },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.primary },
  btnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
