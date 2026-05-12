import { Link } from '@tanstack/react-router';

export function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-14 h-14 flex items-center justify-center text-black rounded">
              <img src='/logo.png' className='w-16 h-16' />
            </div>
            <span className="font-bold text-sm">SnapForge</span>
          </div>
          <p className="text-xs text-zinc-500">
            The easiest schema-based high-performance screenshot API.
          </p>
        </div>

        <div className="flex items-center gap-8 text-sm font-medium text-zinc-500">
          <Link to="/docs" className="hover:text-white transition-colors">Documentation</Link>
          <a href="https://github.com" className="hover:text-white transition-colors">Github</a>
          <Link to="/login" search={{}} className="hover:text-white transition-colors">Log in</Link>
          <Link to="/register" className="hover:text-white transition-colors font-bold text-white">Sign up</Link>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-12 text-xs text-zinc-600">
        © 2026 SnapForge. All rights reserved.
      </div>
    </footer>
  );
}
