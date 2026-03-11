import { useState, useEffect } from 'react';
import { predefinedTemplates } from '../engine/presets';
import { useRuntimeEngine } from '../engine/useRuntimeEngine';
import { WorkoutScreen } from '../components/WorkoutScreen';
import type { Step } from '../engine/types';

// ── Config Modal ──
function PresetConfigModal({ 
  template, onClose, onStart 
}: { 
  template: typeof predefinedTemplates[number]; 
  onClose: () => void;
  onStart: (exercises: { name: string; duration: number }[], workDuration: number, restDuration: number, rounds: number) => void;
}) {
  const [exercises, setExercises] = useState<{ name: string; duration: number }[]>([
    { name: 'Squats', duration: 20 },
    { name: 'Push Ups', duration: 20 },
    { name: 'Lunges', duration: 20 },
  ]);
  const [workDuration, setWorkDuration] = useState(20);
  const [restDuration, setRestDuration] = useState(10);
  const [rounds, setRounds] = useState(8);

  // Sync defaults when template changes
  useEffect(() => {
    const block = template.block;
    if (block.type === 'tabata') {
      setWorkDuration(block.workDuration);
      setRestDuration(block.restDuration);
      setRounds(block.rounds);
      if (block.exercises.length > 0) {
        setExercises(block.exercises.map(ex => ({ name: ex.name, duration: block.workDuration })));
      }
    } else if (block.type === 'emom') {
      setWorkDuration(block.intervalDuration);
      setRestDuration(0);
      setRounds(block.rounds);
    } else if (block.type === 'repeat') {
      setRounds(block.rounds);
      const exs: { name: string; duration: number }[] = [];
      for (const child of block.blocks) {
        if (child.type === 'exercise') {
          exs.push({ name: child.name || 'Exercise', duration: child.duration });
          setWorkDuration(child.duration);
        }
        if (child.type === 'rest') setRestDuration(child.duration);
      }
      if (exs.length > 0) setExercises(exs);
    } else if (block.type === 'exercise') {
      setExercises([{ name: block.name || 'Exercise', duration: block.duration }]);
      setWorkDuration(block.duration);
      setRounds(1);
    } else if (block.type === 'ladder') {
      setWorkDuration(block.durationPerRound || 30);
      setRounds(Math.abs(block.endReps - block.startReps) + 1);
      setExercises([{ name: block.exerciseName, duration: block.durationPerRound || 30 }]);
    }
  }, [template]);

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const addExercise = () => {
    setExercises(prev => [...prev, { name: `Exercise ${prev.length + 1}`, duration: workDuration }]);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-title">{template.name}</div>
        <div className="modal-subtitle">{template.description}</div>

        {/* Exercises List */}
        <div className="builder-section">
          <div className="section-header">
            <span className="section-title">Exercises</span>
            <button className="add-exercise-btn" onClick={addExercise}>+</button>
          </div>
          <div className="exercise-list">
            {exercises.map((ex, idx) => (
              <div key={idx} className="exercise-item">
                <span className="exercise-drag">⋮⋮</span>
                <span className="exercise-name-text">{ex.name}</span>
                <span className="exercise-value">{workDuration}s</span>
                <button className="exercise-remove" onClick={() => removeExercise(idx)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="builder-section">
          <div className="section-header">
            <span className="section-title">Settings</span>
          </div>
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-label">Work</div>
              <input 
                type="number" className="setting-input" 
                value={workDuration} min={1}
                onChange={e => setWorkDuration(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="setting-item">
              <div className="setting-label">Rest</div>
              <input 
                type="number" className="setting-input" 
                value={restDuration} min={0}
                onChange={e => setRestDuration(Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div className="setting-item">
              <div className="setting-label">Rounds</div>
              <input 
                type="number" className="setting-input" 
                value={rounds} min={1}
                onChange={e => setRounds(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
        </div>

        <button 
          className="start-preset-btn" 
          onClick={() => onStart(exercises, workDuration, restDuration, rounds)}
        >
          Start Workout
        </button>
      </div>
    </div>
  );
}


// ── Card Stack ──
function getPositionClass(offset: number): string {
  if (offset === 0) return 'center';
  if (offset === -1) return 'left-1';
  if (offset === -2) return 'left-2';
  if (offset === -3) return 'left-3';
  if (offset === 1) return 'right-1';
  if (offset === 2) return 'right-2';
  if (offset === 3) return 'right-3';
  return 'hidden';
}


// ── Main PresetTimer Component ──
export function PresetTimer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [activeQueue, setActiveQueue] = useState<Step[] | null>(null);
  const [configuredRounds, setConfiguredRounds] = useState(1);

  const { state, currentStep, nextStep, start, pause, reset, next, prev } = useRuntimeEngine(activeQueue || []);

  const handleCardClick = (index: number) => {
    if (index === currentIndex) {
      setShowModal(true);
    } else {
      setCurrentIndex(index);
    }
  };

  const handleStartFromModal = (
    exercises: { name: string; duration: number }[],
    workDuration: number,
    restDuration: number,
    rounds: number
  ) => {
    // Build custom queue from user configuration
    const steps: Step[] = [];
    let stepId = 0;
    for (let r = 0; r < rounds; r++) {
      for (const ex of exercises) {
        steps.push({ id: `p-${stepId++}`, name: ex.name, duration: workDuration, type: 'exercise' });
        if (restDuration > 0) {
          steps.push({ id: `p-${stepId++}`, name: 'Rest', duration: restDuration, type: 'rest' });
        }
      }
    }
    setConfiguredRounds(rounds);
    setActiveQueue(steps);
    setShowModal(false);
  };

  // Auto-start after queue is compiled
  useEffect(() => {
    if (activeQueue && activeQueue.length > 0 && state.isStandby) {
      start();
    }
  }, [activeQueue, start, state.isStandby]);

  const handleFinished = () => {
    reset();
    setActiveQueue(null);
  };

  const handleReset = () => {
    reset();
    setActiveQueue(null);
  };

  // ── Running View ──
  if (activeQueue) {
    return (
      <WorkoutScreen
        queue={activeQueue}
        engineState={state}
        currentStep={currentStep}
        nextStep={nextStep}
        onStartPause={state.isRunning ? pause : start}
        onReset={handleReset}
        onPrev={prev}
        onNext={next}
        onFinished={handleFinished}
        totalSets={configuredRounds}
      />
    );
  }

  // ── Selection View (Card Stack) ──
  const totalTemplates = predefinedTemplates.length;

  return (
    <>
      <div className="card-stack">
        <div className="card-track">
          {predefinedTemplates.map((template, index) => {
            let offset = index - currentIndex;
            if (offset > totalTemplates / 2) offset -= totalTemplates;
            if (offset < -totalTemplates / 2) offset += totalTemplates;
            const posClass = getPositionClass(offset);

            return (
              <div 
                key={template.id}
                className={`template-card ${posClass}`}
                onClick={() => handleCardClick(index)}
              >
                <div className="template-icon">{template.icon}</div>
                <div className="template-name">{template.name}</div>
                <div className="template-description">{template.description}</div>
                <div className="template-meta">
                  {template.meta.map(m => (
                    <span key={m} className="meta-item">{m}</span>
                  ))}
                </div>
                <div className="preview-exercises">
                  {template.meta.slice(0, 2).map((m, i) => (
                    <div key={i} className="preview-exercise">
                      <span className="name">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Page indicators */}
      <div className="page-indicators">
        {predefinedTemplates.map((_, idx) => (
          <span 
            key={idx} 
            className={`indicator ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
          />
        ))}
      </div>

      {/* Config Modal */}
      {showModal && (
        <PresetConfigModal
          template={predefinedTemplates[currentIndex]}
          onClose={() => setShowModal(false)}
          onStart={handleStartFromModal}
        />
      )}
    </>
  );
}
