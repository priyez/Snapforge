import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useTakeScreenshot } from '../../lib/api';
import {
  PlayIcon,
  Camera01Icon,
  Download01Icon,
  Loading01Icon,
  Alert01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Button, Card, SectionHeader, Input, CodeBlock } from '../../components/ui';

export const Route = createFileRoute('/dashboard/playground')({
  component: PlaygroundPage,
});

function PlaygroundPage() {
  const takeScreenshot = useTakeScreenshot();
  const [params, setParams] = useState({
    url: 'https://google.com',
    width: 1280,
    height: 720,
    format: 'png',
    fullPage: false,
    darkMode: false,
    blockAds: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await takeScreenshot.mutateAsync(params);
    } catch (err) {
      // Error is handled in the UI
    }
  };

  const [activeTab, setActiveTab] = useState<'json' | 'node'>('json');

  const generateNodeCode = () => {
    return `import { ScreenshotAPI } from '@snapforge/sdk';\n\nconst client = new ScreenshotAPI({\n  apiKey: 'YOUR_API_KEY'\n});\n\nconst result = await client.takeScreenshot({\n  url: '${params.url}',\n  width: ${params.width},\n  height: ${params.height},\n  format: '${params.format}',\n  fullPage: ${params.fullPage},\n  darkMode: ${params.darkMode},\n  blockAds: ${params.blockAds}\n});\n\nconsole.log(result.imageUrl);`;
  };

  return (
    <div className="max-w-6xl px-2 md:px-4 lg:px-6 mx-auto w-full space-y-6">
      <SectionHeader
        title="Playground"
        description="Test the API parameters in real-time and see the results instantly."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-[var(--text)]">Configuration</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Target URL"
                type="url"
                value={params.url}
                onChange={e => setParams({ ...params, url: e.target.value })}
                placeholder="https://example.com"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Width"
                  type="number"
                  value={params.width}
                  onChange={e => setParams({ ...params, width: parseInt(e.target.value) })}
                />
                <Input
                  label="Height"
                  type="number"
                  value={params.height}
                  onChange={e => setParams({ ...params, height: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Format</label>
                <select
                  value={params.format}
                  onChange={e => setParams({ ...params, format: e.target.value })}
                  className="input-field"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="webp">WebP</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={params.fullPage}
                    onChange={e => setParams({ ...params, fullPage: e.target.checked })}
                    className="accent-[var(--accent)] w-4 h-4"
                  />
                  <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors">Full Page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={params.darkMode}
                    onChange={e => setParams({ ...params, darkMode: e.target.checked })}
                    className="accent-[var(--accent)] w-4 h-4"
                  />
                  <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors">Dark Mode</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={params.blockAds}
                    onChange={e => setParams({ ...params, blockAds: e.target.checked })}
                    className="accent-[var(--accent)] w-4 h-4"
                  />
                  <span className="text-sm font-medium text-[var(--text-muted)] group-hover:text-white transition-colors">Block Ads</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full mt-4"
                loading={takeScreenshot.isPending}
                icon={PlayIcon}
              >
                Generate Screenshot
              </Button>
            </form>
          </Card>

          <Card noPadding className="overflow-hidden">
            <div className="flex items-center px-4 py-2 bg-[var(--surface-raised)] border-b border-[var(--border)]">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('json')}
                  className={`text-[10px] font-bold py-2 border-b-2 transition-colors ${activeTab === 'json' ? 'text-[var(--text)] border-[var(--accent)]' : 'text-[var(--text-muted)] border-transparent hover:text-white'}`}
                >
                  Request JSON
                </button>
                <button
                  onClick={() => setActiveTab('node')}
                  className={`text-[10px] font-bold py-2 border-b-2 transition-colors ${activeTab === 'node' ? 'text-[var(--text)] border-[var(--accent)]' : 'text-[var(--text-muted)] border-transparent hover:text-white'}`}
                >
                  Node.js SDK
                </button>
              </div>
            </div>
            <div className="p-0">
              <CodeBlock
                language={activeTab === 'json' ? 'json' : 'typescript'}
                code={activeTab === 'json' ? JSON.stringify(params, null, 2) : generateNodeCode()}
              />
            </div>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8">
          <Card className="h-full min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--text)]">Result Preview</h3>
              </div>
              {takeScreenshot.data?.imageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download01Icon}
                  onClick={() => window.open(takeScreenshot.data.imageUrl)}
                >
                  Download
                </Button>
              )}
            </div>

            <div className="flex-1 bg-black/40 border border-[var(--border)] rounded-xl overflow-hidden relative group min-h-[400px]">
              {takeScreenshot.isPending ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                  <HugeiconsIcon icon={Loading01Icon} className="animate-spin text-[var(--accent)] mb-4" size={48} />
                  <p className="font-bold text-sm text-white">Generating your screenshot...</p>
                </div>
              ) : takeScreenshot.data?.imageUrl ? (
                <img
                  src={takeScreenshot.data.imageUrl}
                  className="w-full h-full object-contain p-4"
                  alt="Screenshot Preview"
                />
              ) : takeScreenshot.error ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-red-400">
                  <HugeiconsIcon icon={Alert01Icon} size={48} className="mb-4 opacity-50" />
                  <p className="font-bold text-sm">Generation Failed</p>
                  <p className="text-xs font-mono mt-2 opacity-80">{(takeScreenshot.error as any).response?.data?.error?.message || 'Check your parameters and try again.'}</p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)]">
                  <div className="w-16 h-16 bg-[var(--surface-subtle)] rounded-full flex items-center justify-center mb-4">
                    <HugeiconsIcon icon={Camera01Icon} size={32} className="opacity-40" />
                  </div>
                  <p className="text-sm font-medium max-w-[240px]">Configure your parameters and click "Generate" to see the result.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
