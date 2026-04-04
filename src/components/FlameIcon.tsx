import { useEffect, useRef } from 'react';

interface Props {
  streak: number;
  size?: number;
  flare?: boolean;
}

export default function FlameIcon({ streak, size = 20, flare = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (flare && ref.current) {
      ref.current.classList.add('flame-flare');
      const t = setTimeout(() => ref.current?.classList.remove('flame-flare'), 600);
      return () => clearTimeout(t);
    }
  }, [flare, streak]);

  if (streak === 0) return null;

  return (
    <span
      ref={ref}
      className="flame-icon"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
      aria-label={`${streak} day streak`}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C12 2 7 8 7 13C7 15.76 9.24 18 12 18C14.76 18 17 15.76 17 13C17 10 15 7 13 5C13 5 14 9 12 10C10 11 9 9 9 9C9 9 12 7 12 2Z"
          fill="url(#flameGrad)"
          style={{ filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.6))' }}
        />
        <path
          d="M12 18C10.34 18 9 16.66 9 15C9 13.5 10 12.5 11 12C11 13 11.5 14 12.5 14C13.5 14 14 13 14 12C15 13 15 14.5 15 15C15 16.66 13.66 18 12 18Z"
          fill="#FCD34D"
          opacity={0.8}
        />
        <defs>
          <linearGradient id="flameGrad" x1="12" y1="2" x2="12" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="60%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>
      </svg>
      <span style={{ fontSize: size * 0.65, fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>
        {streak}
      </span>
    </span>
  );
}
