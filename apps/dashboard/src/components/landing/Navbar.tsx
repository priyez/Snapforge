import { Link } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { GithubIcon } from '@hugeicons/core-free-icons';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded flex items-center justify-center">
            <img src="/logo.png" className="w-12 h-12" alt="logo" />
          </div>
          <span className="font-bold tracking-tight text-lg">SnapForge</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-8">
            <Link to="/docs" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Documentation</Link>
            <a href="https://github.com" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              <HugeiconsIcon icon={GithubIcon} size={18} />
            </a>
          </div>
          <Link to="/login" search={{}} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Log in</Link>
          <Link to="/register" className="btn btn-primary h-9 !text-xs">Sign up</Link>
        </div>
      </div>
    </nav>
  );
}
