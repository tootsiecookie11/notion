export type AppMode = 'presets' | 'custom' | 'stopwatch';

interface Props {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const modes: { key: AppMode; label: string }[] = [
  { key: 'presets', label: '📋 Preset Timer' },
  { key: 'custom', label: '✨ Custom' },
  { key: 'stopwatch', label: '⏱️ Stopwatch' },
];

export function SegmentedControl({ activeMode, onModeChange }: Props) {
  return (
    <div className="segmented-control">
      {modes.map(m => (
        <button
          key={m.key}
          className={`segmented-btn ${activeMode === m.key ? 'active' : ''}`}
          onClick={() => onModeChange(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
