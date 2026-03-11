import type { Step } from '../engine/types';
import { ControlButtons } from './ControlButtons';
import { FinishedOverlay } from './FinishedOverlay';

interface EngineState {
  isRunning: boolean;
  isStandby: boolean;
  isFinished: boolean;
  currentStepIndex: number;
  remainingTime: number;
  elapsedTotal: number;
  overallProgress: number;
}

interface Props {
  queue: Step[];
  engineState: EngineState;
  currentStep: Step | undefined;
  nextStep: Step | undefined;
  onStartPause: () => void;
  onReset: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinished: () => void;
  totalSets?: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatElapsedTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function WorkoutScreen({ 
  queue, engineState, currentStep, nextStep,
  onStartPause, onReset, onPrev, onNext, onFinished, totalSets = 1 
}: Props) {

  // Finished state
  if (engineState.isFinished) {
    return (
      <div className="workout-screen">
        <FinishedOverlay
          totalTime={engineState.elapsedTotal}
          totalExercises={queue.filter(s => s.type === 'exercise').length}
          totalSets={totalSets}
          onDone={onFinished}
        />
      </div>
    );
  }

  return (
    <div className="workout-screen">
      {/* Segmented progress bar */}
      <div className="progress-segments">
        {queue.map((step, idx) => {
          let className = 'progress-segment';
          if (idx < engineState.currentStepIndex) className += ' completed';
          else if (idx === engineState.currentStepIndex) className += ' active';
          return <div key={`${step.name}-${idx}`} className={className} />;
        })}
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div>
          <div className="stat-label">Elapsed Time</div>
          <div className="stat-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatElapsedTime(engineState.elapsedTotal)}
          </div>
        </div>
        <div>
          <div className="stat-label">Next Up</div>
          <div className="stat-value">
            <div className="next-up-preview">
              {nextStep ? nextStep.name : 'Workout Complete'}
            </div>
          </div>
        </div>
        <div>
          <div className="stat-label">Step</div>
          <div className="stat-value">
            {engineState.currentStepIndex + 1} / {queue.length}
          </div>
        </div>
      </div>

      {/* Current exercise big display */}
      <div className="current-exercise-container">
        <div className="current-time">{formatTime(Math.ceil(engineState.remainingTime))}</div>
        <div className="current-name">{currentStep?.name || '—'}</div>
      </div>

      {/* Controls */}
      <ControlButtons
        isRunning={engineState.isRunning}
        isStandby={engineState.isStandby}
        onStartPause={onStartPause}
        onReset={onReset}
        onPrev={onPrev}
        onNext={onNext}
        showPrev={true}
        showNext={true}
        prevDisabled={engineState.currentStepIndex === 0}
      />
    </div>
  );
}
