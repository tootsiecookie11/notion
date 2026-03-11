interface Props {
  isRunning: boolean;
  isStandby: boolean;
  onStartPause: () => void;
  onReset: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  showPrev?: boolean;
  showNext?: boolean;
  prevDisabled?: boolean;
}

export function ControlButtons({ 
  isRunning, isStandby, onStartPause, onReset, 
  onPrev, onNext, showPrev = true, showNext = true, prevDisabled = false 
}: Props) {
  return (
    <div className="control-buttons">
      {showPrev && (
        <button 
          className="control-btn" 
          onClick={onPrev}
          disabled={prevDisabled}
        >
          ←
        </button>
      )}

      <button className="control-btn primary" onClick={onStartPause}>
        {isStandby ? '▶ Start' : (isRunning ? '⏸ Pause' : '▶ Resume')}
      </button>

      <button className="control-btn danger" onClick={onReset}>
        ↺
      </button>

      {showNext && (
        <button className="control-btn" onClick={onNext}>
          →
        </button>
      )}
    </div>
  );
}
