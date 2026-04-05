import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Props {
  initialHour: string;
  initialMinute: string;
  initialPeriod: 'AM' | 'PM';
  onSave: (h: string, m: string, p: 'AM' | 'PM') => void;
  onClose: () => void;
}

export default function LiquidTimePicker({ initialHour, initialMinute, initialPeriod, onSave, onClose }: Props) {
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState(initialPeriod);
  
  // 'hour' or 'minute' selection mode
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  const dialRef = useRef<HTMLDivElement>(null);

  // Generate 12 numbers for the dial based on mode
  const dialNumbers = Array.from({ length: 12 }, (_, i) => {
    if (mode === 'hour') return i === 0 ? 12 : i;
    // Minute mode: 0, 5, 10...55
    return i === 0 ? 0 : i * 5;
  });

  // Calculate pointer angle
  const getAngle = () => {
    if (mode === 'hour') {
      const h = parseInt(hour, 10);
      return (h === 12 ? 0 : h) * 30; // 360 / 12 = 30
    } else {
      const m = parseInt(minute, 10);
      return (m / 60) * 360;
    }
  };

  const [angle, setAngle] = useState(getAngle());

  useEffect(() => {
    setAngle(getAngle());
  }, [hour, minute, mode]);

  // Handle interacting with the dial (tap or drag)
  const handleDialInteract = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!dialRef.current) return;
    
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const dx = clientX - cx;
    const dy = clientY - cy;
    let rad = Math.atan2(dy, dx);
    let deg = (rad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    if (mode === 'hour') {
      const snappedHour = Math.round(deg / 30) || 12;
      setHour(String(snappedHour === 0 ? 12 : snappedHour).padStart(2, '0'));
    } else {
      // For minutes, snap to nearest 1 or 5? Standard Android lets you snap to 1 tick.
      const snappedMin = Math.round(deg / 6) % 60;
      setMinute(String(snappedMin).padStart(2, '0'));
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    handleDialInteract(e);
    const handleMove = (ev: MouseEvent | TouchEvent) => {
      ev.preventDefault(); // Stop scrolling while dragging dial
      handleDialInteract(ev);
    };
    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
      // Auto switch to minute picker if they just picked an hour
      if (mode === 'hour') {
        setTimeout(() => setMode('minute'), 300);
      }
    };
    document.addEventListener('mousemove', handleMove, { passive: false });
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);
  };

  const renderDigitalDisplay = () => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
      {/* Hour Block */}
      <motion.button
        onClick={() => setMode('hour')}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 80, height: 80, borderRadius: 20,
          background: mode === 'hour' ? 'var(--violet-dim)' : 'var(--surface-hi)',
          border: `2px solid ${mode === 'hour' ? 'var(--violet)' : 'var(--border-hi)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 700, color: mode === 'hour' ? 'var(--violet-lt)' : 'var(--text)',
          boxShadow: mode === 'hour' ? '0 0 20px var(--violet-glow)' : 'var(--glass-inner-shadow)',
          cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {hour}
      </motion.button>

      <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 8 }}>:</span>

      {/* Minute Block */}
      <motion.button
        onClick={() => setMode('minute')}
        whileTap={{ scale: 0.95 }}
        style={{
          width: 80, height: 80, borderRadius: 20,
          background: mode === 'minute' ? 'var(--violet-dim)' : 'var(--surface-hi)',
          border: `2px solid ${mode === 'minute' ? 'var(--violet)' : 'var(--border-hi)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 700, color: mode === 'minute' ? 'var(--violet-lt)' : 'var(--text)',
          boxShadow: mode === 'minute' ? '0 0 20px var(--violet-glow)' : 'var(--glass-inner-shadow)',
          cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {minute}
      </motion.button>

      {/* AM / PM Toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 6 }}>
        {['AM', 'PM'].map((p) => (
          <motion.button
            key={p}
            onClick={() => setPeriod(p as 'AM' | 'PM')}
            whileTap={{ scale: 0.9 }}
            style={{
              padding: '10px 14px', borderRadius: 12,
              background: period === p ? 'var(--violet-dim)' : 'var(--surface-hi)',
              border: `1.5px solid ${period === p ? 'var(--violet)' : 'var(--border-hi)'}`,
              color: period === p ? 'var(--violet-lt)' : 'var(--text-sub)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: period === p ? '0 0 12px var(--violet-glow)' : 'var(--glass-inner-shadow)',
              transition: 'all 0.2s',
            }}
          >
            {p}
          </motion.button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="glass-card"
        style={{
          width: '100%', maxWidth: 360, padding: '32px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: 'var(--glass-inner-shadow), 0 30px 80px rgba(0,0,0,0.6)',
          border: '1px solid var(--border-glass)'
        }}
      >
        {/* Header */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Set Scheduled Time
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {renderDigitalDisplay()}

        {/* Analog Dial */}
        <div 
          ref={dialRef}
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          style={{
            position: 'relative', width: 260, height: 260, borderRadius: '50%',
            background: 'var(--surface-hi)', border: '1px solid var(--border-glass)',
            boxShadow: 'var(--glass-inner-shadow)', overflow: 'hidden', cursor: 'grab', touchAction: 'none'
          }}
        >
          {/* Inner ring background */}
          <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: 'var(--surface)', pointerEvents: 'none' }} />
          
          {/* Pointer */}
          <motion.div
            initial={false}
            animate={{ rotate: angle }}
            transition={{ type: 'spring', damping: 20, stiffness: 200, mass: 0.8 }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 2, height: 100, background: 'var(--violet)',
              transformOrigin: 'bottom center', marginTop: -100, marginLeft: -1, pointerEvents: 'none'
            }}
          >
            {/* Knob at end of pointer */}
            <div style={{ position: 'absolute', top: -16, left: -16, width: 34, height: 34, borderRadius: '50%', background: 'var(--violet)', opacity: 0.6 }} />
            <div style={{ position: 'absolute', top: -4, left: -4, width: 10, height: 10, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px var(--violet-glow)' }} />
          </motion.div>
          {/* Center dot */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 10, height: 10, background: 'var(--violet-lt)', borderRadius: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', boxShadow: '0 0 8px var(--violet)' }} />

          {/* Numbers */}
          {dialNumbers.map((num, i) => {
            const numAngle = i * 30; // 12 numbers = 30° each
            const rad = ((numAngle - 90) * Math.PI) / 180;
            const radius = 100;
            const x = 130 + radius * Math.cos(rad);
            const y = 130 + radius * Math.sin(rad);

            const isSelected = mode === 'hour' ? parseInt(hour,10) === parseInt(String(num===0?12:num),10) : parseInt(minute,10) === num;
            const valLabel = String(num).padStart(2,'0');

            return (
              <div
                key={i}
                style={{
                  position: 'absolute', left: x, top: y, width: 36, height: 36,
                  transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? '#fff' : 'var(--text-sub)',
                  pointerEvents: 'none', transition: 'color 0.2s', zIndex: 1
                }}
              >
                {valLabel}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onSave(hour, minute, period)}
          className="btn-primary"
          style={{ width: '100%', padding: '16px', borderRadius: 16, marginTop: 32, fontSize: 16, fontWeight: 800, 
            boxShadow: '0 8px 24px rgba(124,58,237,0.4), inset 0 2px 4px rgba(255,255,255,0.2)' 
          }}
        >
          Confirm Time
        </motion.button>
      </motion.div>
    </div>
  );
}
