
interface Props {
  time: number; // in seconds
  showMilliseconds?: boolean;
}

export function TimerDisplay({ time, showMilliseconds = false }: Props) {
  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const ms = Math.floor((seconds - totalSeconds) * 100);

    const pad = (n: number) => n.toString().padStart(2, '0');

    let formatted = `${pad(minutes)}:${pad(secs)}`;
    if (hours > 0) {
      formatted = `${pad(hours)}:${formatted}`;
    }
    if (showMilliseconds) {
      formatted += `.${pad(ms)}`;
    }
    return formatted;
  };

  return (
    <div style={{
      fontSize: 'clamp(3.8rem, 15vw, 5rem)', fontWeight: 300, color: 'var(--vanilla-custard)',
      fontVariantNumeric: 'tabular-nums', lineHeight: 1.2,
      textShadow: '0 0 8px var(--celadon)', letterSpacing: '4px', textAlign: 'center',
      margin: '1rem 0'
    }}>
      {formatTime(time)}
    </div>
  );
}
