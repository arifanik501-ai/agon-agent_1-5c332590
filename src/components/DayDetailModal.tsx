import type { Task, DayRecord } from '../lib/store';
import { formatTime12 } from '../lib/store';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  dayNum: number;
  date: string;
  tasks: Task[];
  record: DayRecord | undefined;
  onClose: () => void;
}

export default function DayDetailModal({ dayNum, date, tasks, record, onClose }: Props) {
  const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal aria-label={`Day ${dayNum} details`}>
      <div style={{ width: '100%', maxHeight: '80dvh', background: 'var(--modal-bg)', borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
        padding: '24px 20px', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))', overflowY: 'auto',
        animation: 'staggerIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards' }}>
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Day {dayNum}</div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 2 }}>{dateStr}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dim)' }}>
            <X size={15} />
          </button>
        </div>

        {record && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <div style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--green-dim)', border: '1px solid var(--green-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>{tasks.filter(t => record.completions[t.id]).length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Completed</div>
            </div>
            <div style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--red-dim)', border: '1px solid var(--red-border)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)' }}>{tasks.filter(t => !record.completions[t.id]).length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Missed</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((task, i) => {
            const done = record?.completions[task.id];
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                background: done ? 'var(--green-dim)' : 'var(--red-dim)',
                border: `1px solid ${done ? 'var(--green-border)' : 'var(--red-border)'}` }}>
                {done ? <CheckCircle size={18} color="var(--green)" /> : <XCircle size={18} color="var(--red)" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i+1}. {task.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{formatTime12(task.time)}</div>
                </div>
              </div>
            );
          })}
        </div>
        {!record && <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-faint)', fontSize: 14 }}>No data recorded for this day</div>}
      </div>
    </div>
  );
}
