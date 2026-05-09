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
    const stamp = getRandomStamp();
    addStroke({ id: 'magic-' + Date.now(), points: stamp, color, size: 3, fillColor: color, isFill: false });
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
