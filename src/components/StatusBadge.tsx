
interface Props {
  text: string;
  isActive?: boolean;
}

export function StatusBadge({ text, isActive = false }: Props) {
  return (
    <div style={{
      textAlign: 'center',
      fontSize: '1rem',
      fontWeight: 500,
      color: isActive ? 'var(--midnight-violet)' : 'var(--midnight-violet)',
      background: isActive ? 'var(--celadon)' : 'var(--vanilla-custard)',
      padding: '0.5rem 1rem',
      borderRadius: '40px',
      display: 'inline-block',
      margin: '0 auto 1.5rem',
      width: 'auto',
      border: `2px solid ${isActive ? 'transparent' : 'var(--sunflower-gold)'}`,
      transition: 'all 0.2s ease'
    }}>
      {text}
    </div>
  );
}
