import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCanvasRef } from '@shopify/react-native-skia';
import DrawingCanvas, { Stroke } from '../components/canvas/DrawingCanvas';
import Toolbar from '../components/canvas/Toolbar';
import CountdownTimer from '../components/canvas/CountdownTimer';
import { useDrawing } from '../hooks/useDrawing';
import { useTimer } from '../hooks/useTimer';
import { Storage } from '../utils/storage';
import { GAME_CONSTANTS } from '../../../packages/shared';
import { COLORS } from '../constants/colors';

export default function DrawScreen() {
  const { prompt } = useLocalSearchParams<{ prompt: string }>();
  const canvasRef = useCanvasRef();

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(14);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'fill'>('pen');
  const [magicStampUsed, setMagicStampUsed] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  const { strokes, addStroke, updateStrokes, undo, clearCanvas, canUndo } = useDrawing();

  const handleTimeUp = useCallback(async () => {
    setTimeUp(true);
    // Capture snapshot and save to gallery
    try {
      const image = canvasRef.current?.makeImageSnapshot();
      if (image) {
        const data = image.encodeToBase64();
        const uri = `data:image/png;base64,${data}`;
        await Storage.addToGallery({
          id: Date.now().toString(),
          prompt: prompt || 'Unknown prompt',
          imageUri: uri,
          createdAt: new Date().toISOString(),
        });
        await Storage.addSparks(50);
      }
    } catch (e) {
      console.warn('Could not save drawing', e);
    }
    router.replace({ pathname: '/result', params: { prompt } });
  }, [prompt, canvasRef]);

  const { seconds, running, start } = useTimer(
    GAME_CONSTANTS.DRAW_TIME_SECONDS,
    handleTimeUp
  );

  // Auto-start timer when screen mounts
  React.useEffect(() => { start(); }, []);

  const handleMagicStamp = useCallback(() => {
    if (magicStampUsed) return;
    setMagicStampUsed(true);
    // Magic stamp: add a star burst in the current color
    Alert.alert('✨ Magic Stamp!', 'A magic sparkle was added to your drawing!');
    addStroke({
      id: 'magic-' + Date.now(),
      path: (() => {
        const { Skia } = require('@shopify/react-native-skia');
        const p = Skia.Path.Make();
        // Draw a star-like burst
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const x = 150 + Math.cos(angle) * 30;
          const y = 200 + Math.sin(angle) * 30;
          if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
        }
        p.close();
        return p;
      })(),
      color,
      size: 4,
    });
  }, [magicStampUsed, color, addStroke]);

  const handleDone = useCallback(() => {
    Alert.alert(
      'Submit Drawing?',
      'Are you done? You can\'t undo this!',
      [
        { text: 'Keep Drawing', style: 'cancel' },
        { text: 'Submit! 🎨', onPress: handleTimeUp },
      ]
    );
  }, [handleTimeUp]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.promptBox}>
          <Text style={styles.promptLabel}>Draw:</Text>
          <Text style={styles.promptText} numberOfLines={2}>{prompt}</Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneBtnText}>Done ✓</Text>
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <View style={styles.timerRow}>
        <CountdownTimer
          seconds={seconds}
          totalSeconds={GAME_CONSTANTS.DRAW_TIME_SECONDS}
          onTimeUp={handleTimeUp}
        />
      </View>

      {/* Canvas */}
      <View style={styles.canvasContainer}>
        <DrawingCanvas
          color={color}
          brushSize={brushSize}
          tool={tool}
          strokes={strokes}
          onStrokesChange={updateStrokes}
          onNewStroke={addStroke}
        />
      </View>

      {/* Toolbar */}
      <Toolbar
        selectedColor={color}
        selectedBrushSize={brushSize}
        selectedTool={tool}
        onColorSelect={setColor}
        onBrushSizeSelect={setBrushSize}
        onToolSelect={setTool}
        onUndo={undo}
        canUndo={canUndo}
        magicStampUsed={magicStampUsed}
        onMagicStamp={handleMagicStamp}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
    gap: 8,
  },
  promptBox: { flex: 1 },
  promptLabel: { fontSize: 11, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1 },
  promptText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  doneBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  doneBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  timerRow: { backgroundColor: '#fff', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0EDE8' },
  canvasContainer: { flex: 1, margin: 8, borderRadius: 12, overflow: 'hidden', elevation: 2 },
});
