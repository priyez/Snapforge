import { createFileRoute } from '@tanstack/react-router';
import { useMe, useUpdateSettings } from '../../lib/api';
import { useState, useEffect } from 'react';
import {
  Notification01Icon,
  Mail01Icon,
  SlackIcon,
  TelegramIcon,
  Alert01Icon,
  CheckmarkCircle01Icon,
  UserIcon,
  Building04Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Input } from '../../components/ui/Input';

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: user } = useMe();
  const updateSettings = useUpdateSettings();
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'notifications'>('profile');

  const [settings, setSettings] = useState({
    name: '',
    email: '',
    emailAlerts: false,
    alertThreshold: 5.0,
    slackWebhook: '',
    discordWebhook: '',
    telegramChatId: '',
  });

  useEffect(() => {
    if (user) {
      setSettings({
        name: user.name || '',
        email: user.email || '',
        emailAlerts: user.emailAlerts || false,
        alertThreshold: user.alertThreshold || 5.0,
        slackWebhook: user.slackWebhook || '',
        discordWebhook: user.discordWebhook || '',
        telegramChatId: user.telegramChatId || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings');
    }
  };

  const getInitial = (name?: string, email?: string) => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="md:max-w-5xl px-2 md:px-4 lg:px-6 mx-auto w-full space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[var(--text)]">Settings</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[var(--border-subtle)]">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'profile'
            ? 'border-[var(--text)] text-[var(--text)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
        >
          <HugeiconsIcon icon={UserIcon} size={16} />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('organization')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'organization'
            ? 'border-[var(--text)] text-[var(--text)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
        >
          <HugeiconsIcon icon={Building04Icon} size={16} />
          Organization
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'notifications'
            ? 'border-[var(--text)] text-[var(--text)]'
            : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
        >
          <HugeiconsIcon icon={Notification01Icon} size={16} />
          Notifications
        </button>
      </div>

      {/* Content */}
      <div className="pt-2">
        {activeTab === 'profile' && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-[var(--text)] rounded-lg">
                  <HugeiconsIcon icon={UserIcon} size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--text)]">Profile</h3>
                  <p className="text-sm text-[var(--text-muted)]">Your personal information</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              <div className="flex items-center gap-6">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={settings.name || 'User Avatar'}
                    className="w-20 h-20 rounded-full object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                    {getInitial(settings.name, settings.email)}
                  </div>
                )}
                <div>
                  <h4 className="text-xl font-bold text-[var(--text)] mb-1">{settings.name || 'Set your name'}</h4>
                  <p className="text-[var(--text-muted)] text-sm">{settings.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  icon={UserIcon}
                  value={settings.name}
                  readOnly
                  className="opacity-70 cursor-not-allowed bg-[var(--bg)] text-[var(--text)]"
                />

                <Input
                  label="Email Address"
                  icon={Mail01Icon}
                  value={settings.email}
                  readOnly
                  className="opacity-70 cursor-not-allowed bg-[var(--bg)] text-[var(--text)]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Email Alerts */}
              <div className="card space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg">
                    <HugeiconsIcon icon={Mail01Icon} size={20} />
                  </div>
                  <h3 className="text-[var(--text)]">Email Notifications</h3>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl cursor-pointer hover:border-[var(--accent)]/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-[var(--text)]">Enable Email Alerts</p>
                      <p className="text-xs text-[var(--text-muted)]">Receive alerts to {settings.email}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailAlerts}
                      onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                      className="w-5 h-5 accent-[var(--accent)]"
                    />
                  </label>

                  <div className="space-y-2">
                    <label className="form-label flex justify-between">
                      <span>Alert Threshold</span>
                      <span className="font-mono text-[var(--accent)]">{settings.alertThreshold}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="50"
                      step="0.1"
                      className="w-full accent-[var(--accent)] bg-[var(--surface-raised)] h-2 rounded-lg appearance-none cursor-pointer"
                      value={settings.alertThreshold}
                      onChange={(e) => setSettings({ ...settings, alertThreshold: parseFloat(e.target.value) })}
                    />
                    <p className="text-[10px] text-[var(--text-muted)] font-mono italic">
                      Only notify me if visual change is greater than this percentage.
                    </p>
                  </div>
                </div>
              </div>

              {/* Integration Settings */}
              <div className="card space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                    <HugeiconsIcon icon={Notification01Icon} size={20} />
                  </div>
                  <h3 className="text-[var(--text)]">Instant Channels</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="form-label flex items-center gap-2">
                      <HugeiconsIcon icon={SlackIcon} size={14} className="text-[#4A154B]" />
                      Slack Webhook URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://hooks.slack.com/..."
                      className="input-field"
                      value={settings.slackWebhook}
                      onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="form-label flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} className="text-[#5865F2]" />
                      Discord Webhook URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://discord.com/api/webhooks/..."
                      className="input-field"
                      value={settings.discordWebhook}
                      onChange={(e) => setSettings({ ...settings, discordWebhook: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="form-label flex items-center gap-2">
                      <HugeiconsIcon icon={TelegramIcon} size={14} className="text-[#0088cc]" />
                      Telegram Chat ID
                    </label>
                    <input
                      type="text"
                      placeholder="-100123456789"
                      className="input-field"
                      value={settings.telegramChatId}
                      onChange={(e) => setSettings({ ...settings, telegramChatId: e.target.value })}
                    />
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">
                      Requires SnapForge bot to be added to your group.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
              <button
                onClick={handleSave}
                disabled={updateSettings.isPending}
                className="bg-[var(--text)] text-[var(--bg)] font-semibold px-6 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {updateSettings.isPending ? 'Saving...' : (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} />
                    Save Notifications
                  </>
                )}
              </button>
            </div>

            {/* Preview Section */}
            <div className="card bg-[var(--surface-raised)] border-dashed border-[var(--border)] p-6">
              <div className="flex items-center gap-3 mb-4">
                <HugeiconsIcon icon={Alert01Icon} size={20} className="text-amber-500" />
                <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-widest">Alert Preview</h4>
              </div>
              <div className="bg-black/40 rounded-lg p-4 border border-[var(--border)] font-mono text-[11px] text-[var(--text-muted)]">
                <p className="text-[var(--text)] mb-2 font-bold text-xs">🚨 Visual Change Detected!</p>
                <p>URL: https://example.com</p>
                <p>Change: <span className="text-amber-500">{(settings.alertThreshold + 2).toFixed(1)}%</span></p>
                <p className="mt-2 text-blue-400 underline cursor-pointer">View Diff Image →</p>
                <p className="text-blue-400 underline cursor-pointer">View Original →</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'organization' && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center text-[var(--text-muted)] shadow-sm">
            <HugeiconsIcon icon={Building04Icon} size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-[var(--text)] mb-2">Organization Settings</h3>
            <p className="max-w-md mx-auto">
              Team management and organization settings will be available in a future update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
