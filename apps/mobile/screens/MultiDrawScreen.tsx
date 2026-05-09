import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import DrawingCanvas, { Stroke } from '../components/canvas/DrawingCanvas';
import Toolbar from '../components/canvas/Toolbar';
import CountdownTimer from '../components/canvas/CountdownTimer';
import { useDrawing } from '../hooks/useDrawing';
import { useTimer } from '../hooks/useTimer';
import { supabase, subscribeToMatch } from '../utils/supabase';
import { COLORS } from '../constants/colors';
import { PROMPTS } from '../constants/prompts';
import { GAME_CONSTANTS } from '../constants/game';

type Props = NativeStackScreenProps<RootStackParamList, 'MultiDraw'>;

function strokesToSVG(strokes: Stroke[], w = 300, h = 300, bg = '#FFFFFF'): string {
  const lastFill = [...strokes].reverse().find(s => s.isFill);
  const bgColor = lastFill ? lastFill.fillColor! : bg;
  const paths = strokes
    .filter(s => !s.isFill && s.points)
    .map(s => `<path d="${s.points}" stroke="${s.color}" stroke-width="${s.size}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/>${paths}</svg>`;
}

function botSVG(prompt: string): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  const c = colors[Math.floor(Math.random() * colors.length)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#FAFAFA"/><circle cx="150" cy="140" r="${50 + Math.random() * 30}" stroke="${c}" stroke-width="5" fill="${c}33"/><text x="150" y="260" text-anchor="middle" font-size="11" fill="#999">${prompt.slice(0, 25)}</text></svg>`;
}


const MAGIC_STAMPS = [
  // 5-pointed star
  'M 150 100 L 161 137 L 200 137 L 169 160 L 181 197 L 150 175 L 119 197 L 131 160 L 100 137 L 139 137 Z',
  // Heart
  'M 150 195 C 100 170 82 140 82 118 C 82 95 100 82 122 90 C 134 95 143 106 150 118 C 157 106 166 95 178 90 C 200 82 218 95 218 118 C 218 140 200 170 150 195 Z',
  // Lightning bolt
  'M 165 90 L 133 152 L 157 152 L 137 215 L 177 147 L 152 147 Z',
  // Crown
  'M 88 195 L 88 140 L 113 163 L 150 112 L 187 163 L 212 140 L 212 195 Z',
  // Diamond
  'M 150 95 L 205 150 L 150 205 L 95 150 Z',
  // 8-pointed burst
  'M 150 95 L 161 133 L 198 115 L 177 145 L 210 150 L 177 155 L 198 185 L 161 167 L 150 205 L 139 167 L 102 185 L 123 155 L 90 150 L 123 145 L 102 115 L 139 133 Z',
  // Arrow / rocket
  'M 150 90 L 195 148 L 168 148 L 168 210 L 132 210 L 132 148 L 105 148 Z',
  // Flower (4-petal)
  'M 150 108 C 168 108 182 122 182 140 C 182 152 176 158 165 160 C 176 162 182 168 182 180 C 182 198 168 212 150 212 C 132 212 118 198 118 180 C 118 168 124 162 135 160 C 124 158 118 152 118 140 C 118 122 132 108 150 108 Z',
];

function getRandomStamp(): string {
  return MAGIC_STAMPS[Math.floor(Math.random() * MAGIC_STAMPS.length)];
}

export default function MultiDrawScreen({ navigation, route }: Props) {
  const { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost } = route.params;
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(14);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [magicStampUsed, setMagicStampUsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { strokes, addStroke, updateStrokes, undo, canUndo } = useDrawing();
  const strokesRef = useRef(strokes);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  const submittedRef = useRef(false);

  const submit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);

    const svgData = strokesToSVG(strokesRef.current);

    await supabase.from('drawings').insert({
      match_id: matchId,
      player_id: userId,
      round_number: round,
      prompt,
      svg_data: svgData,
    });

    if (isHost) {
      // Add bot drawings
      const { data: bots } = await supabase.from('match_players').select('display_name', {
        eqs: [['match_id', matchId], ['is_bot', true]],
      });

      for (const _bot of (bots || [])) {
        await supabase.from('drawings').insert({
          match_id: matchId,
          player_id: null,
          round_number: round,
          prompt,
          svg_data: botSVG(prompt),
          ai_score: Math.floor(Math.random() * 40) + 20,
          ai_feedback: 'Bot did their best!',
        });
      }

      // Move to voting
      await supabase.from('matches').update({ status: 'voting' }).eq('id', matchId);
    }
  }, [matchId, userId, round, prompt, isHost]);

  const { seconds, start } = useTimer(GAME_CONSTANTS.DRAW_TIME_SECONDS, submit);
  useEffect(() => { start(); }, []);

  const handleMagicStamp = useCallback(() => {
    if (magicStampUsed) return;
    setMagicStampUsed(true);
    const stamp = getRandomStamp();
    addStroke({ id: 'magic-' + Date.now(), points: stamp, color, size: 3, fillColor: color, isFill: false });
  }, [magicStampUsed, color, addStroke]);

  const handleDone = () => Alert.alert('Submit drawing?', 'Are you done?', [
    { text: 'Keep Drawing', style: 'cancel' },
    { text: 'Submit!', onPress: submit },
  ]);

  // Listen for host moving to voting (polling-based)
  useEffect(() => {
    const unsub = subscribeToMatch(matchId, (payload) => {
      const match = payload.new as any;
      if (match.status === 'voting') {
        navigation.replace('Reveal', { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost });
      }
    });
    return unsub;
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.promptBox}>
          <Text style={styles.roundLabel}>Round {round}/{totalRounds} · {roomCode}</Text>
          <Text style={styles.promptText} numberOfLines={2}>{prompt}</Text>
        </View>
        <TouchableOpacity style={[styles.doneBtn, submitted && styles.doneBtnDone]} onPress={handleDone} disabled={submitted}>
          <Text style={styles.doneBtnText}>{submitted ? 'Submitted!' : 'Done'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.timerRow}>
        <CountdownTimer seconds={seconds} totalSeconds={GAME_CONSTANTS.DRAW_TIME_SECONDS} onTimeUp={submit} />
      </View>
      <View style={styles.canvasContainer}>
        <DrawingCanvas
          color={color} brushSize={brushSize} tool={tool}
          strokes={strokes} onStrokesChange={updateStrokes} onNewStroke={addStroke}
        />
      </View>
      <Toolbar
        selectedColor={color} selectedBrushSize={brushSize} selectedTool={tool}
        onColorSelect={setColor} onBrushSizeSelect={setBrushSize} onToolSelect={setTool}
        onUndo={undo} canUndo={canUndo}
        magicStampUsed={magicStampUsed} onMagicStamp={handleMagicStamp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  promptBox: { flex: 1 },
  roundLabel: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', marginBottom: 2 },
  promptText: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  doneBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  doneBtnDone: { backgroundColor: '#22C55E' },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  timerRow: { paddingHorizontal: 12, marginVertical: 6 },
  canvasContainer: { flex: 1, marginHorizontal: 4 },
});
