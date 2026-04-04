import { useEffect } from 'react';
import type { Task } from '../lib/store';
import { formatTime12 } from '../lib/store';
import { Bell } from 'lucide-react';

interface Props {
  task: Task;
  taskIndex: number;
  dayNum: number;
  onDismiss: () => void;
}

export default function InAppAlarm({ task, taskIndex, dayNum, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 30000); // auto-dismiss after 30s
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: '0 24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))',
        border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 24,
        padding: '32px 24px',
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(124,58,237,0.3)',
        animation: 'staggerIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(124,58,237,0.2)',
          border: '2px solid rgba(124,58,237,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          animation: 'pulseGlow 1.5s ease-in-out infinite',
        }}>
          <Bell size={28} color="#9B59F5" />
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Task {taskIndex + 1} of 10 · Day {dayNum} of 30
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.2 }}>
          {task.name}
        </h2>

        <div style={{ fontSize: 14, color: 'var(--text-sub)', marginBottom: 6 }}>
          Scheduled for {formatTime12(task.time)}
        </div>

        {task.description && (
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24 }}>
            {task.description}
          </div>
        )}

        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
            border: 'none',
            color: 'var(--text)',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}
