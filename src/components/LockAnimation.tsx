import { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

export default function LockAnimation({ onComplete }: Props) {
  const [phase, setPhase] = useState<'compress' | 'shield' | 'lock' | 'shackle' | 'ripple' | 'done'>('compress');

  useEffect(() => {
    const timings: Array<[typeof phase, number]> = [
      ['shield', 400],
      ['lock', 900],
      ['shackle', 1400],
      ['ripple', 1800],
      ['done', 2600],
    ];

    const timeouts = timings.map(([p, delay]) =>
      setTimeout(() => setPhase(p), delay)
    );

    const doneTimeout = setTimeout(onComplete, 2800);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(doneTimeout);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}>
      {/* Shield overlay effect */}
      {phase !== 'compress' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(124,58,237,0.08) 0%, transparent 100%)',
          animation: 'shieldDescend 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          pointerEvents: 'none',
        }} />
      )}

      {/* Lock icon assembly */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>
        {/* Shackle (U-shape) */}
        <div style={{
          width: 50,
          height: 35,
          borderTop: '8px solid #7C3AED',
          borderLeft: '8px solid #7C3AED',
          borderRight: '8px solid #7C3AED',
          borderRadius: '25px 25px 0 0',
          transform: phase === 'shackle' || phase === 'ripple' || phase === 'done' ? 'translateY(0)' : 'translateY(-30px)',
          transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 0 20px rgba(124,58,237,0.6)',
          opacity: phase === 'lock' || phase === 'shackle' || phase === 'ripple' || phase === 'done' ? 1 : 0,
        }} />

        {/* Lock body */}
        <div style={{
          width: 80,
          height: 65,
          background: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(124,58,237,0.8), 0 0 60px rgba(124,58,237,0.3)',
          animation: phase === 'lock' || phase === 'shackle' || phase === 'ripple' || phase === 'done'
            ? 'lockAssemble 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            : undefined,
          opacity: phase === 'lock' || phase === 'shackle' || phase === 'ripple' || phase === 'done' ? 1 : 0,
          transform: phase === 'lock' || phase === 'shackle' || phase === 'ripple' || phase === 'done' ? 'scale(1)' : 'scale(0)',
        }}>
          {/* Keyhole */}
          <div style={{
            width: 18,
            height: 28,
            background: 'rgba(10,10,15,0.6)',
            borderRadius: '50% 50% 4px 4px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 14,
              background: 'rgba(10,10,15,0.6)',
              borderRadius: '0 0 4px 4px',
            }} />
          </div>
        </div>
      </div>

      {/* Ripple effect */}
      {(phase === 'ripple' || phase === 'done') && (
        <>
          <div style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '2px solid rgba(124,58,237,0.6)',
            animation: 'rippleOut 0.8s ease-out forwards',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '2px solid rgba(124,58,237,0.4)',
            animation: 'rippleOut 0.8s ease-out 0.2s forwards',
            pointerEvents: 'none',
          }} />
        </>
      )}

      {/* Text */}
      <div style={{
        textAlign: 'center',
        opacity: phase === 'ripple' || phase === 'done' ? 1 : 0,
        transform: phase === 'ripple' || phase === 'done' ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          Commitment Locked
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-sub)' }}>
          30 days. No excuses.
        </div>
      </div>
    </div>
  );
}
