import { useRef, useEffect } from 'react';
import type { Task, DayRecord } from '../lib/store';
import { getDayStatus, getDateForDay } from '../lib/store';

interface Props {
  startDate: string;
  currentDay: number;
  tasks: Task[];
  records: Record<string, DayRecord>;
  onDayTap: (dayNum: number, date: string) => void;
}

export default function CalendarStrip({ startDate, currentDay, tasks, records, onDayTap }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-day="${currentDay}"]`) as HTMLElement;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentDay]);

  const statusColor: Record<string, string> = {
    complete: 'var(--green)',
    partial:  'var(--amber)',
    missed:   'var(--red)',
    future:   'var(--border)',
    today:    'var(--violet)',
  };

  const statusBg: Record<string, string> = {
    complete: 'rgba(16,185,129,0.10)',
    partial:  'rgba(245,158,11,0.08)',
    missed:   'rgba(239,68,68,0.08)',
    future:   'var(--surface)',
    today:    'rgba(124,58,237,0.12)',
  };

  return (
    <div ref={scrollRef}
      style={{
        display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 6,
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        maskImage: 'linear-gradient(90deg, transparent, black 3%, black 97%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, black 3%, black 97%, transparent)',
      }}
      role="list" aria-label="30-day calendar">
      {Array.from({ length: 30 }, (_, i) => {
        const d = i + 1;
        const date = getDateForDay(startDate, d);
        const status = getDayStatus(date, tasks, records);
        const isToday = d === currentDay;
        const isPast = d < currentDay;
        const color = statusColor[status] || statusColor.future;
        const bg = statusBg[status] || statusBg.future;
        return (
          <button key={d} data-day={d} role="listitem" aria-label={`Day ${d}: ${status}`}
            onClick={() => (isPast || isToday) ? onDayTap(d, date) : undefined}
            className={isToday ? 'day-pulse' : ''}
            style={{
              flexShrink: 0, width: 40, height: 54, borderRadius: 16, padding: 0,
              background: bg,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `${isToday ? 2 : 1}px solid ${isToday ? color : `${color}44`}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
              cursor: isPast || isToday ? 'pointer' : 'default',
              transition: 'transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.2s ease',
              boxShadow: isToday
                ? `0 0 16px ${color}44, inset 0 1px 1px rgba(255,255,255,0.08)`
                : status === 'complete'
                ? `0 0 8px rgba(16,185,129,0.15), inset 0 1px 1px rgba(255,255,255,0.05)`
                : 'inset 0 1px 1px rgba(255,255,255,0.04)',
              position: 'relative',
              overflow: 'hidden',
            }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: isToday ? 'var(--violet-lt)' : status === 'complete' ? 'var(--green)' : 'var(--text-dim)',
              lineHeight: 1
            }}>
              D{d}
            </span>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: color,
              boxShadow: isToday ? `0 0 10px ${color}` : status === 'complete' ? `0 0 6px ${color}66` : undefined,
              transition: 'all 0.3s ease',
            }} />
          </button>
        );
      })}
    </div>
  );
}
