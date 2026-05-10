import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export type Stroke = {
  id: string;
  points: string;
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
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Refs so PanResponder always sees latest values — fixes stale closure bugs
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);
  const toolRef = useRef(tool);
  const strokesRef = useRef(strokes);
  const bgRef = useRef(backgroundColor);
  const onNewStrokeRef = useRef(onNewStroke);
  const onStrokesChangeRef = useRef(onStrokesChange);

  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  useEffect(() => { bgRef.current = backgroundColor; }, [backgroundColor]);
  useEffect(() => { onNewStrokeRef.current = onNewStroke; }, [onNewStroke]);
  useEffect(() => { onStrokesChangeRef.current = onStrokesChange; }, [onStrokesChange]);

  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const currentId = useRef('');

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
        if (toolRef.current === 'fill') {
          onNewStrokeRef.current({
            id: Date.now().toString(), points: '',
            color: colorRef.current, size: 1,
            isFill: true, fillColor: colorRef.current,
          });
          return;
        }
        currentId.current = Date.now().toString();
        currentPoints.current = [{ x: locationX, y: locationY }];
      },

      onPanResponderMove: (evt) => {
        if (toolRef.current === 'fill') return;
        const { locationX, locationY } = evt.nativeEvent;
        currentPoints.current.push({ x: locationX, y: locationY });
        const inProgress: Stroke = {
          id: currentId.current,
          points: buildPath(currentPoints.current),
          color: toolRef.current === 'eraser' ? bgRef.current : colorRef.current,
          size: brushSizeRef.current,
        };
        // Use ref to get latest strokes — avoids wiping previous strokes
        const updated = [
          ...strokesRef.current.filter(s => s.id !== currentId.current),
          inProgress,
        ];
        onStrokesChangeRef.current(updated);
      },

      onPanResponderRelease: () => {
        if (toolRef.current === 'fill' || currentPoints.current.length === 0) return;
        const finished: Stroke = {
          id: currentId.current,
          points: buildPath(currentPoints.current),
          color: toolRef.current === 'eraser' ? bgRef.current : colorRef.current,
          size: brushSizeRef.current,
        };
        onNewStrokeRef.current(finished);
        currentPoints.current = [];
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) =>
    setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });

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
