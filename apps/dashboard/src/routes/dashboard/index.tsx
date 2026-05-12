import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import { useApiKeys, useScreenshotHistory } from '../../lib/api';
import {
  Key01Icon,
  Camera01Icon,
  ActivityIcon,
  ArrowRight01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { UsageChart } from '../../components/UsageChart';
import { Card, Badge, CodeBlock } from '../../components/ui';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { data: keys } = useApiKeys();
  const { data: history } = useScreenshotHistory();

  const successCount = history?.filter(j => j.status === 'COMPLETED').length ?? 0;
  const totalCount = history?.length ?? 0;
  const successRate = totalCount > 0 ? `${((successCount / totalCount) * 100).toFixed(1)}%` : '—';

  const avgRenderMs = useMemo(() => {
    const times = history?.filter(j => j.renderTimeMs).map(j => j.renderTimeMs!) ?? [];
    if (!times.length) return '—';
    return `${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms`;
  }, [history]);

  const stats = [
    { label: 'Active Keys', value: keys?.length ?? 0, icon: Key01Icon, color: 'text-blue-400', bg: 'bg-blue-950/50' },
    { label: 'Total Screenshots', value: totalCount, icon: Camera01Icon, color: 'text-violet-400', bg: 'bg-violet-950/50' },
    { label: 'Success Rate', value: successRate, icon: ActivityIcon, color: 'text-emerald-400', bg: 'bg-emerald-950/50' },
    { label: 'Avg Render Time', value: avgRenderMs, icon: Clock01Icon, color: 'text-amber-400', bg: 'bg-amber-950/50' },
  ];

  return (
    <div className="max-w-6xl px-2 md:px-4 lg:px-6 mx-auto w-full space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-3 p-4">
            <div className={`p-2 rounded-md border border-[var(--border)] ${stat.bg} ${stat.color} shrink-0`}>
              <HugeiconsIcon icon={stat.icon} size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--text-muted)] truncate">{stat.label}</p>
              <h3 className="tracking-tight">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Usage Chart — full width */}
      <UsageChart history={history} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Start */}
        <Card>
          <h3 className="mb-4 text-[var(--text)]">Quick Start</h3>
          <div className="space-y-3">
            <CodeBlock
              language="bash"
              code="npm install @snapforge/sdk"
              label="1. Install the SDK"
            />
            <CodeBlock
              language="typescript"
              code={`const snap = new SnapForge({\n  apiKey: "sf_live_..."\n});`}
              label="2. Initialize client"
            />
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[var(--text)]">Recent Activity</h3>
            <Link to="/dashboard/history" className="text-xs font-bold text-[var(--accent)] uppercase flex items-center gap-1 hover:underline">
              View all <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {history?.slice(0, 5).map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--surface-subtle)] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-md flex items-center justify-center overflow-hidden shrink-0">
                    {job.imageUrl ? (
                      <img src={job.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <HugeiconsIcon icon={Camera01Icon} size={14} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-sans truncate">{job.url}</p>
                    <p className="text-xs text-[var(--text-muted)] font-sans">
                      {new Date(job.createdAt).toLocaleDateString()}
                      {job.renderTimeMs ? ` · ${job.renderTimeMs}ms` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 ml-2">
                  <Badge variant={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'error' : 'warning'}>
                    {job.status}
                  </Badge>
                  {job.diffPercentage !== undefined && job.diffPercentage > 0 && (
                    <div className="text-[10px] font-bold text-red-400 font-mono">
                      Δ {job.diffPercentage.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!history?.length && (
              <div className="text-center py-8 text-[var(--text-muted)] font-sans text-sm">
                No recent activity found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
