import React, { useRef, useState, useCallback } from 'react';
import { View, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export type Stroke = {
  id: string;
  points: string;   // SVG path data: "M x y L x y L x y ..."
  color: string;
  size: number;
  isFill?: boolean;
  fillColor?: string;
};

type Props = {
  color: string;
  brushSize: number;
  tool: 'pen' | 'eraser' | 'fill';
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  onNewStroke: (stroke: Stroke) => void;
  backgroundColor?: string;
};

export default function DrawingCanvas({
  color, brushSize, tool, strokes, onStrokesChange, onNewStroke, backgroundColor = '#FFFFFF',
}: Props) {
  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const currentId = useRef('');
  const [size, setSize] = useState({ width: 0, height: 0 });

  const buildPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (tool === 'fill') {
          onNewStroke({ id: Date.now().toString(), points: '', color, size: 1, isFill: true, fillColor: color });
          return;
        }
        currentId.current = Date.now().toString();
        currentPoints.current = [{ x: locationX, y: locationY }];
      },
      onPanResponderMove: (evt) => {
        if (tool === 'fill') return;
        const { locationX, locationY } = evt.nativeEvent;
        currentPoints.current.push({ x: locationX, y: locationY });
        const inProgress: Stroke = {
          id: currentId.current,
          points: buildPath(currentPoints.current),
          color: tool === 'eraser' ? backgroundColor : color,
          size: brushSize,
        };
        onStrokesChange([...strokes.filter(s => s.id !== currentId.current), inProgress]);
      },
      onPanResponderRelease: () => {
        if (tool === 'fill' || currentPoints.current.length === 0) return;
        onNewStroke({
          id: currentId.current,
          points: buildPath(currentPoints.current),
          color: tool === 'eraser' ? backgroundColor : color,
          size: brushSize,
        });
        currentPoints.current = [];
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });

  // Find the last fill stroke to use as background
  const lastFill = [...strokes].reverse().find(s => s.isFill);
  const bgColor = lastFill ? lastFill.fillColor! : backgroundColor;
  const drawStrokes = strokes.filter(s => !s.isFill);

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={size.width} height={size.height} fill={bgColor} />
        {drawStrokes.map(stroke => (
          <Path
            key={stroke.id}
            d={stroke.points}
            stroke={stroke.color}
            strokeWidth={stroke.size}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
});
