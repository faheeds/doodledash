import { useState, useCallback, useRef } from 'react';
import { Stroke } from '../components/canvas/DrawingCanvas';

const MAX_UNDO = 5;

export function useDrawing() {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const history = useRef<Stroke[][]>([[]]);
  const historyIdx = useRef(0);

  const addStroke = useCallback((stroke: Stroke) => {
    setStrokes(prev => {
      const next = [...prev.filter(s => s.id !== stroke.id), stroke];
      const snapshots = history.current.slice(0, historyIdx.current + 1);
      if (snapshots.length >= MAX_UNDO + 1) snapshots.shift();
      snapshots.push(next);
      history.current = snapshots;
      historyIdx.current = snapshots.length - 1;
      return next;
    });
  }, []);

  const updateStrokes = useCallback((s: Stroke[]) => setStrokes(s), []);

  const undo = useCallback(() => {
    if (historyIdx.current <= 0) return;
    historyIdx.current -= 1;
    setStrokes(history.current[historyIdx.current]);
  }, []);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    history.current = [[]];
    historyIdx.current = 0;
  }, []);

  return { strokes, addStroke, updateStrokes, undo, clearCanvas, canUndo: historyIdx.current > 0 };
}
