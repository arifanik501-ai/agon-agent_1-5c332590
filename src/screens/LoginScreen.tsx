import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { onAuthenticated: () => void; }
const CORRECT_CODE = '2645';

export default function LoginScreen({ onAuthenticated }: Props) {
  const [code, setCode] = useState(['','','','']);
  const [status, setStatus] = useState<'idle'|'error'|'success'>('idle');
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement|null>>([null,null,null,null]);

  useEffect(() => { if (code.every(d => d !== '')) handleSubmit(code.join('')); }, [code]);

  function handleSubmit(full: string) {
    if (full === CORRECT_CODE) {
      setStatus('success');
      if ('vibrate' in navigator) navigator.vibrate(100);
      setTimeout(() => onAuthenticated(), 700);
    } else {
      setAttempts(a => a + 1); setStatus('error'); setShake(true);
      if ('vibrate' in navigator) navigator.vibrate([80,40,80]);
      setTimeout(() => { setShake(false); setStatus('idle'); setCode(['','','','']); }, 650);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,4);
    if (p) { const n = ['','','','']; p.split('').forEach((d,i) => { n[i] = d; }); setCode(n); inputRefs.current[Math.min(p.length,3)]?.focus(); }
  }

  function handleNumpad(key: string) {
    if (status === 'error') return;
    if (key === '⌫') {
      const last = [...code].map((d,i) => ({d,i})).filter(x => x.d).pop();
      if (last) { const n = [...code]; n[last.i] = ''; setCode(n); }
      return;
    }
    const ei = code.findIndex(d => d === '');
    if (ei === -1) return;
    const n = [...code]; n[ei] = key; setCode(n);
  }

  const filled = code.filter(d => d !== '').length;

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      paddingTop: 'calc(env(safe-area-inset-top,0px) + 24px)',
      paddingBottom: 'calc(24px + env(safe-area-inset-bottom,0px))',
      position: 'relative',
    }}>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        className={shake ? 'shake' : ''}
        style={{
          width: '100%', maxWidth: 360,
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
          WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
          borderRadius: 32,
          border: `1px solid ${status === 'error' ? 'var(--red-border)' : status === 'success' ? 'var(--green-border)' : 'var(--border-glass)'}`,
          padding: '44px 28px 36px',
          position: 'relative', overflow: 'hidden',
          boxShadow: status === 'success'
            ? '0 0 60px rgba(16,185,129,0.18), var(--glass-inner-shadow), 0 20px 60px rgba(0,0,0,0.4)'
            : 'var(--glass-inner-shadow), 0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,58,237,0.06)',
          transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
        }}
      >
        {/* Top highlight edge */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
          background: status === 'success'
            ? 'linear-gradient(90deg,transparent 10%,rgba(16,185,129,0.6) 50%,transparent 90%)'
            : 'linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.2) 50%,transparent 90%)',
          transition: 'background 0.4s ease',
        }} />

        {/* Inner refraction */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          borderRadius: '28px 28px 0 0',
          pointerEvents: 'none',
        }} />

        {/* Icon */}
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.12, ease: [0.22,1,0.36,1] }}
          style={{ display: 'flex', justifyContent: 'center', marginBottom: 26, position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 22,
            background: status === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(124,58,237,0.12)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1.5px solid ${status === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(124,58,237,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 24px ${status === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(124,58,237,0.15)'}, inset 0 1px 2px rgba(255,255,255,0.1)`,
            transition: 'all 0.4s ease',
          }}>
            <AnimatePresence mode="wait">
              {status === 'success'
                ? <motion.svg key="check" initial={{ scale:0,rotate:-20 }} animate={{ scale:1,rotate:0 }} exit={{ scale:0 }} transition={{ duration:0.35,ease:[0.22,1,0.36,1] }} width={28} height={28} viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="var(--green)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></motion.svg>
                : <motion.svg key="lock" initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }} transition={{ duration:0.3,ease:[0.22,1,0.36,1] }} width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="10" rx="3" fill={status === 'error' ? 'var(--red-dim)' : 'var(--violet-dim)'} stroke={status === 'error' ? 'var(--red)' : 'var(--violet-lt)'} strokeWidth={1.5} />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={status === 'error' ? 'var(--red)' : 'var(--violet-lt)'} strokeWidth={1.5} strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1.5" fill={status === 'error' ? 'var(--red)' : 'var(--violet-lt)'} />
                  </motion.svg>
              }
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ type:'spring', damping:20, stiffness:300, delay:0.1 }} style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 25, fontWeight: 900, color: 'var(--text)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {status === 'success' ? <span className="gradient-text">Access Granted</span> : 'Enter Access Code'}
          </h1>
          <AnimatePresence mode="wait">
            <motion.p key={status === 'error' ? 'err' : attempts > 0 ? 'retry' : 'default'}
              initial={{ opacity:0,y:6 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-6 }} transition={{ duration:0.25, type:'spring', bounce:0 }}
              style={{ fontSize: 13, color: status === 'error' ? 'var(--red)' : 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
              {status === 'error' ? `Incorrect code${attempts > 1 ? ` · ${attempts} attempts` : ''}` : status === 'success' ? 'Welcome back…' : attempts > 0 ? 'Try again' : '4-digit code required'}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {/* Digit cells */}
        <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.45,delay:0.24,ease:[0.22,1,0.36,1] }}
          style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 30, position: 'relative', zIndex: 1 }} onPaste={handlePaste}>
          {code.map((digit, i) => {
            const hasDot = digit !== '';
            const dotColor = status==='error' ? 'var(--red)' : status==='success' ? 'var(--green)' : 'var(--violet-lt)';
            return (
              <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                  animate={{ scale: hasDot ? 1 : 1, borderColor: hasDot ? (status==='error' ? 'var(--red-border)' : status==='success' ? 'var(--green-border)' : 'rgba(124,58,237,0.5)') : 'var(--border)' }}
                  transition={{ duration: 0.2 }}
                  style={{
                    width: 56, height: 64, borderRadius: 18, cursor: 'text',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: hasDot
                      ? (status==='error' ? 'rgba(239,68,68,0.08)' : status==='success' ? 'rgba(16,185,129,0.08)' : 'rgba(124,58,237,0.10)')
                      : 'var(--surface)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1.5px solid ${hasDot ? (status==='error' ? 'var(--red-border)' : status==='success' ? 'var(--green-border)' : 'rgba(124,58,237,0.45)') : 'var(--border)'}`,
                    boxShadow: hasDot
                      ? `0 0 16px ${status==='error' ? 'rgba(239,68,68,0.1)' : status==='success' ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.12)'}, inset 0 1px 2px rgba(255,255,255,0.06)`
                      : 'inset 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.04)',
                    transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                  }}>
                  <AnimatePresence>
                    {hasDot && <motion.div initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }} transition={{ duration:0.2,ease:[0.22,1,0.36,1] }}
                      style={{ width:11,height:11,borderRadius:'50%',background:dotColor,boxShadow:`0 0 10px ${dotColor}44` }} />}
                  </AnimatePresence>
                </motion.div>
                <input
                  ref={el => { inputRefs.current[i] = el; }}
                  type="tel" inputMode="none" readOnly tabIndex={-1}
                  value={digit} onChange={() => {}} onPaste={handlePaste}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'text', fontSize: 16, pointerEvents: 'none' }}
                  aria-label={`Digit ${i+1} of 4`}
                />
              </div>
            );
          })}
        </motion.div>

        {/* Progress bar */}
        <motion.div initial={{ opacity:0, scaleX:0 }} animate={{ opacity:1, scaleX:1 }} transition={{ delay:0.2, duration:0.4 }}
          style={{ marginBottom: 32, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative', zIndex: 1, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)' }}>
          <motion.div animate={{ width: `${(filled/4)*100}%` }} transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            style={{ height:'100%', borderRadius:4,
              background: status==='error' ? 'var(--red)' : status==='success' ? 'var(--green)' : `linear-gradient(90deg,var(--violet),var(--violet-bright))`,
              boxShadow: `0 0 16px ${status==='error'?'var(--red)':status==='success'?'var(--green)':'var(--violet-bright)'}`,
              transition: 'background 0.3s ease' }} />
        </motion.div>

        {/* Numpad — frosted glass buttons */}
        <motion.div initial={{ opacity:0,y:14 }} animate={{ opacity:1,y:0 }} transition={{ type:'spring', damping:22, stiffness:280, delay:0.2 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, position: 'relative', zIndex: 1 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, idx) => {
            const isEmpty = key === ''; const isBack = key === '⌫';
            return (
              <motion.button
                key={idx}
                onClick={() => !isEmpty && handleNumpad(key)}
                disabled={isEmpty || status==='success'}
                whileHover={!isEmpty ? { scale: 1.05, y: -2, background: 'var(--surface-hi)', borderColor: 'var(--border-hi)', boxShadow: '0 8px 20px var(--violet-glow), var(--glass-inner-shadow)' } : undefined}
                whileTap={!isEmpty ? { scale: 0.92, y: 1 } : undefined}
                aria-label={isBack ? 'Delete' : isEmpty ? undefined : key}
                style={{
                  height: 60, borderRadius: 20,
                  background: isEmpty ? 'transparent' : 'var(--surface)',
                  backdropFilter: isEmpty ? undefined : 'blur(20px)',
                  WebkitBackdropFilter: isEmpty ? undefined : 'blur(20px)',
                  border: isEmpty ? 'none' : '1.5px solid var(--border)',
                  color: isBack ? 'var(--text-sub)' : 'var(--text)',
                  fontSize: 22, fontWeight: isBack ? 400 : 700,
                  fontFamily: 'Inter, sans-serif',
                  cursor: isEmpty ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isEmpty ? 'none' : 'var(--glass-inner-shadow)',
                  transition: 'background 0.25s ease, border-color 0.25s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {key}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45,duration:0.4 }}
          style={{ textAlign:'center', fontSize:11, color:'var(--text-faint)', margin:'22px 0 0', letterSpacing:'0.03em', position: 'relative', zIndex: 1 }}>
          30 Days Goal · 30-Day Habit System
        </motion.p>
      </motion.div>
    </div>
  );
}
