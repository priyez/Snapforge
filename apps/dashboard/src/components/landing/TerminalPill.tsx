import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tick01Icon, Copy01Icon } from '@hugeicons/core-free-icons';

export function TerminalPill({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="terminal-pill cursor-pointer group" onClick={handleCopy}>
      <span className="text-zinc-600">$</span>
      <span className="font-mono">{text}</span>
      <div className="ml-2 p-1 rounded-md hover:bg-white/5 transition-colors">
        <HugeiconsIcon
          icon={copied ? Tick01Icon : Copy01Icon}
          size={14}
          className={copied ? "text-emerald-500" : "text-zinc-500 group-hover:text-zinc-300"}
        />
      </div>
    </div>
  );
}
