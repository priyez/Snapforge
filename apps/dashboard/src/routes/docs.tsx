import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import {
  Settings01Icon,
  PlayIcon,
  GithubIcon,
  Download01Icon,
  Key01Icon,
  DatabaseIcon,
  Layers01Icon,
  File01Icon,
  Delete01Icon,
  ActivityIcon,
  Camera01Icon,
  ArrowRight01Icon,
  SearchIcon,
  Copy01Icon,
  Tick01Icon,
  Menu01Icon,
  ViewIcon,
  PencilEdit01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion, AnimatePresence } from 'motion/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const Route = createFileRoute('/docs')({
  component: DocsPage,
});

const DOCS_CONTENT = {
  intro: `
# What is SnapForge?

SnapForge is a high-performance screenshot API built for developers who want visual monitoring without the complexity.

Unlike traditional headless browser setups that require complex infrastructure, resource management, or rigid configurations, SnapForge offers a simpler way: define your capture parameters once, and it handles browser orchestration, rendering, and storage behind the scenes.

It captures web pages as high-quality images (PNG, JPEG, WebP) with optional cloud storage. Every capture automatically includes metadata like *viewport*, *latency*, and *timestamp*.

**Think of it like a CDN for screenshots, but with full TypeScript type safety and better DX.**

## Why it exists

Visual monitoring can become unnecessarily complicated for projects.
You're either:

- fighting with brittle Selenium/Puppeteer scripts, or
- paying for overpriced services with limited flexibility.

SnapForge was built because developers deserve something lightweight but powerful. A tool that feels native in TypeScript. One that doesn't ask you to choose between structure and flexibility.
`,
  how_it_works: `
# How it works

SnapForge is built on one simple idea:

> Capture screenshots under projects, with optional schema enforcement — and wrap it all with a fully type-safe SDK.

Here's what actually happens under the hood:

## 1. You define your schema

In your SDK config:

\`\`\`typescript
import { createClient } from "@snapforge/sdk";

const snap = createClient({
  apiKey: "sfg_live_...",
  options: {
    width: 1920,
    height: 1080,
    format: "webp",
    wait: "networkidle"
  }
});
\`\`\`

## 2. Orchestration & Capture

Our distributed cluster of optimized browsers picks up the request. We handle:
- **Browser Lifecycle**: No more zombie processes.
- **Resource Management**: Global distribution for lowest latency.
- **Rendering**: Pixel-perfect output across all viewports.
`,
  installation: `
# Installation

Get started with the official SnapForge SDK for Node.js.

\`\`\`bash
npm install @snapforge/sdk
\`\`\`
`,
  auth: `
# Authentication

SnapForge uses API keys to authenticate requests.

You can generate and manage your API keys in the [Dashboard](/dashboard/keys).

Include your API key in the \`Authorization\` header of every request:

\`\`\`bash
Authorization: Bearer sfg_live_...
\`\`\`
`
};

type DocId = keyof typeof DOCS_CONTENT;

