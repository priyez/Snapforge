import { createFileRoute, Link } from '@tanstack/react-router';
import { useSchedule, useScheduleHistory } from '../../lib/api';
import {
  ArrowLeft01Icon,
  Calendar03Icon,
  Clock01Icon,
  Link01Icon,
  ViewIcon,
  FilterIcon,
  Settings01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { motion } from 'motion/react';

export const Route = createFileRoute('/dashboard/schedules/$id')({
  component: ScheduleDetailPage,
});

function ScheduleDetailPage() {
  const { id } = Route.useParams();
  const { data: schedule } = useSchedule(id);
  const { data: history, isLoading } = useScheduleHistory(id);
  const [viewMode, setViewMode] = useState<'grid' | 'filmstrip'>('filmstrip');

  if (!schedule && !isLoading) return <div>Schedule not found</div>;

  return (
    <div className="max-w-[95dvw] md:max-w-6xl px-2 md:px-4 lg:px-6 mx-auto w-full space-y-6 overflow-hidden ">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            to="/dashboard/schedules"
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] mb-4"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            Back to Schedules
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[var(--text)]">{schedule?.name || 'Loading...'}</h1>
            <div className={`badge ${schedule?.active ? 'badge-success' : 'badge-outline'}`}>
              {schedule?.active ? 'Monitoring Active' : 'Paused'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] pt-1">
            <div className="flex items-center gap-2 min-w-0 max-w-xs md:max-w-md">
              <HugeiconsIcon icon={Link01Icon} size={14} className="shrink-0" />
              <div className="overflow-hidden relative flex-1 mask-fade-edges">
                <motion.div
                  className="flex whitespace-nowrap gap-8 w-max"
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                >
                  <span className="font-mono text-xs pr-8">{schedule?.url}</span>
                  <span className="font-mono text-xs">{schedule?.url}</span>
                </motion.div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Clock01Icon} size={14} />
              <span className="font-mono">{schedule?.cron}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--surface-raised)] border border-[var(--border)] p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
              title="Grid View"
            >
              <HugeiconsIcon icon={FilterIcon} size={18} />
            </button>
            <button
              onClick={() => setViewMode('filmstrip')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'filmstrip' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
              title="Filmstrip View"
            >
              <HugeiconsIcon icon={ViewIcon} size={18} />
            </button>
          </div>
          <button className="btn btn-outline gap-2 py-2">
            <HugeiconsIcon icon={Settings01Icon} size={18} />
            Config
          </button>
        </div>
      </div>

      {/* Visual Diff Gallery */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--text)] flex items-center gap-2">
            Visual Timeline
            <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--surface-raised)] px-2 py-0.5 rounded-full">
              {history?.length || 0} Runs
            </span>
          </h3>
        </div>

        {viewMode === 'filmstrip' ? (
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-10 scrollbar-hide snap-x snap-mandatory -mx-2 px-2 md:mx-0 md:px-0">
            {history?.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                className="flex-none w-[280px] md:w-80 space-y-4 group snap-start"
              >
                <div className="relative aspect-[16/10] bg-[var(--surface-raised)] border-y-4 border-[var(--border)] rounded-sm overflow-hidden shadow-2xl">
                  {/* Film Perforations - Top */}
                  <div className="absolute top-1 left-0 right-0 flex justify-between px-2 opacity-40 z-10">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-1.5 h-2 rounded-sm bg-white" />
                    ))}
                  </div>

                  {/* Film Perforations - Bottom */}
                  <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 opacity-40 z-10">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-1.5 h-2 rounded-sm bg-white" />
                    ))}
                  </div>
                  {job.imageUrl ? (
                    <img src={job.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={job.imageUrl} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                      <HugeiconsIcon icon={Calendar03Icon} size={32} className="opacity-20" />
                    </div>
                  )}

                  {/* Diff Overlay Badge */}
                  {job.diffPercentage !== undefined && job.diffPercentage > 0.1 && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                      <div className={`px-2 py-1 rounded-md text-[10px] font-black backdrop-blur-md border ${job.diffPercentage > 5 ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                        Δ {job.diffPercentage.toFixed(2)}%
                      </div>
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => window.open(job.imageUrl)}
                      className="p-2 bg-white text-black rounded-full hover:scale-110 transition-transform"
                    >
                      <HugeiconsIcon icon={ViewIcon} size={20} />
                    </button>
                    {job.diffImageUrl && (
                      <button
                        onClick={() => window.open(job.diffImageUrl)}
                        className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"
                      >
                        <HugeiconsIcon icon={FilterIcon} size={20} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="min-w-0 flex-1 overflow-hidden relative mask-fade-edges">
                    <p className="text-[13px] font-bold text-[var(--text)] truncate">
                      {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <motion.div
                      className="flex whitespace-nowrap gap-4 w-max mt-0.5"
                      animate={{ x: ["0%", "-50%"] }}
                      transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    >
                      <p className="text-[10px] text-[var(--text-muted)] font-mono pr-4">
                        {index === history.length - 1 ? 'Baseline Run' : `Compare vs Run #${history.length - index - 1}`}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">
                        {index === history.length - 1 ? 'Baseline Run' : `Compare vs Run #${history.length - index - 1}`}
                      </p>
                    </motion.div>
                  </div>
                  {job.renderTimeMs && (
                    <span className="text-[10px] font-mono text-[var(--text-subtle)] bg-[var(--surface-raised)] px-1.5 py-0.5 rounded">
                      {job.renderTimeMs}ms
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Standard Grid View (similar to history but scoped) */}
            {history?.map((job) => (
              <div key={job.id} className="card !p-0 overflow-hidden border border-[var(--border)] group">
                <div className="aspect-video relative overflow-hidden bg-[var(--surface-raised)]">
                  {job.imageUrl && <img src={job.imageUrl} className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                    <p className="text-xs font-mono text-white/80">{new Date(job.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {history?.length === 0 && !isLoading && (
          <div className="py-20 text-center card bg-transparent border-dashed border-[var(--border)]">
            <HugeiconsIcon icon={Calendar03Icon} size={48} className="mx-auto text-[var(--text-subtle)] mb-4 opacity-20" />
            <h3 className="text-[var(--text)]">Timeline Empty</h3>
            <p className="text-[var(--text-muted)] mt-2">Screenshots will appear here as the schedule runs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
