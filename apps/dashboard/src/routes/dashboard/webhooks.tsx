import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useWebhooks, useCreateWebhook, useDeleteWebhook, useWebhookLogs } from '../../lib/api';
import {
  PlusSignIcon,
  Delete02Icon,
  Link01Icon,
  Share01Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  EyeIcon,
  Copy01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button, SectionHeader } from '#/components/ui';

export const Route = createFileRoute('/dashboard/webhooks')({
  component: WebhooksPage,
});

function WebhooksPage() {
  const { data: webhooks, isLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const { data: logs } = useWebhookLogs(selectedWebhookId || '');

  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['screenshot.completed', 'diff.detected', 'screenshot.failed'],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWebhook.mutateAsync(newWebhook);
      setIsModalOpen(false);
      setNewWebhook({ name: '', url: '', events: ['screenshot.completed', 'diff.detected', 'screenshot.failed'] });
    } catch (err) {
      alert('Failed to create webhook');
    }
  };

  return (
    <div className="md:max-w-6xl px-2 md:px-4 lg:px-6 mx-auto w-full space-y-6">

      <SectionHeader
        title="Webhooks"
        description="Listen for screenshot events in real-time. Get notified when a screenshot is completed, fails, or when a visual change is detected."
      >
        <Button onClick={() => setIsModalOpen(true)} icon={PlusSignIcon}>
          Create New Webhook
        </Button>
      </SectionHeader>


      <div className="grid grid-cols-1 gap-6">
        {webhooks?.map((webhook) => (
          <div key={webhook.id} className="card !p-0 overflow-hidden border border-[var(--border)]">
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-[var(--text)] truncate">{webhook.name || 'Untitled Webhook'}</h3>
                  <div className={`badge ${webhook.active ? 'badge-success' : 'badge-outline'}`}>
                    {webhook.active ? 'Active' : 'Paused'}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] bg-[var(--bg)] p-2 rounded border border-[var(--border)] truncate">
                  <HugeiconsIcon icon={Link01Icon} size={14} className="shrink-0" />
                  <span className="truncate">{webhook.url}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map(event => (
                    <span key={event} className="px-2 py-0.5 bg-[var(--surface-raised)] border border-[var(--border)] rounded text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                      {event}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setSelectedWebhookId(webhook.id === selectedWebhookId ? null : webhook.id)}
                  className={`btn ${webhook.id === selectedWebhookId ? 'btn-primary' : 'btn-outline'} py-2 px-4 gap-2`}
                >
                  <HugeiconsIcon icon={EyeIcon} size={18} />
                  {webhook.id === selectedWebhookId ? 'Hide Logs' : 'View Logs'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this webhook?')) {
                      deleteWebhook.mutate(webhook.id);
                    }
                  }}
                  className="p-2.5 text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-md transition-colors border border-[var(--border)]"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={18} />
                </button>
              </div>
            </div>

            {/* Secret Section */}
            <div className="px-5 py-3 bg-[var(--surface-raised)] border-t border-[var(--border)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                <span className="font-bold uppercase tracking-tight">Secret Key:</span>
                <span className="bg-black/20 px-2 py-0.5 rounded select-all">{webhook.secret}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhook.secret);
                    alert('Secret copied!');
                  }}
                  className="hover:text-[var(--text)]"
                >
                  <HugeiconsIcon icon={Copy01Icon} size={12} />
                </button>
              </div>
              <div className="text-[10px] font-bold text-[var(--text-subtle)] uppercase">
                {webhook._count?.logs || 0} Total Deliveries
              </div>
            </div>

            {/* Logs Section */}
            {selectedWebhookId === webhook.id && (
              <div className="border-t border-[var(--border)] animate-in slide-in-from-top duration-300">
                <div className="p-4 bg-black/40">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                    <HugeiconsIcon icon={Clock01Icon} size={14} />
                    Recent Deliveries
                  </h4>
                  <div className="space-y-2">
                    {logs?.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg group">
                        <div className="flex items-center gap-4">
                          <div className={`p-1.5 rounded-full ${log.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                            <HugeiconsIcon icon={log.success ? CheckmarkCircle01Icon : Alert01Icon} size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[var(--text)]">{log.event}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">{new Date(log.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className={`text-xs font-bold ${log.statusCode && log.statusCode < 400 ? 'text-green-400' : 'text-red-400'}`}>
                              HTTP {log.statusCode || 'FAIL'}
                            </div>
                            <div className="text-[10px] text-[var(--text-subtle)]">{log.durationMs}ms</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {logs?.length === 0 && (
                      <div className="text-center py-10 text-[var(--text-muted)] font-mono text-xs">
                        No delivery logs yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {webhooks?.length === 0 && !isLoading && (
          <div className="py-20 text-center card bg-transparent border-dashed border-[var(--border)]">
            <HugeiconsIcon icon={Share01Icon} size={48} className="mx-auto text-[var(--text-subtle)] mb-4 opacity-20" />
            <h3 className="text-[var(--text)]">No webhooks configured</h3>
            <p className="text-[var(--text-muted)] mt-2">Connect your internal systems to receive automated updates.</p>
          </div>
        )}
      </div>

      {/* Add Webhook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md card bg-[var(--surface)] border border-[var(--border)] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[var(--text)]">New Webhook</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={20} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="form-label">Friendly Name</label>
                <input
                  type="text"
                  placeholder="Slack Alerts"
                  className="input-field"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="form-label">Payload URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://hooks.slack.com/..."
                  className="input-field"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="form-label">Events to subscribe to</label>
                <div className="space-y-2 p-3 bg-[var(--bg)] rounded border border-[var(--border)]">
                  {['screenshot.completed', 'diff.detected', 'screenshot.failed'].map(event => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(ev => ev !== event) });
                          }
                        }}
                        className="accent-[var(--accent)]"
                      />
                      <span className="text-xs font-mono text-[var(--text-muted)]">{event}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createWebhook.isPending}
                  className="flex-1 btn btn-primary"
                >
                  {createWebhook.isPending ? 'Saving...' : 'Add Webhook'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
