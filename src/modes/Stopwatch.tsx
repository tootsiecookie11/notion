import { useStopwatchEngine } from '../engine/useStopwatchEngine';

export function Stopwatch() {
  const { time, isRunning, start, pause, stop } = useStopwatchEngine();

  const formatTime = (seconds: number): string => {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const ms = Math.floor((seconds - totalSeconds) * 100);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const statusText = isRunning ? '▶ Running' : (time > 0 ? '⏸ Paused' : '⏳ Standby');
  const badgeStyle: React.CSSProperties = isRunning 
    ? { background: 'var(--celadon)', color: 'var(--midnight-violet)' }
    : {};

  return (
    <div className="stopwatch-container">
      <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
        <div className="stopwatch-time">{formatTime(time)}</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div className="status-badge" style={badgeStyle}>{statusText}</div>
      </div>

      <div className="stopwatch-controls">
        <button className="btn" onClick={isRunning ? pause : start}>
          {!isRunning && time === 0 ? '▶ Start' : (isRunning ? '⏸ Pause' : '▶ Resume')}
        </button>
        <button className="btn btn-stop" onClick={stop}>
          ⏹ Stop
        </button>
      </div>
    </div>
  );
}
