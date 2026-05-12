import { useState, useEffect, useRef } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useInView } from 'motion/react';

export function CodeWindow({ code, filename, language = 'typescript' }: { code: string, filename?: string, language?: string }) {
  const [displayedCode, setDisplayedCode] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "-50px" });

  useEffect(() => {
    if (!isInView) {
      setDisplayedCode('');
      return;
    }

    let i = 0;
    setDisplayedCode('');

    const interval = setInterval(() => {
      if (i < code.length) {
        const char = code.charAt(i);
        i++;
        setDisplayedCode((prev) => prev + char);
      } else {
        clearInterval(interval);
      }
    }, 20); // 20ms per character typing speed

    return () => clearInterval(interval);
  }, [code, isInView]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 400);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div ref={containerRef} className="relative rounded-xl border border-white/[0.08] bg-zinc-900/50 backdrop-blur-sm overflow-hidden group">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500/50 transition-colors"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 group-hover:bg-amber-500/50 transition-colors"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/50 transition-colors"></div>
        </div>
        {filename && <span className="ml-2 text-xs font-mono text-zinc-500">{filename}</span>}
      </div>
      <div className="p-0 text-sm font-mono leading-relaxed overflow-x-auto min-h-[120px]">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          customStyle={{
            margin: 0,
            padding: '1.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, Courier New, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          wrapLines={true}
        >
          {displayedCode + (showCursor ? '█' : ' ')}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
