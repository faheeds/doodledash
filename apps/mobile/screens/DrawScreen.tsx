import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import DrawingCanvas, { Stroke } from '../components/canvas/DrawingCanvas';
import Toolbar from '../components/canvas/Toolbar';
import CountdownTimer from '../components/canvas/CountdownTimer';
import { useDrawing } from '../hooks/useDrawing';
import { useTimer } from '../hooks/useTimer';
import { Storage } from '../utils/storage';
import { GAME_CONSTANTS } from '../constants/game';
import { COLORS } from '../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Draw'>;

// Build a minimal SVG string from strokes for storage
function strokesToSVG(strokes: Stroke[], w = 300, h = 300, bg = '#FFFFFF'): string {
  const lastFill = [...strokes].reverse().find(s => s.isFill);
  const bgColor = lastFill ? lastFill.fillColor! : bg;
  const paths = strokes
    .filter(s => !s.isFill && s.points)
    .map(s => `<path d="${s.points}" stroke="${s.color}" stroke-width="${s.size}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${bgColor}"/>${paths}</svg>`;
}

export default function DrawScreen({ navigation, route }: Props) {
  const { prompt } = route.params;
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(14);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [magicStampUsed, setMagicStampUsed] = useState(false);
  const { strokes, addStroke, updateStrokes, undo, canUndo } = useDrawing();
  const strokesRef = useRef(strokes);
  React.useEffect(() => { strokesRef.current = strokes; }, [strokes]);

  const handleTimeUp = useCallback(async () => {
    const entryId = Date.now().toString();
    const svgData = strokesToSVG(strokesRef.current);
    await Storage.addToGallery({ id: entryId, prompt, svgData, createdAt: new Date().toISOString() });
    await Storage.addSparks(50);
    navigation.replace('Result', { prompt, entryId });
  }, [prompt, navigation]);

  const { seconds, start } = useTimer(GAME_CONSTANTS.DRAW_TIME_SECONDS, handleTimeUp);
  React.useEffect(() => { start(); }, []);

  const handleMagicStamp = useCallback(() => {
    if (magicStampUsed) return;
    setMagicStampUsed(true);
    Alert.alert('✨ Magic Stamp!', 'A sparkle was added to your drawing!');
    addStroke({ id: 'magic-' + Date.now(), points: 'M 80 80 L 120 80 L 100 40 Z M 100 120 L 80 160 L 120 160 Z', color, size: 3 });
  }, [magicStampUsed, color, addStroke]);

  const handleDone = () => Alert.alert('Submit?', "Done drawing?", [
    { text: 'Keep Drawing', style: 'cancel' },
    { text: 'Submit! 🎨', onPress: handleTimeUp },
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.promptBox}>
          <Text style={styles.promptLabel}>DRAW:</Text>
          <Text style={styles.promptText} numberOfLines={2}>{prompt}</Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Done ✓</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.timerRow}>
        <CountdownTimer seconds={seconds} totalSeconds={GAME_CONSTANTS.DRAW_TIME_SECONDS} onTimeUp={handleTimeUp} />
      </View>
      <View style={styles.canvasContainer}>
        <DrawingCanvas color={color} brushSize={brushSize} tool={tool} strokes={strokes} onStrokesChange={updateStrokes} onNewStroke={addStroke} />
      </View>
      <Toolbar selectedColor={color} selectedBrushSize={brushSize} selectedTool={tool} onColorSelect={setColor} onBrushSizeSelect={setBrushSize} onToolSelect={setTool} onUndo={undo} canUndo={canUndo} magicStampUsed={magicStampUsed} onMagicStamp={handleMagicStamp} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0EDE8', gap: 8 },
  promptBox: { flex: 1 },
  promptLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  promptText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  doneBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  timerRow: { backgroundColor: '#fff', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0EDE8' },
  canvasContainer: { flex: 1, margin: 8, borderRadius: 12, overflow: 'hidden', elevation: 2 },
});
