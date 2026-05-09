import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCanvasRef } from '@shopify/react-native-skia';
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

export default function DrawScreen({ navigation, route }: Props) {
  const { prompt } = route.params;
  const canvasRef = useCanvasRef();
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(14);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [magicStampUsed, setMagicStampUsed] = useState(false);
  const { strokes, addStroke, updateStrokes, undo, canUndo } = useDrawing();

  const handleTimeUp = useCallback(async () => {
    try {
      const image = canvasRef.current?.makeImageSnapshot();
      if (image) {
        const data = image.encodeToBase64();
        await Storage.addToGallery({ id: Date.now().toString(), prompt, imageUri: `data:image/png;base64,${data}`, createdAt: new Date().toISOString() });
        await Storage.addSparks(50);
      }
    } catch (e) { console.warn('Save failed', e); }
    navigation.replace('Result', { prompt });
  }, [prompt, canvasRef, navigation]);

  const { seconds, start } = useTimer(GAME_CONSTANTS.DRAW_TIME_SECONDS, handleTimeUp);
  React.useEffect(() => { start(); }, []);

  const handleMagicStamp = useCallback(() => {
    if (magicStampUsed) return;
    setMagicStampUsed(true);
    Alert.alert('✨ Magic Stamp!', 'A sparkle was added to your drawing!');
  }, [magicStampUsed]);

  const handleDone = () => Alert.alert('Submit?', "Done drawing?", [
    { text: 'Keep Drawing', style: 'cancel' },
    { text: 'Submit! 🎨', onPress: handleTimeUp },
  ]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.promptBox}>
          <Text style={styles.promptLabel}>Draw:</Text>
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
  promptLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  promptText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  doneBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  timerRow: { backgroundColor: '#fff', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0EDE8' },
  canvasContainer: { flex: 1, margin: 8, borderRadius: 12, overflow: 'hidden', elevation: 2 },
});
