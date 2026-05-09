import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import DrawingCanvas, { Stroke } from '../components/canvas/DrawingCanvas';
import Toolbar from '../components/canvas/Toolbar';
import CountdownTimer from '../components/canvas/CountdownTimer';
import { useDrawing } from '../hooks/useDrawing';
import { useTimer } from '../hooks/useTimer';
import { supabase } from '../utils/supabase';
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
      const { data: bots } = await supabase
        .from('match_players')
        .select('display_name')
        .eq('match_id', matchId)
        .eq('is_bot', true);

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
    addStroke({ id: 'magic-' + Date.now(), points: 'M 80 80 L 120 80 L 100 40 Z', color, size: 3 });
  }, [magicStampUsed, color, addStroke]);

  const handleDone = () => Alert.alert('Submit drawing?', 'Are you done?', [
    { text: 'Keep Drawing', style: 'cancel' },
    { text: 'Submit!', onPress: submit },
  ]);

  // Non-host: listen for host moving to voting
  useEffect(() => {
    const ch = supabase
      .channel(`multidraw-${matchId}-${round}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}`,
      }, (payload) => {
        const match = payload.new as any;
        if (match.status === 'voting') {
          navigation.replace('Reveal', { matchId, roomCode, userId, username, prompt, round, totalRounds, isHost });
        }
      })
      .subscribe();
    return () => { ch.unsubscribe(); };
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
