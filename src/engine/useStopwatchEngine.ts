import { useState, useRef, useEffect, useCallback } from 'react';

export function useStopwatchEngine() {
  const [time, setTime] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isStandby, setIsStandby] = useState(true);

  const reqRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(0); // keeps strict mutable state to avoid closure issues in rAF

  const tick = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    if (isRunning) {
      timeRef.current += delta;
      setTime(timeRef.current);
    }
    
    reqRef.current = requestAnimationFrame(tick);
  }, [isRunning]);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqRef.current);
  }, [tick]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsStandby(false);
    lastTimeRef.current = performance.now();
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsStandby(true);
    timeRef.current = 0;
    setTime(0);
  }, []);

  return { time, isRunning, isStandby, start, pause, stop };
}
