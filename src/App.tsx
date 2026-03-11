import { useState } from 'react';
import { SegmentedControl, type AppMode } from './components/SegmentedControl';
import { Stopwatch } from './modes/Stopwatch';
import { PresetTimer } from './modes/PresetTimer';
import { CustomBuilder } from './modes/CustomBuilder';
import './index.css';

function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('presets');

  return (
    <div className="app-shell">
      <SegmentedControl 
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

      <div className="mode-container">
        {activeMode === 'presets' && <PresetTimer />}
        {activeMode === 'custom' && <CustomBuilder />}
        {activeMode === 'stopwatch' && <Stopwatch />}
      </div>
    </div>
  );
}

export default App;