function DocsPage() {
  const [activeDoc, setActiveDoc] = useState<DocId>('intro');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const categories = [
    {
      label: 'GETTING STARTED',
      items: [
        { id: 'intro', label: 'What is SnapForge?', icon: PlayIcon },
        { id: 'how_it_works', label: 'How it works', icon: Settings01Icon },
      ]
    },
    {
      label: 'SDK',
      items: [
        { id: 'installation', label: 'Installation', icon: Download01Icon },
        { id: 'auth', label: 'Authentication', icon: Key01Icon },
      ]
    },
    {
      label: 'CORE CONCEPTS',
      items: [
        { id: 'projects', label: 'Projects', icon: DatabaseIcon },
        { id: 'targets', label: 'Targets', icon: Layers01Icon },
        { id: 'screenshots', label: 'Screenshots', icon: File01Icon },
      ]
    },
    {
      label: 'API FUNCTIONS',
      items: [
        { id: 'capture', label: 'Capture', icon: Camera01Icon },
        { id: 'list', label: 'List', icon: ViewIcon },
        { id: 'update', label: 'Update', icon: PencilEdit01Icon },
        { id: 'delete', label: 'Delete', icon: Delete01Icon },
        { id: 'stats', label: 'Stats', icon: ActivityIcon },
      ]
    }
  ];

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.map(cat => ({
      ...cat,
      items: cat.items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(cat => cat.items.length > 0);
  }, [searchQuery]);

  const allItems = categories.flatMap(c => c.items);
  const currentIndex = allItems.findIndex(i => i.id === activeDoc);
  const nextItem = allItems[currentIndex + 1];
  const prevItem = allItems[currentIndex - 1];

  const toc = useMemo(() => {
    const content = DOCS_CONTENT[activeDoc] || '';
    const headings = content.match(/^##\s+(.*)$/gm) || [];
    return headings.map(h => h.replace(/^##\s+/, ''));
  }, [activeDoc]);

  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const [copied, setCopied] = useState(false);

      if (inline) {
        return <code className={className} {...props}>{children}</code>;
      }

      const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      return (
        <div className="relative group/code my-8">
          <div className="absolute right-4 top-4 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} size={12} className={copied ? "text-emerald-500" : ""} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match ? match[1] : 'text'}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              borderRadius: '0.75rem',
              backgroundColor: 'rgba(10, 10, 10, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.875rem',
              lineHeight: '1.6'
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans selection:bg-white selection:text-black">
      {/* Docs Header */}
      <header className="fixed top-0 left-0 right-0 h-14 border-b border-white/[0.05] bg-black/50 backdrop-blur-xl z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
          >
            <HugeiconsIcon icon={Menu01Icon} size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-12 h-12  rounded flex items-center justify-center">
              <img src="/logo.png" className="w-full h-full" alt="logo" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">SnapForge <span className="text-zinc-500 ml-1">Docs</span></span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Home</Link>
          <a href="https://github.com" className="text-zinc-400 hover:text-white transition-colors">
            <HugeiconsIcon icon={GithubIcon} size={18} />
          </a>
        </div>
      </header>

      <div className="flex pt-14 max-w-7xl mx-auto min-h-screen">
        {/* Docs Sidebar */}
        <aside className={`
          fixed top-8 bottom-0 lg:left-[max(0px,calc(50%-40rem))] left-0 w-64 border-r border-white/[0.05] bg-[var(--bg)] z-40 transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full flex flex-col p-6 pt-8">
            {/* Search */}
            <div className="relative mb-8">
              <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-white/20 focus:bg-white/[0.07] transition-all"
              />
            </div>

            <nav className="flex-1 overflow-y-auto space-y-8 pb-8 scrollbar-hide">
              {filteredCategories.map((cat) => (
                <div key={cat.label} className="space-y-3">
                  <h4 className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] px-3 uppercase">{cat.label}</h4>
                  <div className="space-y-1">
                    {cat.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id in DOCS_CONTENT) {
                            setActiveDoc(item.id as DocId);
                            setMobileMenuOpen(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${activeDoc === item.id
                          ? 'bg-white text-black shadow-lg shadow-white/10 translate-x-1'
                          : 'text-zinc-400 hover:text-white hover:translate-x-0.5'
                          }`}
                      >
                        <HugeiconsIcon icon={item.icon} size={16} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <p className="text-xs text-zinc-500">No results found for "{searchQuery}"</p>
                </div>
              )}
            </nav>
          </div>
        </aside>

        {/* Docs Content */}
        <main className="flex-1 lg:pl-64 py-12 px-6 lg:px-12 md:mx-4 w-full max-w-full overflow-x-hidden">
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDoc}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-none"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSlug]}
                  components={{
                    ...MarkdownComponents,
                    h1: ({ children }) => <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-10 text-white">{children}</h1>,
                    h2: ({ children, id }) => <h2 id={id} className="text-xl md:text-2xl font-bold tracking-tight mt-12 mb-6 text-white">{children}</h2>,
                    p: ({ children }) => <p className="text-base text-zinc-400 leading-relaxed mb-6">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-zinc-400">{children}</ul>,
                    li: ({ children }) => <li className="text-base">{children}</li>,
                    strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-blue-500 bg-white/[0.03] px-8 py-6 rounded-r-xl text-white italic font-medium my-10">
                        {children}
                      </blockquote>
                    ),
                    code: MarkdownComponents.code
                  }}
                >
                  {DOCS_CONTENT[activeDoc] || `# ${allItems.find(i => i.id === activeDoc)?.label}\n\nContent for this section is coming soon.`}
                </ReactMarkdown>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Nav */}
            <div className="mt-24 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-6">
              {prevItem ? (
                <button
                  onClick={() => {
                    setActiveDoc(prevItem.id as DocId);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto flex items-center gap-3 text-sm font-bold text-zinc-400 hover:text-white transition-all group"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">Previous</span>
                    <span>{prevItem.label}</span>
                  </div>
                </button>
              ) : <div />}

              {nextItem ? (
                <button
                  onClick={() => {
                    setActiveDoc(nextItem.id as DocId);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto flex items-center gap-3 text-sm font-bold text-zinc-400 hover:text-white transition-all group text-right"
                >
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600">Next</span>
                    <span>{nextItem.label}</span>
                  </div>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : <div />}
            </div>
          </div>
        </main>

        {/* Desktop Table of Contents */}
        <aside className="w-64 py-20 px-6 sticky top-14 h-[calc(100vh-3.5rem)] hidden xl:block">
          {toc.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase">On this page</h4>
              <nav className="space-y-3">
                {toc.map(heading => (
                  <button
                    key={heading}
                    onClick={() => {
                      const id = heading.toLowerCase().replace(/\s+/g, '-');
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="block text-xs text-zinc-500 hover:text-white transition-colors text-left"
                  >
                    {heading}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </aside>


      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
