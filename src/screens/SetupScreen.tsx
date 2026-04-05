import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Lock, Clock, Cloud, CloudCheck, RotateCw, AlertCircle, ChevronLeft } from 'lucide-react';
import type { Task } from '../lib/store';
import { pushToCloud, loadState } from '../lib/store';

interface Props {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onLock: () => void;
  onManualSync?: () => Promise<void>;
  onLogout?: () => void;
}

interface TaskForm { name: string; hour: string; minute: string; period: 'AM' | 'PM'; description: string; }
const emptyForm = (): TaskForm => ({ name: '', hour: '08', minute: '00', period: 'AM', description: '' });

export default function SetupScreen({ tasks, onTasksChange, onLock, onManualSync, onLogout }: Props) {
  const [form, setForm] = useState<TaskForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(true);
  const [errors, setErrors] = useState<Partial<TaskForm>>({});
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const formRef = useRef<HTMLDivElement>(null);
  const canLock = tasks.length >= 1;

  function toTime24(h: string, m: string, period: 'AM' | 'PM') {
    let hour = parseInt(h, 10);
    if (period === 'AM' && hour === 12) hour = 0;
    if (period === 'PM' && hour !== 12) hour += 12;
    return `${String(hour).padStart(2,'0')}:${m.padStart(2,'0')}`;
  }

  function validate() {
    const errs: Partial<TaskForm> = {};
    if (!form.name.trim()) errs.name = 'Task name required';
    setErrors(errs); return Object.keys(errs).length === 0;
  }

  function addTask() {
    if (!validate()) return;
    const time24 = toTime24(form.hour, form.minute, form.period);
    if (editingId) {
      onTasksChange(tasks.map(t => t.id === editingId ? { ...t, name: form.name.trim(), time: time24, description: form.description.trim() } : t).sort((a,b) => a.time.localeCompare(b.time)));
      setEditingId(null);
    } else {
      onTasksChange([...tasks, { id: crypto.randomUUID(), name: form.name.trim(), time: time24, description: form.description.trim() }].sort((a,b) => a.time.localeCompare(b.time)));
    }
    setForm(emptyForm()); setShowAddForm(false);
  }

  function removeTask(id: string) { onTasksChange(tasks.filter(t => t.id !== id)); }

  function startEdit(task: Task) {
    const [h24, m] = task.time.split(':').map(Number);
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    setForm({ name: task.name, hour: String(h12).padStart(2,'0'), minute: String(m).padStart(2,'0'), period, description: task.description });
    setEditingId(task.id); setShowAddForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  function fmt12(time: string) {
    const [h, m] = time.split(':').map(Number);
    const p = h >= 12 ? 'PM' : 'AM'; const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${String(m).padStart(2,'0')} ${p}`;
  }

  async function handleManualSync() {
    if (syncState === 'syncing') return;
    setSyncState('syncing');
    try {
      const ok = await pushToCloud(loadState());
      setSyncState(ok ? 'done' : 'error');
      if (ok && onManualSync) await onManualSync();
    } catch { setSyncState('error'); }
    finally { setTimeout(() => setSyncState('idle'), 4000); }
  }

  const hours   = Array.from({ length: 12 }, (_, i) => String(i+1).padStart(2,'0'));
  const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];

  const syncBg = syncState === 'done' ? 'var(--green-dim)' : syncState === 'error' ? 'var(--red-dim)' : 'var(--violet-dim)';
  const syncBorder = syncState === 'done' ? 'var(--green-border)' : syncState === 'error' ? 'var(--red-border)' : syncState === 'syncing' ? 'rgba(124,58,237,0.45)' : 'rgba(124,58,237,0.2)';
  const syncColor = syncState === 'done' ? 'var(--green)' : syncState === 'error' ? 'var(--red)' : 'var(--text)';
  const syncIconColor = syncState === 'done' ? 'var(--green)' : syncState === 'error' ? 'var(--red)' : 'var(--violet-lt)';

  return (
    <div style={{ padding: '0 16px 120px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Setup Phase</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>Build Your<br /><span className="gradient-text">Habit Lock</span></h1>
          <p style={{ fontSize: 14, color: 'var(--text-sub)', marginTop: 10, lineHeight: 1.55 }}>Add habits and lock when ready — starts April 4, 2026.</p>
        </div>
        {onLogout && (
          <button 
            onClick={onLogout} 
            style={{ 
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text-sub)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', marginTop: 4
            }}
            aria-label="Back to Dashboard"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </motion.div>

      {/* Counter card */}
      <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1, ease: [0.22,1,0.36,1] }}
        className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22, padding: '18px 20px' }}>
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <svg width={64} height={64} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={32} cy={32} r={24} fill="none" stroke="var(--border)" strokeWidth={6} />
            <circle cx={32} cy={32} r={24} fill="none" stroke="url(#setupGrad)" strokeWidth={6} strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 24}
              strokeDashoffset={2 * Math.PI * 24 * (1 - Math.min(tasks.length / 10, 1))}
              style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.22,1,0.36,1)', filter: 'drop-shadow(0 0 4px var(--violet-glow))' }} />
            <defs><linearGradient id="setupGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4F46E5" /><stop offset="100%" stopColor="var(--violet-lt)" /></linearGradient></defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: 'var(--violet-lt)' }}>{tasks.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
            {tasks.length}<span style={{ color: 'var(--text-faint)', fontSize: 14, fontWeight: 500 }}> task{tasks.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 5 }}>
            {tasks.length === 0 ? 'Add at least 1 task to lock' : canLock ? '✓ Ready to lock anytime' : `Add more or lock with ${tasks.length}`}
          </div>
        </div>
      </motion.div>

      {/* Task list */}
      <AnimatePresence>
        {tasks.map((task, i) => (
          <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }} transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }} style={{ marginBottom: 10 }}>
            <div className="glass-card card-press" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--violet-dim)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--violet-lt)', flexShrink: 0 }}>{i+1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{fmt12(task.time)}{task.description && ` · ${task.description}`}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => startEdit(task)} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--violet-dim)', border: '1px solid rgba(124,58,237,0.25)', color: 'var(--violet-lt)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={`Edit task ${i+1}`}><Clock size={14} /></button>
                <button onClick={() => removeTask(task.id)} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--red-dim)', border: '1px solid var(--red-border)', color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={`Remove task ${i+1}`}><Trash2 size={14} /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add toggle */}
      {!showAddForm && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowAddForm(true)}
          style={{ width: '100%', padding: '14px', borderRadius: 14, marginBottom: 16, background: 'var(--violet-dim)', border: '1.5px dashed rgba(124,58,237,0.35)', color: 'var(--violet-lt)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Plus size={17} /> Add another task
        </motion.button>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div ref={formRef as React.RefObject<HTMLDivElement>} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
            className="glass-card glass-card-violet" style={{ padding: '20px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--violet-lt)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} />{editingId ? 'Edit Task' : `Task ${tasks.length + 1}`}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Task Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Morning meditation" maxLength={60}
                className="liquid-input" style={{ borderColor: errors.name ? 'var(--red)' : undefined }} />
              {errors.name && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{errors.name}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 6, fontWeight: 600 }}>Scheduled Time</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.hour} onChange={e => setForm(f => ({ ...f, hour: e.target.value }))} className="liquid-select" style={{ flex: 1 }}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', fontWeight: 700, fontSize: 18 }}>:</div>
                <select value={form.minute} onChange={e => setForm(f => ({ ...f, minute: e.target.value }))} className="liquid-select" style={{ flex: 1 }}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value as 'AM'|'PM' }))} className="liquid-select">
                  <option value="AM">AM</option><option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-sub)', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Description <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional, 80 chars)</span>
              </label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0,80) }))} placeholder="Brief description..." maxLength={80} className="liquid-input" />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'right', marginTop: 3 }}>{form.description.length}/80</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addTask} className="btn-primary" style={{ flex: 1, padding: '13px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Plus size={17} />{editingId ? 'Update' : 'Add Task'}
              </button>
              {(editingId || tasks.length > 0) && (
                <button onClick={() => { setEditingId(null); setForm(emptyForm()); setShowAddForm(false); }} className="btn-ghost" style={{ padding: '13px 16px', fontSize: 14 }}>Cancel</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync + Lock */}
      <AnimatePresence>
        {canLock && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}>

            {/* Sync card */}
            <div className="glass-card" style={{ padding: '18px', marginBottom: 12, background: syncBg, borderColor: syncBorder }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: syncBg, border: `1px solid ${syncBorder}` }}>
                  <span style={{ display: 'flex', color: syncIconColor, animation: syncState === 'syncing' ? 'spinOnce 1s linear infinite' : undefined }}>
                    {syncState === 'done' ? <CloudCheck size={20} /> : syncState === 'error' ? <AlertCircle size={20} /> : syncState === 'syncing' ? <RotateCw size={20} /> : <Cloud size={20} />}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: syncColor, marginBottom: 2 }}>
                    {syncState === 'syncing' ? 'Saving to cloud…' : syncState === 'done' ? `${tasks.length} task${tasks.length !== 1 ? 's' : ''} saved!` : syncState === 'error' ? 'Sync failed' : `Save ${tasks.length} task${tasks.length !== 1 ? 's' : ''} to cloud`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                    {syncState === 'done' ? 'Visible on all devices instantly' : syncState === 'error' ? 'Check connection — tap to retry' : 'Backs up so anyone can view'}
                  </div>
                </div>
              </div>
              <button onClick={handleManualSync} disabled={syncState === 'syncing'} className="btn-primary"
                style={{ width: '100%', padding: '13px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: syncState === 'done' ? 'linear-gradient(135deg,#059669,#10B981)' : syncState === 'error' ? 'linear-gradient(135deg,#DC2626,#EF4444)' : undefined,
                  opacity: syncState === 'syncing' ? 0.6 : 1 }}>
                <span style={{ display: 'flex', animation: syncState === 'syncing' ? 'spinOnce 1s linear infinite' : undefined }}>
                  {syncState === 'done' ? <CloudCheck size={16} /> : <RotateCw size={16} />}
                </span>
                {syncState === 'syncing' ? 'Saving…' : syncState === 'done' ? 'Sync again' : syncState === 'error' ? 'Retry sync' : 'Sync to Cloud'}
              </button>
            </div>

            {/* Lock button */}
            <button onClick={onLock} className="btn-primary pulse-glow"
              style={{ width: '100%', padding: '18px', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Lock size={20} /> Lock {tasks.length} Habit{tasks.length !== 1 ? 's' : ''} — 30 Days
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginTop: 10 }}>Starting April 4, 2026 · {tasks.length} habit{tasks.length !== 1 ? 's' : ''} · 30 days</p>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 && !showAddForm && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)', fontSize: 14 }}>Tap "Add another task" to get started</div>
      )}
    </div>
  );
}
