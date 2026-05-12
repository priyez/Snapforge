import { Outlet, createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home01Icon,
  Key01Icon,
  Clock01Icon,
  PlayIcon,
  Logout01Icon,
  Camera01Icon,
  UserIcon,
  Menu01Icon,
  Cancel01Icon,
  ActivityIcon,
  Share01Icon,
  Book02Icon,
  Settings01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { setAuthToken, useMe } from "../lib/api";

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
});

function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('snapforge_auth_token');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { data: user, isLoading } = useMe();

  useEffect(() => {
    if (!token) {
      navigate({ to: '/login', search: {} });
    }
  }, [token, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  if (!token || (token && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <HugeiconsIcon icon={Camera01Icon} size={32} className="animate-pulse text-[var(--text-muted)]" />
      </div>
    );
  }


  const navItems = [
    { label: 'Overview', icon: Home01Icon, to: '/dashboard' },
    { label: 'API Keys', icon: Key01Icon, to: '/dashboard/keys' },
    { label: 'History', icon: Clock01Icon, to: '/dashboard/history' },
    { label: 'Schedules', icon: ActivityIcon, to: '/dashboard/schedules' },
    { label: 'Webhooks', icon: Share01Icon, to: '/dashboard/webhooks' },
    { label: 'Documentation', icon: Book02Icon, to: '/docs' },
    { label: 'Settings', icon: Settings01Icon, to: '/dashboard/settings' },
    { label: 'Playground', icon: PlayIcon, to: '/dashboard/playground' },
  ];

  const SidebarContent = ({ isMobile = false }) => (
    <>
      {/* Brand */}
      <div className={`px-4 h-13 flex items-center border-b border-[var(--border-subtle)] overflow-hidden transition-all duration-200 ${!isMobile && sidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
        <Link to="/" className="flex items-center gap-2.5 text-[var(--text)] no-underline">
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0">
            <img src="/logo.png" className="w-8 h-8" alt="logo" />
          </div>
          {/* {(isMobile || !sidebarCollapsed) && (
            <span className="font-semibold text-sm tracking-tight text-[var(--text)] truncate">SnapForge</span>
          )} */}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-hidden">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: 'active' }}
            activeOptions={{ exact: item.to === '/dashboard' }}
            className={`nav-item ${!isMobile && sidebarCollapsed ? 'justify-center px-0' : ''}`}
            title={!isMobile && sidebarCollapsed ? item.label : undefined}
          >
            <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
            {(isMobile || !sidebarCollapsed) && (
              <span className="truncate">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Collapse Toggle (Desktop only) */}
      {!isMobile && (
        <div className="px-2 py-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="nav-item justify-center hover:bg-[var(--surface-hover)]"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <HugeiconsIcon icon={sidebarCollapsed ? ArrowRight01Icon : ArrowLeft01Icon} size={16} />
          </button>
        </div>
      )}

      {/* User Footer */}
      <div className="px-2 py-3 border-t border-[var(--border-subtle)] space-y-0.5 overflow-hidden">
        {user && (
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center rounded-md transition-all duration-200 hover:bg-[var(--surface-hover)] text-left ${!isMobile && sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3 py-2'}`}
          >
            <div className="w-6 h-6 rounded-full bg-[var(--surface-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <HugeiconsIcon icon={UserIcon} size={13} />
              )}
            </div>
            {(isMobile || !sidebarCollapsed) && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate text-[var(--text)]">{user.name || 'User'}</p>
                <p className="text-xs text-[var(--text-subtle)] truncate">{user.email}</p>
              </div>
            )}
          </button>
        )}
      </div>
    </>
  );

  // Find current page label - reverse to find specific sub-routes before generic parent routes
  const currentLabel = [...navItems].reverse().find(i =>
    location.pathname === i.to || location.pathname.startsWith(i.to + '/')
  )?.label || 'Dashboard';

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Unified Click-Outside Overlay */}
      {(sidebarOpen || isProfileOpen) && (
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-200 ${sidebarOpen ? 'bg-black/60 lg:hidden' : 'bg-transparent'}`}
          onClick={() => {
            setSidebarOpen(false);
            setIsProfileOpen(false);
          }}
        />
      )}

      {/* Profile Popover */}
      {isProfileOpen && (
        <div className="bg-[var(--surface)] border border-[var(--border)] w-[180px] md:w-[240px] rounded-xl z-70 fixed left-4 md:left-64 md:right-auto bottom-20 md:bottom-16 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden">
          <div className="p-4 px-3 border-b border-[var(--border-subtle)]">
            <p className="text-sm font-bold text-[var(--text)]">{user?.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            <Link
              to="/dashboard/settings"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-md transition-colors"
            >
              <HugeiconsIcon icon={Settings01Icon} size={14} />
              Settings
            </Link>
            <Link
              to="/docs"
              onClick={() => setIsProfileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] rounded-md transition-colors"
            >
              <HugeiconsIcon icon={Book02Icon} size={14} />
              Documentation
            </Link>
            <button
              onClick={() => {
                setAuthToken(null);
                window.location.href = '/login';
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)] rounded-md transition-colors border-t border-[var(--border-subtle)] mt-1.5 pt-1.5"
            >
              <HugeiconsIcon icon={Logout01Icon} size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={`sidebar hidden lg:flex ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`sidebar lg:hidden z-50 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent isMobile />
      </aside>

      {/* Main */}
      <main className={`flex-1 min-h-screen flex flex-col main-content-area ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 h-14 bg-[var(--bg)] border-b border-[var(--border-subtle)] sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center">
              <img src="/logo.png" className="w-8 h-8" alt="logo" />
            </div>
            {/* <span className="font-semibold text-sm text-[var(--text)]">SnapForge</span> */}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--text-muted)]"
            aria-label="Toggle menu"
          >
            <HugeiconsIcon icon={sidebarOpen ? Cancel01Icon : Menu01Icon} size={20} />
          </button>
        </div>

        {/* Page */}
        <div className="flex-1 p-4 md:p-4 md:px-0">
          <div className="mx-0 w-full">
            <header className="mb-4 px-0">
              <div className="hidden md:flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[var(--border-subtle)] px-0 md:px-6">
                <div className="flex" />
                <h1 className="text-sm hidden lg:block">{currentLabel}</h1>
                <div className="flex items-center gap-2">
                  <div className="badge badge-success">● API Online</div>
                  <div className="badge badge-outline">{user?.plan ?? 'Free'} Plan</div>
                </div>
              </div>
            </header>

            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
