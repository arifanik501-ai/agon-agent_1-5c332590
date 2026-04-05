import { Lock, AlertTriangle } from 'lucide-react';

interface Props { taskCount: number; onConfirm: () => void; onCancel: () => void; goalDate?: string; }

export default function LockConfirmModal({ taskCount, onConfirm, onCancel, goalDate }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      role="dialog" aria-modal aria-label="Confirm lock">
      <div style={{ width: '100%', background: 'var(--modal-bg)', borderRadius: '28px 28px 0 0', border: '1px solid var(--border)', borderBottom: 'none',
        padding: '32px 24px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
        animation: 'staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 24px' }} />
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--violet-dim)', border: '2px solid rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 28px var(--violet-dim)' }}>
          <Lock size={32} color="var(--violet-lt)" />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '0 0 10px' }}>Lock & Commit</h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6, margin: 0 }}>
            Locking <strong style={{ color: 'var(--violet-lt)' }}>{taskCount} habit{taskCount !== 1 ? 's' : ''}</strong> for{' '}
            <strong style={{ color: 'var(--violet-lt)' }}>30 consecutive days</strong> starting {(() => { const gd = goalDate || '2026-04-06'; const [gy, gm, gdd] = gd.split('-').map(Number); return new Date(gy, gm - 1, gdd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); })()}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '14px', borderRadius: 12, background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', marginBottom: 24 }}>
          <AlertTriangle size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: 'var(--text-sub)', margin: 0, lineHeight: 1.5 }}>
            Once locked, tasks <strong style={{ color: 'var(--amber)' }}>cannot be edited or deleted</strong> until the 30-day cycle completes.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onConfirm} className="btn-primary" style={{ width: '100%', padding: '18px', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Lock size={20} /> Yes — Lock {taskCount} Habit{taskCount !== 1 ? 's' : ''} for 30 Days
          </button>
          <button onClick={onCancel} className="btn-ghost" style={{ width: '100%', padding: '14px', fontSize: 15 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
