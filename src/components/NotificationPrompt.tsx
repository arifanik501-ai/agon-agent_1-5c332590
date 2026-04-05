import { Bell } from 'lucide-react';

interface Props { onAllow: () => void; onDeny: () => void; }

export default function NotificationPrompt({ onAllow, onDeny }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
      <div style={{ width: '100%', background: 'var(--modal-bg)', borderRadius: '28px 28px 0 0', border: '1px solid var(--border)', borderBottom: 'none',
        padding: '32px 24px', paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
        animation: 'staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--violet-dim)', border: '2px solid rgba(124,58,237,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 28px var(--violet-dim)' }}>
          <Bell size={32} color="var(--violet-lt)" />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: '0 0 10px' }}>Stay on Track</h2>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', lineHeight: 1.6, margin: 0 }}>Enable notifications so 30 Days Goal can remind you at each task's scheduled time — every day, for 30 days.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={onAllow} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: 16, fontWeight: 700 }}>Enable Reminders</button>
          <button onClick={onDeny} className="btn-ghost" style={{ width: '100%', padding: '14px', fontSize: 15 }}>Not Now</button>
        </div>
      </div>
    </div>
  );
}
