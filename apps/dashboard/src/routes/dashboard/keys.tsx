import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '../../lib/api';
import {
  PlusSignIcon,
  Delete02Icon,
  Copy01Icon,
  Alert01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button, Card, SectionHeader, Modal, Input } from '../../components/ui';

export const Route = createFileRoute('/dashboard/keys')({
  component: ApiKeysPage,
});

function ApiKeysPage() {
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('My App');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    try {
      const result = await createKey.mutateAsync(newKeyName);
      setNewKey(result.rawKey);
      setIsModalOpen(false);
      setNewKeyName('My App');
    } catch (err) {
      alert('Failed to create API key');
    }
  };

  return (
    <div className="md:max-w-6xl px-2 md:px-4 lg:px-6 mx-auto w-full space-y-6">
      <SectionHeader
        title="API Keys"
        description="Use these keys to authenticate your requests to the Screenshot API. Keep them secret and never share them in client-side code."
      >
        <Button onClick={() => setIsModalOpen(true)} icon={PlusSignIcon}>
          Create New Key
        </Button>
      </SectionHeader>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New API Key"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Key Name"
            placeholder="e.g. Production App"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={createKey.isPending}>
              Create Key
            </Button>
          </div>
        </form>
      </Modal>

      {newKey && (
        <Card className="space-y-4 animate-in fade-in slide-in-from-top-4 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <HugeiconsIcon icon={Alert01Icon} size={20} />
            Important: Copy your new API key
          </div>
          <p className="text-[var(--text-muted)] font-mono text-sm">
            This key will only be shown once. If you lose it, you'll need to create a new one.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 p-3 bg-black/50 border border-white/10 text-lg font-mono truncate text-white">
              {newKey}
            </code>
            <Button
              variant="outline"
              icon={Copy01Icon}
              onClick={() => {
                navigator.clipboard.writeText(newKey);
                alert('Copied to clipboard!');
              }}
            />
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="text-xs font-bold text-[var(--text)] uppercase tracking-tight border-b border-transparent hover:border-[var(--text)]"
          >
            I've saved it, dismiss
          </button>
        </Card>
      )}

      {/* Desktop View */}
      <Card noPadding className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-tight">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-tight">Prefix</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-tight">Created</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-tight text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {keys?.map((key) => (
                <tr key={key.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="px-6 py-4 font-bold font-sans">{key.name}</td>
                  <td className="px-6 py-4 font-mono text-sm">{key.prefix}...</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)] font-mono">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to revoke this key? It will immediately stop working.')) {
                          revokeKey.mutate(key.id);
                        }
                      }}
                      className="p-2 text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-md transition-colors"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {keys?.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)] font-mono">
                    No API keys found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {keys?.map((key) => (
          <Card key={key.id} className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Name</p>
                <p className="font-bold text-[var(--text)]">{key.name}</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to revoke this key? It will immediately stop working.')) {
                    revokeKey.mutate(key.id);
                  }
                }}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-lg transition-colors border border-[var(--border)]"
              >
                <HugeiconsIcon icon={Delete02Icon} size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Prefix</p>
                <p className="font-mono text-xs">{key.prefix}...</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Created</p>
                <p className="font-mono text-xs text-[var(--text-muted)]">{new Date(key.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>
        ))}
        {keys?.length === 0 && !isLoading && (
          <Card variant="ghost" className="py-12 text-center">
            <p className="text-[var(--text-muted)] font-mono text-sm">No API keys found.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
