import { useEffect, useRef, useState } from 'react';

interface Props {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export default function ProgressRing({ progress, size = 180, strokeWidth = 10, label, sublabel }: Props) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const startValRef = useRef<number>(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    const from = animatedProgress;
    const to = progress;
    const duration = 1200;
    startRef.current = performance.now();
    startValRef.current = from;

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setAnimatedProgress(from + (to - from) * eased);
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [progress]);

  const cx = size / 2;
  const cy = size / 2;

  const angle = (animatedProgress / 100) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const px = cx + radius * Math.cos(rad);
  const py = cy + radius * Math.sin(rad);

  return (
    <div style={{ width: size, height: size, position: 'relative' }} role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={`Overall progress: ${Math.round(progress)}%`}>
      
      {/* Glass disc background */}
      <div style={{
        position: 'absolute',
        inset: strokeWidth * 1.5,
        borderRadius: '50%',
        background: 'var(--surface)',
        backdropFilter: 'blur(20px) saturate(150%)',
        WebkitBackdropFilter: 'blur(20px) saturate(150%)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--glass-inner-shadow), 0 0 40px rgba(124,58,237,0.06)',
      }} />

      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', overflow: 'visible', position: 'relative', zIndex: 1 }}
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="30%" stopColor="#7C3AED" />
            <stop offset="65%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
          <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Outer glow layer */}
        {animatedProgress > 0 && (
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="rgba(124,58,237,0.3)"
            strokeWidth={strokeWidth + 6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ filter: 'blur(8px)', transition: 'stroke-dashoffset 0.05s linear' }}
          />
        )}

        {/* Progress arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />

        {/* Dot at leading edge */}
        {animatedProgress > 3 && animatedProgress < 98 && (
          <>
            <circle cx={px} cy={py} r={strokeWidth / 2 + 2} fill="rgba(196,181,253,0.3)" />
            <circle cx={px} cy={py} r={strokeWidth / 2 + 0.5} fill="#C4B5FD" />
          </>
        )}
      </svg>

      {/* Center content with glass backing */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        zIndex: 2,
      }}>
        {label && (
          <span style={{
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #C4B5FD, #A78BFA, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.3))',
          }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 500, letterSpacing: '0.03em' }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
