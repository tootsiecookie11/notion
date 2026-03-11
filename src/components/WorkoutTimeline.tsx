import { useEffect, useRef } from 'react';

export interface StepItem {
  id: string;
  name: string;
  duration?: number;
  type: 'exercise' | 'rest' | 'prep';
}

interface Props {
  steps: StepItem[];
  currentIndex: number;
}

export function WorkoutTimeline({ steps, currentIndex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && steps.length > 0) {
      const activeEl = containerRef.current.children[currentIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, steps.length]);

  if (!steps || steps.length === 0) return null;

  return (
    <div style={{ position: 'relative', margin: '2rem 0', width: '100%' }}>
      <div
        ref={containerRef}
        style={{
          display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '1rem',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }}
        className="hide-scrollbar"
      >
        {steps.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPast = idx < currentIndex;
          const isRest = step.type === 'rest';

          return (
            <div
              key={step.id + idx}
              style={{
                flex: '0 0 auto',
                padding: '0.5rem 1rem',
                borderRadius: '40px',
                background: isActive 
                  ? (isRest ? 'var(--sunflower-gold)' : 'var(--celadon)')
                  : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? 'var(--midnight-violet)' : (isPast ? 'rgba(255, 255, 255, 0.3)' : 'var(--vanilla-custard)'),
                border: `1px solid ${isActive ? 'transparent' : 'rgba(169, 229, 187, 0.2)'}`,
                opacity: isPast ? 0.6 : 1,
                fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.3s ease'
              }}
            >
              {step.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
