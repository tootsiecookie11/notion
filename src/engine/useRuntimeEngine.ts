import { useState, useEffect, useRef, useCallback } from 'react';
import type { Step } from './types';

// Web audio API cache
let audioContext: AudioContext | null = null;
const playBeep = (type: 'tick' | 'flatline' | 'prep') => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return;
    }
  }

  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const osc = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (type === 'tick') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);
  } else if (type === 'flatline') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 1.0);
  } else {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
  }
};

interface RuntimeState {
  isRunning: boolean;
  isStandby: boolean;
  isFinished: boolean;
  currentStepIndex: number;
  remainingTime: number;
  elapsedTotal: number;
  overallProgress: number;
}

export function useRuntimeEngine(queue: Step[]) {
  const [state, setState] = useState<RuntimeState>({
    isRunning: false,
    isStandby: true,
    isFinished: false,
    currentStepIndex: 0,
    remainingTime: 0,
    elapsedTotal: 0,
    overallProgress: 0,
  });

  const queueRef = useRef(queue);
  const stateRef = useRef(state);
  const lastTimeRef = useRef<number>(0);
  const reqRef = useRef<number>(0);
  const lastBeepTimeRef = useRef<number>(-1);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { stateRef.current = state; }, [state]);

  const tick = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const currentState = stateRef.current;
    if (!currentState.isRunning || currentState.isStandby || currentState.isFinished) {
      reqRef.current = requestAnimationFrame(tick);
      return;
    }

    const currentStep = queueRef.current[currentState.currentStepIndex];
    if (!currentStep) return;

    let newTime = currentState.remainingTime - delta;

    // 5-4-3-2-1 countdown ticking
    const roundedTime = Math.ceil(newTime);
    if (newTime > 0 && newTime <= 5.5 && roundedTime !== lastBeepTimeRef.current) {
      if (roundedTime > 0 && roundedTime <= 5) {
        playBeep('tick');
        lastBeepTimeRef.current = roundedTime;
      }
    }

    if (newTime <= 0) {
      playBeep('flatline');
      lastBeepTimeRef.current = -1;

      const nextIndex = currentState.currentStepIndex + 1;
      
      if (nextIndex < queueRef.current.length) {
        const nextStep = queueRef.current[nextIndex];
        setState(prev => ({
          ...prev,
          currentStepIndex: nextIndex,
          remainingTime: nextStep.duration,
          elapsedTotal: prev.elapsedTotal + delta,
          overallProgress: nextIndex / queueRef.current.length
        }));
      } else {
        // Workout finished
        setState(prev => ({
          ...prev,
          isRunning: false,
          isFinished: true,
          remainingTime: 0,
          overallProgress: 1
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        remainingTime: newTime,
        elapsedTotal: prev.elapsedTotal + delta,
      }));
    }

    reqRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    reqRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(reqRef.current);
  }, [tick]);

  const start = useCallback(() => {
    if (state.isStandby && queueRef.current.length > 0) {
      const firstStep = queueRef.current[0];
      playBeep('prep');
      setState({
        isRunning: true,
        isStandby: false,
        isFinished: false,
        currentStepIndex: 0,
        remainingTime: firstStep.duration,
        elapsedTotal: 0,
        overallProgress: 0,
      });
      lastTimeRef.current = performance.now();
    } else {
      // Resuming
      setState(prev => ({ ...prev, isRunning: true, isStandby: false }));
      lastTimeRef.current = performance.now();
      playBeep('prep');
    }
  }, [state.isStandby]);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      isStandby: true,
      isFinished: false,
      currentStepIndex: 0,
      remainingTime: queue.length > 0 ? queue[0].duration : 0,
      elapsedTotal: 0,
      overallProgress: 0
    });
    lastBeepTimeRef.current = -1;
  }, [queue]);
  
  const next = useCallback(() => {
     if (state.isStandby || state.isFinished) return;
     
     const nextIndex = state.currentStepIndex + 1;
     playBeep('flatline');
     lastBeepTimeRef.current = -1;
     
     if (nextIndex < queueRef.current.length) {
       setState(prev => ({
         ...prev,
         currentStepIndex: nextIndex,
         remainingTime: queueRef.current[nextIndex].duration,
         overallProgress: nextIndex / queueRef.current.length
       }));
       lastTimeRef.current = performance.now();
     } else {
       // Finished
       setState(prev => ({
         ...prev,
         isRunning: false,
         isFinished: true,
         remainingTime: 0,
         overallProgress: 1,
       }));
     }
  }, [state.isStandby, state.isFinished, state.currentStepIndex]);

  const prev = useCallback(() => {
    if (state.isStandby || state.isFinished) return;

    const prevIndex = state.currentStepIndex - 1;
    if (prevIndex < 0) return;

    // Pause and go to previous step
    setState(prev => ({
      ...prev,
      isRunning: false,
      currentStepIndex: prevIndex,
      remainingTime: queueRef.current[prevIndex].duration,
      overallProgress: prevIndex / queueRef.current.length
    }));
    lastBeepTimeRef.current = -1;
    lastTimeRef.current = performance.now();
  }, [state.isStandby, state.isFinished, state.currentStepIndex]);

  return {
    state,
    currentStep: queue[state.currentStepIndex],
    nextStep: queue[state.currentStepIndex + 1],
    start,
    pause,
    reset,
    next,
    prev
  };
}
