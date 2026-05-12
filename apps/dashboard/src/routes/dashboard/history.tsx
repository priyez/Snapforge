import { createFileRoute } from '@tanstack/react-router';
import { useScreenshotHistory } from '../../lib/api';
import {
  Camera01Icon,
  Download01Icon,
  Link01Icon,
  FilterIcon,
  SearchIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button, Card, Badge, Input } from '../../components/ui';

export const Route = createFileRoute('/dashboard/history')({
  component: HistoryPage,
});

function HistoryPage() {
  const { data: history, isLoading } = useScreenshotHistory();

  return (
    <div className="max-w-6xl px-2 md:px-4 lg:px-6 mx-auto w-full space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <Input 
          placeholder="Search URLs..." 
          icon={SearchIcon} 
          className="max-w-sm"
        />
        <Button variant="outline" icon={FilterIcon}>
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {history?.map((job) => (
          <Card key={job.id} noPadding className="overflow-hidden flex flex-col group">
            <div className="aspect-video bg-[var(--bg)] relative overflow-hidden border-b border-[var(--border)]">
              {job.imageUrl ? (
                <img
                  src={job.imageUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  alt={job.url}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-2">
                  <HugeiconsIcon icon={Camera01Icon} size={32} />
                  <span className="text-sm font-bold font-sans uppercase tracking-tight">{job.status}</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
                <Badge variant={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'error' : 'warning'}>
                  {job.status}
                </Badge>
                {job.diffPercentage !== undefined && job.diffPercentage > 0 && (
                  <Badge variant={job.diffPercentage > 5 ? 'error' : 'warning'} className="bg-opacity-10">
                    Δ {job.diffPercentage.toFixed(2)}%
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold font-sans text-sm truncate" title={job.url}>{job.url}</h4>
                <a href={job.url} target="_blank" rel="noreferrer" className="text-[var(--text-muted)] hover:text-[var(--text)]">
                  <HugeiconsIcon icon={Link01Icon} size={14} />
                </a>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
                <span>{new Date(job.createdAt).toLocaleString()}</span>
                {job.renderTimeMs && <span>{job.renderTimeMs}ms</span>}
              </div>
            </div>

            <div className="p-3 bg-[var(--surface-raised)] border-t border-[var(--border)] flex gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Download01Icon}
                disabled={!job.imageUrl}
                onClick={() => window.open(job.imageUrl)}
                className="flex-1"
              >
                Original
              </Button>
              {job.diffImageUrl && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={FilterIcon}
                  onClick={() => window.open(job.diffImageUrl)}
                  className="flex-1"
                >
                  View Diff
                </Button>
              )}
            </div>
          </Card>
        ))}
        
        {history?.length === 0 && !isLoading && (
          <Card variant="ghost" className="col-span-full py-20 text-center">
            <HugeiconsIcon icon={Camera01Icon} size={48} className="mx-auto text-[var(--text-subtle)] mb-4" />
            <h3 className="text-lg font-black font-sans uppercase tracking-tight text-[var(--text)]">No screenshots yet</h3>
            <p className="text-[var(--text-muted)] font-mono text-sm mt-2">Your screenshot history will appear here once you make some requests.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
