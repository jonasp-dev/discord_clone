import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useRegister } from '@/hooks/queries/useAuth';
import { useAuthStore } from '@/stores/authStore';
import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

export function RegisterPage() {
  const { isAuthenticated } = useAuthStore();
  const register = useRegister();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/channels/@me" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ email, username, password });
  };

  const errorMessage =
    register.error &&
    ((register.error as AxiosError<ApiResponse<never>>).response?.data?.error ??
      'Registration failed. Please try again.');

  return (
    <div className="flex min-h-screen items-center justify-center bg-discord-bg-tertiary">
      <div className="w-full max-w-md rounded-md bg-discord-bg-primary p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-discord-text-primary">
            Create an account
          </h1>
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
              htmlFor="username"
              className="text-xs font-bold uppercase text-discord-text-secondary"
            >
              Username <span className="text-discord-red">*</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={32}
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
              minLength={6}
              className="rounded-[3px] border-none bg-discord-bg-tertiary px-3 py-2.5 text-discord-text-primary outline-none focus:ring-2 focus:ring-discord-blurple"
            />
          </div>

          <button
            type="submit"
            disabled={register.isPending}
            className="mt-2 w-full rounded-[3px] bg-discord-blurple px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-discord-blurple/80 disabled:opacity-50"
          >
            {register.isPending ? 'Creating account...' : 'Continue'}
          </button>

          <p className="mt-1 text-sm text-discord-text-muted">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-discord-text-link hover:underline"
            >
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
