import { useState, useRef, useEffect } from 'react';
import { X, Lock, Unlock } from 'lucide-react';

interface Props { onUnlock: () => void; onClose: () => void; }
const CORRECT_PIN = '2645';
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 60;

export default function UnlockModal({ onUnlock, onClose }: Props) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedOut, setLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100); }, []);
  useEffect(() => {
    if (!lockedOut) return;
    setCountdown(LOCKOUT_SECONDS);
    const iv = setInterval(() => setCountdown(p => { if (p <= 1) { clearInterval(iv); setLockedOut(false); setAttempts(0); return 0; } return p - 1; }), 1000);
    return () => clearInterval(iv);
  }, [lockedOut]);

  function handleSubmit() {
    if (lockedOut) return;
    if (pin === CORRECT_PIN) { onUnlock(); return; }
    const na = attempts + 1; setAttempts(na); setPin('');
    setError(na >= MAX_ATTEMPTS ? '' : `Wrong PIN. ${MAX_ATTEMPTS - na} attempt${MAX_ATTEMPTS - na !== 1 ? 's' : ''} left.`);
    setShake(true); setTimeout(() => setShake(false), 500);
    if ('vibrate' in navigator) navigator.vibrate([80,40,80]);
    if (na >= MAX_ATTEMPTS) { setLockedOut(true); setError(''); }
  }

  function handleNumpad(key: string) {
    if (lockedOut) return;
    if (key === '⌫') { setPin(p => p.slice(0,-1)); setError(''); return; }
    if (pin.length < 4) setPin(p => p + key);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', padding: '0 24px' }}
      onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal aria-label="Unlock app">
      <div className={shake ? 'shake' : ''}
        style={{ width: '100%', maxWidth: 340, background: 'var(--modal-bg)', borderRadius: 24, border: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center', boxShadow: '0 0 60px rgba(0,0,0,0.2)', animation: 'staggerIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
        </div>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--violet-dim)', border: '2px solid rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 20px var(--violet-dim)' }}>
          <Lock size={28} color="var(--violet-lt)" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px' }}>Unlock Commitment</h2>
        <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: '0 0 24px', lineHeight: 1.5 }}>Enter your 4-digit PIN to unlock and edit tasks.</p>

        {lockedOut ? (
          <div style={{ padding: '20px', borderRadius: 14, background: 'var(--red-dim)', border: '1px solid var(--red-border)', marginBottom: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>{countdown}s</div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 6 }}>Too many attempts. Try again in {countdown}s.</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', transition: 'all 0.2s ease',
                  background: i < pin.length ? 'var(--violet)' : 'var(--surface)',
                  border: `2px solid ${i < pin.length ? 'var(--violet)' : 'var(--border)'}`,
                  boxShadow: i < pin.length ? '0 0 10px var(--violet-dim)' : undefined }} />
              ))}
            </div>
            <input ref={inputRef} type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g,'').slice(0,4)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} aria-label="Enter PIN" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, idx) => (
                <button key={idx} onClick={() => key && handleNumpad(key)} disabled={!key}
                  style={{ height: 54, borderRadius: 13, background: key ? 'var(--surface)' : 'transparent', border: key ? '1px solid var(--border)' : 'none',
                    color: key === '⌫' ? 'var(--text-sub)' : 'var(--text)', fontSize: key === '⌫' ? 20 : 18, fontWeight: 600, fontFamily: 'Inter,sans-serif',
                    cursor: key ? 'pointer' : 'default', transition: 'background 0.15s ease, transform 0.1s ease' }}
                  onPointerDown={e => { if (key) (e.currentTarget as HTMLElement).style.transform = 'scale(0.93)'; }}
                  onPointerUp={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                  onPointerLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
                  {key}
                </button>
              ))}
            </div>
            {error && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={pin.length !== 4}
              className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pin.length !== 4 ? 0.4 : 1 }}>
              <Unlock size={16} /> Unlock
            </button>
          </>
        )}
      </div>
    </div>
  );
}
