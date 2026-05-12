import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ScreenshotJob } from '../lib/api';

interface UsageChartProps {
  history: ScreenshotJob[] | undefined;
}

type Range = '7d' | '14d' | '30d';

function generateDayRange(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

function formatLabel(dateStr: string, range: Range) {
  const d = new Date(dateStr + 'T00:00:00');
  if (range === '7d') {
    return d.toLocaleDateString('en', { weekday: 'short' }); // Mon, Tue…
  }
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' }); // May 1
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] px-3 py-2 shadow-xl text-xs font-sans">
      <p className="font-bold text-[var(--text)] mb-1">{label}</p>
      <p className="text-[var(--accent)]">
        {payload[0].value} screenshot{payload[0].value !== 1 ? 's' : ''}
      </p>
      {payload[1] && (
        <p className="text-[var(--success-text)]">{payload[1].value} succeeded</p>
      )}
      {payload[2] && (
        <p className="text-[var(--error-text)]">{payload[2].value} failed</p>
      )}
    </div>
  );
};

export function UsageChart({ history }: UsageChartProps) {
  const [range, setRange] = useState<Range>('7d');

  const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;

  const data = useMemo(() => {
    const dayRange = generateDayRange(days);
    const map: Record<string, { total: number; success: number; failed: number }> = {};
    dayRange.forEach(d => { map[d] = { total: 0, success: 0, failed: 0 }; });

    history?.forEach(job => {
      const day = job.createdAt.split('T')[0];
      if (map[day]) {
        map[day].total++;
        if (job.status === 'completed') map[day].success++;
        if (job.status === 'failed') map[day].failed++;
      }
    });

    return dayRange.map(d => ({
      date: formatLabel(d, range),
      total: map[d].total,
      success: map[d].success,
      failed: map[d].failed,
    }));
  }, [history, days, range]);

  const totalInRange = data.reduce((s, d) => s + d.total, 0);
  const peakDay = data.reduce((max, d) => d.total > max.total ? d : max, data[0]);

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black font-sans tracking-tight">Screenshot Activity</h3>
          <p className="text-xs font-sans text-[var(--text-muted)] mt-0.5">
            {totalInRange} requests in the last {days} days
            {peakDay?.total > 0 && ` · Peak: ${peakDay.total} on ${peakDay.date}`}
          </p>
        </div>
        {/* Range Selector */}
        <div className="flex gap-1 border border-[var(--border-subtle)] rounded-md overflow-hidden">
          {(['7d', '14d', '30d'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-bold font-sans transition-colors ${range === r
                ? 'bg-[var(--text)] text-[var(--bg)]'
                : 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]'
                }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-52">
        {totalInRange === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)] font-sans text-sm gap-2">
            <div className="text-3xl opacity-20">📊</div>
            No activity yet — make your first screenshot request to see data here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success-text)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--success-text)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#999' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono', fill: '#999' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#totalGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="success"
                stroke="var(--success-text)"
                strokeWidth={1.5}
                fill="url(#successGradient)"
                dot={false}
                activeDot={{ r: 3, fill: 'var(--success-text)', strokeWidth: 0 }}
                strokeDasharray="4 2"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1 border-t border-[var(--border-subtle)]">
        <span className="flex items-center gap-1.5 text-xs font-sans text-[var(--text-muted)]">
          <span className="w-3 h-0.5 bg-[var(--accent)] inline-block rounded" />
          Total
        </span>
        <span className="flex items-center gap-1.5 text-xs font-sans text-[var(--text-muted)]">
          <span className="w-3 h-0.5 bg-[var(--success-text)] inline-block rounded" style={{ backgroundImage: 'repeating-linear-gradient(to right, var(--success-text) 0, var(--success-text) 4px, transparent 4px, transparent 6px)' }} />
          Succeeded
        </span>
      </div>
    </div>
  );
}
