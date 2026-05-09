import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import {
  Canvas,
  Path,
  SkPath,
  Skia,
  TouchInfo,
  useTouchHandler,
  useCanvasRef,
  Fill,
  Circle,
  Group,
} from '@shopify/react-native-skia';
import { BRUSH_SIZES } from '../../constants/colors';

export type Stroke = {
  id: string;
  path: SkPath;
  color: string;
  size: number;
  isFill?: boolean;
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
  color,
  brushSize,
  tool,
  strokes,
  onStrokesChange,
  onNewStroke,
  backgroundColor = '#FFFFFF',
}: Props) {
  const canvasRef = useCanvasRef();
  const currentPath = useRef<SkPath | null>(null);
  const currentStrokeId = useRef<string>('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    setDimensions({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  };

  // Flood-fill implementation (simplified scanline for canvas)
  const handleFill = useCallback(
    (x: number, y: number) => {
      const fillStroke: Stroke = {
        id: Date.now().toString(),
        path: Skia.Path.Make(),
        color,
        size: 1,
        isFill: true,
      };
      // We represent a fill as a full-canvas rect path with the chosen color
      fillStroke.path.addRect(
        Skia.XYWHRect(0, 0, dimensions.width, dimensions.height)
      );
      onNewStroke(fillStroke);
    },
    [color, dimensions, onNewStroke]
  );

  const touchHandler = useTouchHandler({
    onStart: (touch: TouchInfo) => {
      if (tool === 'fill') {
        handleFill(touch.x, touch.y);
        return;
      }
      const path = Skia.Path.Make();
      path.moveTo(touch.x, touch.y);
      currentPath.current = path;
      currentStrokeId.current = Date.now().toString();
    },
    onActive: (touch: TouchInfo) => {
      if (!currentPath.current || tool === 'fill') return;
      currentPath.current.lineTo(touch.x, touch.y);
      // Force re-render by updating strokes with in-progress path
      onStrokesChange([
        ...strokes.filter((s) => s.id !== currentStrokeId.current),
        {
          id: currentStrokeId.current,
          path: currentPath.current.copy(),
          color: tool === 'eraser' ? backgroundColor : color,
          size: brushSize,
        },
      ]);
    },
    onEnd: () => {
      if (!currentPath.current || tool === 'fill') return;
      const finished: Stroke = {
        id: currentStrokeId.current,
        path: currentPath.current.copy(),
        color: tool === 'eraser' ? backgroundColor : color,
        size: brushSize,
      };
      onNewStroke(finished);
      currentPath.current = null;
    },
  });

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Canvas ref={canvasRef} style={styles.canvas} onTouch={touchHandler}>
        <Fill color={backgroundColor} />
        {strokes.map((stroke) =>
          stroke.isFill ? (
            <Fill key={stroke.id} color={stroke.color} />
          ) : (
            <Path
              key={stroke.id}
              path={stroke.path}
              color={stroke.color}
              style="stroke"
              strokeWidth={stroke.size}
              strokeCap="round"
              strokeJoin="round"
            />
          )
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  canvas: { flex: 1 },
});
