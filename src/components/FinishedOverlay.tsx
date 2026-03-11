interface Props {
  totalTime: number;
  totalExercises: number;
  totalSets: number;
  onDone: () => void;
}

function formatElapsedTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function FinishedOverlay({ totalTime, totalExercises, totalSets, onDone }: Props) {
  return (
    <div className="finished-overlay">
      <div className="finished-container">
        <div className="finished-message">WORKOUT FINISHED</div>
        <div className="finished-submessage">Congratulations!</div>
        
        <div className="finished-stats">
          <div className="finished-stat">
            <div className="finished-stat-label">TOTAL TIME</div>
            <div className="finished-stat-value">{formatElapsedTime(totalTime)}</div>
          </div>
          <div className="finished-stat">
            <div className="finished-stat-label">EXERCISES</div>
            <div className="finished-stat-value">{totalExercises}</div>
          </div>
          <div className="finished-stat">
            <div className="finished-stat-label">SETS</div>
            <div className="finished-stat-value">{totalSets}</div>
          </div>
        </div>
        
        <button className="done-btn" onClick={onDone}>DONE</button>
      </div>
    </div>
  );
}
