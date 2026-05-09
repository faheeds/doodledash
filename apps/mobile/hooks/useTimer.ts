import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(totalSeconds: number, onComplete: () => void) {
  const [seconds, setSeconds] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setSeconds(totalSeconds);
    setRunning(true);
  }, [totalSeconds]);

  const stop = useCallback(() => {
    setRunning(false);
    if (interval.current) clearInterval(interval.current);
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(totalSeconds);
  }, [totalSeconds, stop]);

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          onComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [running, onComplete]);

  return { seconds, running, start, stop, reset };
}
