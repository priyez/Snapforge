import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Tick01Icon } from '@hugeicons/core-free-icons';

interface CodeBlockProps {
  code: string;
  language?: string;
  label?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'typescript', label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && <p className="text-[12px] font-bold text-[var(--text-muted)] font-sans">{label}</p>}
      <div className="relative group/code">
        <div className="absolute right-3 top-3 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
          >
            <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={12} className={copied ? "text-emerald-500" : ""} />
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1.25rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(10, 10, 10, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.8125rem',
            lineHeight: '1.7',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, Courier New, monospace'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
