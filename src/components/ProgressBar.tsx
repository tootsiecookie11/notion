
interface Props {
  progress: number; // 0 to 1
}

export function ProgressBar({ progress }: Props) {
  return (
    <div style={{
      width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px', overflow: 'hidden', margin: '1rem 0'
    }}>
      <div style={{
        width: `${progress * 100}%`, height: '100%', background: 'var(--celadon)',
        transition: 'width 0.3s ease'
      }} />
    </div>
  );
}
