import { createFileRoute, useNavigate, useSearch, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { setAuthToken } from '../lib/api';
import {
  Alert01Icon,
  GithubIcon,
  GoogleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || undefined,
    error: (search.error as string) || undefined,
  } as { token?: string; error?: string }),
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'token_exchange_failed': return 'Failed to exchange token with provider.';
      case 'no_email': return 'Could not retrieve email from provider.';
      case 'oauth_failed': return 'Authentication failed. Please try again.';
      case 'missing_code': return 'Authorization code was missing.';
      case 'oauth_not_configured': return 'OAuth is not configured. Please add Client ID/Secret to .env';
      default: return 'An unknown error occurred.';
    }
  };

  // Handle OAuth Token or Error from URL
  useEffect(() => {
    if (search.token) {
      setAuthToken(search.token);
      navigate({ to: '/dashboard' });
    }
    if (search.error) {
      setError(getErrorMessage(search.error));
    }
  }, [search, navigate]);

  const handleOAuth = (provider: 'google' | 'github') => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    window.location.href = `${apiBase}/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 text-white selection:bg-white/20">
      <div className="w-full max-w-[400px] space-y-10">
        {/* Header */}
        <div className="text-center space-y-6">
          <Link to='/' className="flex justify-center">
            {/* Logo */}
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <img src='/logo.png' className='w-20 h-20' alt='logo' />
              </div>
            </div>
          </Link>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-gray-400 text-base">Sign in to your account to continue</p>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400 text-sm mb-6">
              <HugeiconsIcon icon={Alert01Icon} size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={() => handleOAuth('google')}
            className="w-full h-[48px] bg-[#111] border border-white/5 rounded-2xl flex items-center justify-center gap-4 font-semibold text-[14px] hover:bg-[#1a1a1a] transition-all active:scale-[0.98]"
          >
            <HugeiconsIcon icon={GoogleIcon} size={20} />
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth('github')}
            className="w-full h-[48px] bg-[#111] border border-white/5 rounded-2xl flex items-center justify-center gap-4 font-semibold text-[14px] hover:bg-[#1a1a1a] transition-all active:scale-[0.98]"
          >
            <HugeiconsIcon icon={GithubIcon} size={20} />
            Continue with GitHub
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-white hover:underline underline-offset-4 ml-1">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
