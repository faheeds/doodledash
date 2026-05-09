import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native';
import { BRUSH_SIZES, SKETCHBOOK_1_PALETTE } from '../../constants/colors';

type Tool = 'pen' | 'eraser' | 'fill';

type Props = {
  selectedColor: string;
  selectedBrushSize: number;
  selectedTool: Tool;
  onColorSelect: (color: string) => void;
  onBrushSizeSelect: (size: number) => void;
  onToolSelect: (tool: Tool) => void;
  onUndo: () => void;
  canUndo: boolean;
  magicStampUsed: boolean;
  onMagicStamp: () => void;
};

export default function Toolbar({
  selectedColor,
  selectedBrushSize,
  selectedTool,
  onColorSelect,
  onBrushSizeSelect,
  onToolSelect,
  onUndo,
  canUndo,
  magicStampUsed,
  onMagicStamp,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Color palette */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.paletteRow}
        contentContainerStyle={styles.paletteContent}
      >
        {SKETCHBOOK_1_PALETTE.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => { onColorSelect(c); onToolSelect('pen'); }}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              c === '#FFFFFF' && styles.colorDotWhite,
              selectedColor === c && selectedTool === 'pen' && styles.colorDotSelected,
            ]}
          />
        ))}
      </ScrollView>

      {/* Tools row */}
      <View style={styles.toolsRow}>
        {/* Brush sizes */}
        <View style={styles.brushSizes}>
          {BRUSH_SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              onPress={() => { onBrushSizeSelect(size); onToolSelect('pen'); }}
              style={[styles.brushBtn, selectedBrushSize === size && selectedTool === 'pen' && styles.brushBtnSelected]}
            >
              <View
                style={[
                  styles.brushDot,
                  {
                    width: Math.min(size, 24),
                    height: Math.min(size, 24),
                    backgroundColor: selectedColor,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          {/* Eraser */}
          <TouchableOpacity
            onPress={() => onToolSelect('eraser')}
            style={[styles.toolBtn, selectedTool === 'eraser' && styles.toolBtnSelected]}
          >
            <Text style={styles.toolIcon}>🧹</Text>
          </TouchableOpacity>

          {/* Fill */}
          <TouchableOpacity
            onPress={() => onToolSelect('fill')}
            style={[styles.toolBtn, selectedTool === 'fill' && styles.toolBtnSelected]}
          >
            <Text style={styles.toolIcon}>🪣</Text>
          </TouchableOpacity>

          {/* Undo */}
          <TouchableOpacity
            onPress={onUndo}
            disabled={!canUndo}
            style={[styles.toolBtn, !canUndo && styles.toolBtnDisabled]}
          >
            <Text style={styles.toolIcon}>↩️</Text>
          </TouchableOpacity>

          {/* Magic Stamp */}
          <TouchableOpacity
            onPress={onMagicStamp}
            disabled={magicStampUsed}
            style={[styles.toolBtn, styles.magicBtn, magicStampUsed && styles.toolBtnDisabled]}
          >
            <Text style={styles.toolIcon}>✨</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1917',
    paddingBottom: 8,
    paddingTop: 6,
  },
  paletteRow: { marginBottom: 8 },
  paletteContent: { paddingHorizontal: 12, gap: 6, flexDirection: 'row' },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotWhite: { borderColor: '#555' },
  colorDotSelected: { borderColor: '#fff', transform: [{ scale: 1.2 }] },
  toolsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  brushSizes: { flexDirection: 'row', gap: 6, flex: 1, alignItems: 'center' },
  brushBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2C2927',
  },
  brushBtnSelected: { backgroundColor: '#F97316' },
  brushDot: { borderRadius: 20 },
  actions: { flexDirection: 'row', gap: 4 },
  toolBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2C2927',
  },
  toolBtnSelected: { backgroundColor: '#F97316' },
  toolBtnDisabled: { opacity: 0.35 },
  magicBtn: { backgroundColor: '#4C1D95' },
  toolIcon: { fontSize: 18 },
});
