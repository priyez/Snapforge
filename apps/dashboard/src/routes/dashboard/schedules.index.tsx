import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useSchedules, useCreateSchedule, useDeleteSchedule } from '../../lib/api';
import {
  PlusSignIcon,
  Delete02Icon,
  Clock01Icon,
  Link01Icon,
  Calendar03Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button, Card, SectionHeader, Modal, Input } from '../../components/ui';

export const Route = createFileRoute('/dashboard/schedules/')({
  component: SchedulesPage,
});

const CRON_PRESETS = [
  { label: 'Hourly', value: '0 * * * *', desc: 'Every hour' },
  { label: 'Daily', value: '0 0 * * *', desc: 'Every day at midnight' },
  { label: 'Weekly', value: '0 0 * * 0', desc: 'Every Sunday' },
  { label: 'Monthly', value: '0 0 1 * *', desc: '1st of every month' },
];

function getHumanReadableCron(cron: string) {
  const preset = CRON_PRESETS.find(p => p.value === cron);
  if (preset) return preset.desc;

  const parts = cron.split(' ');
  if (parts.length !== 5) return 'Invalid cron expression';

  const [min, hour, dom, month, dow] = parts;

  // Handle "Daily at HH:MM"
  if (dom === '*' && month === '*' && dow === '*') {
    const h = hour.padStart(2, '0');
    const m = min.padStart(2, '0');
    if (!isNaN(Number(h)) && !isNaN(Number(m))) {
      return `Daily at ${h}:${m}`;
    }
  }

  if (cron.startsWith('*/')) {
    const mins = min.replace('*/', '');
    return `Every ${mins} minutes`;
  }

  return 'Custom schedule';
}

function SchedulesPage() {
  const { data: schedules, isLoading } = useSchedules();
  const createSchedule = useCreateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    url: '',
    cron: '0 0 * * *',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSchedule.mutateAsync(newSchedule);
      setIsModalOpen(false);
      setNewSchedule({ name: '', url: '', cron: '0 0 * * *' });
    } catch (err) {
      alert('Failed to create schedule');
    }
  };

  return (
    <div className="max-w-6xl px-2 md:px-4 lg:px-6 mx-auto w-full space-y-6">
      <SectionHeader
        title="Schedules"
        description="Automate your visual monitoring by scheduling screenshots at regular intervals."
      >
        <Button onClick={() => setIsModalOpen(true)} icon={PlusSignIcon}>
          New Schedule
        </Button>
      </SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules?.map((schedule) => (
          <Card key={schedule.id} className="group relative flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-md text-[var(--accent)]">
                <HugeiconsIcon icon={Calendar03Icon} size={20} />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)]"
                icon={Delete02Icon}
                onClick={() => {
                  if (confirm('Are you sure you want to delete this schedule?')) {
                    deleteSchedule.mutate(schedule.id);
                  }
                }}
              />
            </div>

            <div className="space-y-3 flex-1">
              <h3 className="text-base font-bold text-[var(--text)] line-clamp-1">{schedule.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <HugeiconsIcon icon={Link01Icon} size={14} className="shrink-0" />
                  <span className="truncate">{schedule.url}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <HugeiconsIcon icon={Clock01Icon} size={14} className="shrink-0" />
                  <span>{schedule.cron}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-auto">
              <Link to="/dashboard/schedules/$id" params={{ id: schedule.id }}>
                <Button variant="outline" className="w-full justify-between" icon={ViewIcon} iconPosition="right">
                  View Details
                </Button>
              </Link>
            </div>
          </Card>
        ))}

        {schedules?.length === 0 && !isLoading && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
            <div className="w-12 h-12 bg-[var(--surface-subtle)] rounded-full flex items-center justify-center mx-auto mb-4">
              <HugeiconsIcon icon={Calendar03Icon} size={24} className="text-[var(--text-muted)]" />
            </div>
            <h3 className="text-[var(--text)] font-bold">No schedules yet</h3>
            <p className="text-[var(--text-muted)] mt-2">Create your first automated screenshot schedule to get started.</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New Schedule"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Schedule Name"
            required
            placeholder="Daily Homepage Check"
            value={newSchedule.name}
            onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
          />
          <Input
            label="Target URL"
            type="url"
            required
            placeholder="https://example.com"
            value={newSchedule.url}
            onChange={(e) => setNewSchedule({ ...newSchedule, url: e.target.value })}
          />
          <div className="space-y-2">
            <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {CRON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setNewSchedule({ ...newSchedule, cron: preset.value })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${newSchedule.cron === preset.value
                    ? 'bg-white text-black border-black shadow-lg shadow-[var(--accent)]/20'
                    : 'bg-[var(--surface-raised)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                    }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Input
              label="Cron Expression (Frequency)"
              required
              placeholder="0 0 * * *"
              value={newSchedule.cron}
              onChange={(e) => setNewSchedule({ ...newSchedule, cron: e.target.value })}
            />
            <div className="flex items-center gap-2 px-1">
              <HugeiconsIcon icon={Clock01Icon} size={12} className="text-[var(--accent)]" />
              <span className="text-[11px] font-medium text-[var(--accent)] italic">
                {getHumanReadableCron(newSchedule.cron)}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={createSchedule.isPending}
            >
              Create Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
