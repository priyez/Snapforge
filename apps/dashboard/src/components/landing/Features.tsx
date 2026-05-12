import { FeatureRow } from './FeatureRow';
import { LatencyDisplay } from './LatencyDisplay';
import { CodeWindow } from './CodeWindow';

export function Features() {
  return (
    <>
      {/* Built for TS Section */}
      <section className="py-32 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto text-center mb-24 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Built for devs who get it.</h2>
        </div>

        <div className="max-w-7xl mx-auto space-y-32">
          <FeatureRow
            title="Type Safe"
            description="Full TypeScript support with automatic type inference and compile-time safety. Your schema defines your types — no extra step needed."
            code={`const screenshot = await snap.capture({
  url: "https://google.com",
  wait: "networkidle",
  format: "webp"
})`}
            imageElement={<LatencyDisplay value="<1ms" label="average api latency" />}
          />

          <FeatureRow
            reversed
            title="Schema Based"
            description="Define your capture parameters once and get automatic validation and type safety. Your configuration is the single source of truth."
            language="json"
            code={`{
  "options": {
    "width": 1920,
    "height": 1080,
    "fullPage": true,
    "blockAds": true
  }
}`}
          />

          <FeatureRow
            title="Lightning Fast"
            description="Built on top of a highly optimized browser pool with global edge distribution. Reach milliseconds, not seconds."
            imageElement={<LatencyDisplay value="<1s" label="average render time" />}
          />
        </div>
      </section>

      {/* Simple by Design */}
      <section className="py-32 px-6 bg-zinc-950/50">
        <div className="max-w-5xl mx-auto text-center space-y-4 mb-16">
          <h2 className="text-5xl font-bold tracking-tighter">Simple by Design</h2>
          <p className="text-zinc-400 text-lg">Set up in seconds. Start capturing immediately.</p>
        </div>

        <div className="max-w-5xl mx-auto">
          <CodeWindow
            filename="index.ts"
            code={`import { SnapForge } from "@snapforge/sdk";

const snap = new SnapForge({ apiKey: "sf_live_..." });

// Simple capture
const result = await snap.capture("https://github.com");

// Advanced capture with webhooks
await snap.capture({
  url: "https://stripe.com",
  webhook: "https://api.myapp.com/hooks/screenshots",
  metadata: { userId: "user_123" }
});`}
          />
        </div>
      </section>
    </>
  );
}
