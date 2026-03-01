import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useLogin } from '@/hooks/queries/useAuth';
import { useAuthStore } from '@/stores/authStore';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

export function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/channels/@me" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  const errorMessage =
    login.error &&
    ((login.error as AxiosError<ApiResponse<never>>).response?.data?.error ??
      'Login failed. Please try again.');

  return (
    <div className="flex min-h-screen items-center justify-center bg-discord-bg-tertiary">
      <div className="w-full max-w-md rounded-md bg-discord-bg-primary p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-discord-text-primary">
            Welcome back!
          </h1>
          <p className="mt-1 text-discord-text-muted">
            We're so excited to see you again!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMessage && (
            <div className="rounded bg-discord-red/10 p-3 text-sm text-discord-red">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-xs font-bold uppercase text-discord-text-secondary"
            >
              Email <span className="text-discord-red">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-[3px] border-none bg-discord-bg-tertiary px-3 py-2.5 text-discord-text-primary outline-none focus:ring-2 focus:ring-discord-blurple"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-xs font-bold uppercase text-discord-text-secondary"
            >
              Password <span className="text-discord-red">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-[3px] border-none bg-discord-bg-tertiary px-3 py-2.5 text-discord-text-primary outline-none focus:ring-2 focus:ring-discord-blurple"
            />
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="mt-2 w-full rounded-[3px] bg-discord-blurple px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-discord-blurple/80 disabled:opacity-50"
          >
            {login.isPending ? 'Logging in...' : 'Log In'}
          </button>

          <p className="mt-1 text-sm text-discord-text-muted">
            Need an account?{' '}
            <Link
              to="/register"
              className="text-discord-text-link hover:underline"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
